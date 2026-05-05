import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, getRequestAuth, getOrCreateUser } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'

const router = Router()

const CreateDisputeSchema = z.object({
  orderId:     z.string().cuid(),
  disputeType: z.enum(['wrong_part', 'damaged_on_delivery', 'not_delivered', 'incorrect_listing', 'invoice_dispute']),
  description: z.string().min(10).max(2000),
  evidence:    z.array(z.string().url()).default([]),
})

const RespondDisputeSchema = z.object({
  dealerResponse: z.string().min(1).max(2000),
})

const ResolveDisputeSchema = z.object({
  platformRecommendation: z.string().min(1).max(2000),
  status: z.enum(['resolved', 'escalated', 'closed']),
})

const ListDisputeSchema = z.object({
  status: z.enum(['open', 'under_review', 'resolved', 'escalated', 'closed']).optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
})

// ── POST /v1/disputes — raise a dispute against an order
router.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const { orderId, disputeType, description, evidence } = CreateDisputeSchema.parse(req.body)
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      include: { disputes: true },
    })
    if (!order) throw createHttpError(404, 'Order not found')
    if (order.buyerId !== user.id) throw createHttpError(403, 'Forbidden — only the buyer can raise a dispute')

    // Prevent duplicate open disputes on the same order for the same type
    const existing = order.disputes.find(
      (d) => d.disputeType === disputeType && ['open', 'under_review'].includes(d.status),
    )
    if (existing) throw createHttpError(409, 'An open dispute of this type already exists for this order')

    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        raisedById: user.id,
        disputeType,
        description,
        evidence,
      },
    })

    // Mark order as disputed
    await prisma.order.update({ where: { id: orderId }, data: { status: 'disputed' } })

    await publishEvent('dispute.raised', dispute.id, {
      disputeId:   dispute.id,
      orderId,
      disputeType,
      raisedById:  user.id,
    })

    res.status(201).json({ data: dispute })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/disputes — list disputes visible to the caller
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const { status, page, limit } = ListDisputeSchema.parse(req.query)
    const skip  = (page - 1) * limit
    const auth  = getRequestAuth(req)
    const user  = await getOrCreateUser(auth.userId!)

    // Buyers see their own disputes; dealers see disputes on their orders' parts; admins see all
    const isAdmin = ['platform_admin', 'insurer_admin'].includes(user.role)

    // Build where clause
    // For non-admins: buyer sees disputes they raised; dealer sees disputes on orders containing their parts
    let where: Record<string, unknown> = {}
    if (!isAdmin) {
      where = {
        OR: [
          { raisedById: user.id },
          // dealer: orders that have at least one item from their parts
          {
            order: {
              items: {
                some: { part: { dealerId: user.id } },
              },
            },
          },
        ],
      }
    }
    if (status) where = { ...where, status }

    const [disputes, total] = await prisma.$transaction([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          raisedBy: { select: { id: true, name: true, email: true } },
          order:    { select: { id: true, claimReference: true, totalAmount: true, currency: true } },
        },
      }),
      prisma.dispute.count({ where }),
    ])

    const pages = Math.ceil(total / limit)
    res.json({ data: disputes, meta: { total, page, limit, pages } })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/disputes/:id — get a single dispute
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth    = getRequestAuth(req)
    const user    = await getOrCreateUser(auth.userId!)
    const dispute = await prisma.dispute.findUnique({
      where:   { id: req.params.id },
      include: {
        raisedBy: { select: { id: true, name: true, email: true } },
        order:    {
          include: {
            items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
          },
        },
      },
    })
    if (!dispute) throw createHttpError(404, 'Dispute not found')

    const isAdmin = ['platform_admin', 'insurer_admin'].includes(user.role)
    const isOwner = dispute.raisedById === user.id
    if (!isAdmin && !isOwner) throw createHttpError(403, 'Forbidden')

    res.json({ data: dispute })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/disputes/:id/respond — dealer adds a response
router.patch('/:id/respond', requireClerkAuth, async (req, res, next) => {
  try {
    const { dealerResponse } = RespondDisputeSchema.parse(req.body)
    const auth    = getRequestAuth(req)
    const user    = await getOrCreateUser(auth.userId!)
    const dispute = await prisma.dispute.findUnique({
      where:   { id: req.params.id },
      include: { order: { include: { items: { include: { part: true } } } } },
    })
    if (!dispute) throw createHttpError(404, 'Dispute not found')

    // Only a dealer whose part is in the order can respond
    const partBelongsToDealer = dispute.order.items.some((i) => i.part.dealerId === user.id)
    const isAdmin = ['platform_admin'].includes(user.role)
    if (!partBelongsToDealer && !isAdmin) throw createHttpError(403, 'Forbidden')

    const updated = await prisma.dispute.update({
      where: { id: dispute.id },
      data:  { dealerResponse, status: 'under_review' },
    })

    await publishEvent('dispute.responded', dispute.id, { disputeId: dispute.id, orderId: dispute.orderId })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/disputes/:id/resolve — platform admin resolves
router.patch('/:id/resolve', requireClerkAuth, async (req, res, next) => {
  try {
    const { platformRecommendation, status } = ResolveDisputeSchema.parse(req.body)
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)
    if (!['platform_admin', 'insurer_admin'].includes(user.role)) throw createHttpError(403, 'Forbidden')

    const dispute = await prisma.dispute.findUnique({ where: { id: req.params.id } })
    if (!dispute) throw createHttpError(404, 'Dispute not found')

    const updated = await prisma.dispute.update({
      where: { id: dispute.id },
      data:  {
        platformRecommendation,
        status,
        resolvedAt: ['resolved', 'closed'].includes(status) ? new Date() : null,
      },
    })

    await publishEvent('dispute.resolved', dispute.id, { disputeId: dispute.id, status })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export default router
