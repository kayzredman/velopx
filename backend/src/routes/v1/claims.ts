import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, getRequestAuth } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'

const router = Router()

const LineItemSchema = z.object({
  partId:        z.string().cuid().optional(),
  partName:      z.string().min(1),
  oemNumber:     z.string().optional(),
  invoicePrice:  z.number().positive(),
  benchmarkLow:  z.number().positive().optional(),
  benchmarkHigh: z.number().positive().optional(),
  deviation:     z.number().optional(),
  currency:      z.string().length(3).default('GHS'),
})

const CreateClaimSchema = z.object({
  claimReference: z.string().min(1),
  garageName:     z.string().optional(),
  vehicleProfile: z.record(z.unknown()).optional(),
  invoiceAmount:  z.number().positive(),
  currency:       z.string().length(3).default('GHS'),
  lineItems:      z.array(LineItemSchema).min(1),
})

const UpdateClaimSchema = z.object({
  status:         z.enum(['open', 'under_review', 'closed']).optional(),
  flag:           z.enum(['ok', 'review', 'flagged']).optional(),
  outcome:        z.enum(['approved', 'adjusted', 'rejected']).optional(),
  benchmarkAmount: z.number().positive().optional(),
})

// ── GET /v1/claims
// Assessors see their own claims; insurer_admin sees claims for their org
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const allowedRoles = ['assessor', 'insurer_admin', 'insurer_staff', 'platform_admin']
    if (!allowedRoles.includes(user.role)) throw createHttpError(403, 'Forbidden')

    // Parse query params
    const querySchema = z.object({
      flag:  z.enum(['ok', 'review', 'flagged']).optional(),
      limit: z.coerce.number().int().min(1).max(1000).default(200),
    })
    const { flag, limit } = querySchema.parse(req.query)

    const baseWhere =
      user.role === 'platform_admin'
        ? {}
        : user.role === 'insurer_admin' || user.role === 'insurer_staff'
          ? { assessor: { organisationId: user.organisationId ?? undefined } }
          : { assessorId: user.id }

    const where = flag ? { ...baseWhere, flag } : baseWhere

    const claims = await prisma.claim.findMany({
      where,
      include: {
        assessor: { select: { id: true, name: true, email: true } },
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    res.json({ data: claims })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/claims/:id
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: {
        assessor: { select: { id: true, name: true, email: true } },
        lineItems: { include: { part: { select: { id: true, name: true, oemNumber: true, price: true, currency: true } } } },
      },
    })
    if (!claim) throw createHttpError(404, 'Claim not found')

    // Access: own claim, or insurer (same org), or platform_admin
    const isOwner   = claim.assessorId === user.id
    const isAdmin   = user.role === 'platform_admin'
    const isInsurer = (user.role === 'insurer_admin' || user.role === 'insurer_staff') &&
                      user.organisationId != null &&
                      claim.assessor.id != null
    if (!isOwner && !isAdmin && !isInsurer) throw createHttpError(403, 'Forbidden')

    res.json({ data: claim })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/claims
router.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')
    if (user.role !== 'assessor' && user.role !== 'platform_admin') throw createHttpError(403, 'Forbidden')

    const body = CreateClaimSchema.parse(req.body)

    const existing = await prisma.claim.findUnique({ where: { claimReference: body.claimReference } })
    if (existing) throw createHttpError(409, 'Claim reference already exists')

    const claim = await prisma.claim.create({
      data: {
        assessorId:     user.id,
        claimReference: body.claimReference,
        garageName:     body.garageName,
        vehicleProfile: body.vehicleProfile as unknown as import('@prisma/client').Prisma.InputJsonValue,
        invoiceAmount:  body.invoiceAmount,
        currency:       body.currency,
        lineItems: {
          create: body.lineItems.map((li) => ({
            partId:        li.partId,
            partName:      li.partName,
            oemNumber:     li.oemNumber,
            invoicePrice:  li.invoicePrice,
            benchmarkLow:  li.benchmarkLow,
            benchmarkHigh: li.benchmarkHigh,
            deviation:     li.deviation,
            currency:      li.currency,
          })),
        },
      },
      include: { lineItems: true },
    })

    void publishEvent('audit_events', claim.id, {
      type: 'CLAIM_CREATED', assessorId: user.id, claimReference: body.claimReference,
    })

    res.status(201).json({ data: claim })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/claims/:id  — update status / flag / outcome / benchmarkAmount
router.patch('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } })
    if (!claim) throw createHttpError(404, 'Claim not found')
    if (claim.assessorId !== user.id && user.role !== 'platform_admin') throw createHttpError(403, 'Forbidden')

    const body = UpdateClaimSchema.parse(req.body)

    const updated = await prisma.claim.update({
      where: { id: req.params.id },
      data: body,
    })

    void publishEvent('audit_events', claim.id, {
      type: 'CLAIM_UPDATED', assessorId: user.id, changes: body,
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/claims/:id/export — download full claim + audit trail as JSON ────
router.post('/:id/export', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const claim = await prisma.claim.findUnique({
      where:   { id: req.params.id },
      include: {
        assessor:  { select: { id: true, name: true, email: true } },
        lineItems: true,
      },
    })
    if (!claim) throw createHttpError(404, 'Claim not found')

    const isAllowed = ['assessor', 'insurer_admin', 'insurer_staff', 'platform_admin'].includes(user.role)
    if (!isAllowed) throw createHttpError(403, 'Forbidden')

    // Fetch relevant audit events for this claim reference
    const auditTrail = await prisma.auditEvent.findMany({
      where:   { claimReference: claim.claimReference },
      orderBy: { createdAt: 'asc' },
      select:  { id: true, actionType: true, outcome: true, createdAt: true, metadata: true, role: true },
    })

    void publishEvent('audit_events', claim.id, {
      type: 'CLAIM_EXPORTED', userId: user.id, claimReference: claim.claimReference,
    })

    const report = {
      exportedAt:     new Date().toISOString(),
      exportedBy:     { id: user.id, name: user.name, email: user.email },
      claim: {
        ...claim,
        invoiceAmount:   Number(claim.invoiceAmount),
        benchmarkAmount: claim.benchmarkAmount ? Number(claim.benchmarkAmount) : null,
        lineItems: claim.lineItems.map((li) => ({
          ...li,
          invoicePrice:  Number(li.invoicePrice),
          benchmarkLow:  li.benchmarkLow  ? Number(li.benchmarkLow)  : null,
          benchmarkHigh: li.benchmarkHigh ? Number(li.benchmarkHigh) : null,
        })),
      },
      auditTrail,
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="claim-${claim.claimReference}.json"`,
    )
    res.json(report)
  } catch (err) {
    next(err)
  }
})

export default router
