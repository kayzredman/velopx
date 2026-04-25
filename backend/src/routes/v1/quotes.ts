import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, getRequestAuth } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'

const router = Router()

const QuoteItemSchema = z.object({
  partId: z.string().cuid(),
  price: z.number().positive(),
  currency: z.string().length(3),
  note: z.string().optional(),
})

const CreateQuoteSchema = z.object({
  claimReference: z.string().optional(),
  vehicleProfile: z
    .object({
      vin: z.string().optional(),
      make: z.string(),
      model: z.string(),
      year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
      engine: z.string().optional(),
      bodyType: z.string().optional(),
    })
    .optional(),
  items: z.array(QuoteItemSchema).min(1),
  expiresAt: z.string().datetime().optional(),
})

// ── GET /v1/quotes — list quotes for authenticated user
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const quotes = await prisma.quote.findMany({
      where: { requesterId: user.id },
      include: {
        items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: quotes })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/quotes/for-dealer — quotes referencing parts owned by the authenticated dealer
router.get('/for-dealer', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const quotes = await prisma.quote.findMany({
      where: {
        items: { some: { part: { dealerId: user.id } } },
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            part: { select: { id: true, name: true, oemNumber: true, condition: true, price: true, currency: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: quotes })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/quotes/:id
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            part: { select: { id: true, name: true, oemNumber: true, condition: true, dealer: { select: { id: true, name: true } } } },
          },
        },
      },
    })

    if (!quote) throw createHttpError(404, 'Quote not found')

    // Only the requester, a dealer whose parts are on the quote, or platform_admin can view
    const isDealerOnQuote = quote.items.some((item) => item.part.dealer.id === user.id)
    if (quote.requesterId !== user.id && !isDealerOnQuote && auth.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    res.json({ data: quote })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/quotes — create a quote request
router.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const data = CreateQuoteSchema.parse(req.body)

    const quote = await prisma.quote.create({
      data: {
        requesterId: user.id,
        claimReference: data.claimReference,
        vehicleProfile: data.vehicleProfile,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        items: {
          create: data.items.map((item) => ({
            partId: item.partId,
            price: item.price,
            currency: item.currency,
            note: item.note,
          })),
        },
      },
      include: { items: true },
    })

    res.status(201).json({ data: quote })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/quotes/:id/status — accept / decline / mark responded
router.patch('/:id/status', requireClerkAuth, async (req, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(['responded', 'accepted', 'declined']) })
      .parse(req.body)

    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const quote = await prisma.quote.findUnique({ where: { id: req.params.id } })
    if (!quote) throw createHttpError(404, 'Quote not found')
    if (quote.requesterId !== user.id && auth.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    const updated = await prisma.quote.update({
      where: { id: req.params.id },
      data: { status },
    })

    if (status === 'accepted') {
      await publishEvent('quote_events', req.params.id, {
        event_type: 'QUOTE_ACCEPTED',
        quote_id: req.params.id,
        requester_id: user.id,
        claim_reference: quote.claimReference ?? null,
      })
    }

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export default router
