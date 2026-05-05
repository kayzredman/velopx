import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, getRequestAuth } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'

const router = Router()

const CreateJobCardSchema = z.object({
  customerName:   z.string().min(1),
  vehicleReg:     z.string().optional(),
  vehicleProfile: z.record(z.unknown()).optional(),
  description:    z.string().min(1),
  mechanic:       z.string().optional(),
  claimReference: z.string().optional(),
  orderIds:       z.array(z.string().cuid()).optional(),
})

const UpdateJobCardSchema = z.object({
  status:         z.enum(['waiting_for_parts', 'in_progress', 'complete', 'cancelled']).optional(),
  mechanic:       z.string().optional(),
  description:    z.string().optional(),
  claimReference: z.string().optional(),
  vehicleReg:     z.string().optional(),
})

const ListJobCardsSchema = z.object({
  q:     z.string().optional(),
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ── GET /v1/job-cards
// ?q=&page=&limit= — search by customerName / vehicleReg + pagination
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const { q, page, limit } = ListJobCardsSchema.parse(req.query)
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const allowedRoles = ['garage_owner', 'garage_staff', 'platform_admin']
    if (!allowedRoles.includes(user.role)) throw createHttpError(403, 'Forbidden')

    const skip = (page - 1) * limit
    const where = {
      ...(user.role === 'platform_admin' ? {} : { garageId: user.id }),
      ...(q && {
        OR: [
          { customerName: { contains: q, mode: 'insensitive' as const } },
          { vehicleReg:   { contains: q, mode: 'insensitive' as const } },
          { claimReference: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [cards, total] = await prisma.$transaction([
      prisma.jobCard.findMany({
        where,
        include: {
          orders: {
            include: {
              items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
              delivery: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobCard.count({ where }),
    ])

    res.json({
      data: cards,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/job-cards/:id
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const card = await prisma.jobCard.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          include: {
            items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
            delivery: true,
          },
        },
      },
    })
    if (!card) throw createHttpError(404, 'Job card not found')
    if (card.garageId !== user.id && user.role !== 'platform_admin') throw createHttpError(403, 'Forbidden')

    res.json({ data: card })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/job-cards
router.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')
    if (user.role !== 'garage_owner' && user.role !== 'garage_staff' && user.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    const body = CreateJobCardSchema.parse(req.body)

    const card = await prisma.jobCard.create({
      data: {
        garageId:       user.id,
        customerName:   body.customerName,
        vehicleReg:     body.vehicleReg,
        vehicleProfile: body.vehicleProfile as unknown as import('@prisma/client').Prisma.InputJsonValue,
        description:    body.description,
        mechanic:       body.mechanic,
        claimReference: body.claimReference,
        ...(body.orderIds?.length
          ? { orders: { connect: body.orderIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { orders: true },
    })

    void publishEvent('audit_events', card.id, {
      type: 'JOB_CARD_CREATED', garageId: user.id,
    })

    res.status(201).json({ data: card })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/job-cards/:id — update status / mechanic / details
router.patch('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const card = await prisma.jobCard.findUnique({ where: { id: req.params.id } })
    if (!card) throw createHttpError(404, 'Job card not found')
    if (card.garageId !== user.id && user.role !== 'platform_admin') throw createHttpError(403, 'Forbidden')

    const body = UpdateJobCardSchema.parse(req.body)

    const updated = await prisma.jobCard.update({
      where: { id: req.params.id },
      data: body,
    })

    void publishEvent('audit_events', card.id, {
      type: 'JOB_CARD_UPDATED', garageId: user.id, changes: body,
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/job-cards/:id/orders — link an existing order to a job card
router.post('/:id/orders', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const card = await prisma.jobCard.findUnique({ where: { id: req.params.id } })
    if (!card) throw createHttpError(404, 'Job card not found')
    if (card.garageId !== user.id && user.role !== 'platform_admin') throw createHttpError(403, 'Forbidden')

    const { orderId } = z.object({ orderId: z.string().cuid() }).parse(req.body)

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw createHttpError(404, 'Order not found')
    if (order.buyerId !== user.id) throw createHttpError(403, 'Cannot link an order you did not place')

    await prisma.order.update({
      where: { id: orderId },
      data: { jobCardId: req.params.id },
    })

    res.json({ data: { linked: true } })
  } catch (err) {
    next(err)
  }
})

export default router
