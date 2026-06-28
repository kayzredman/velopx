import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, getRequestAuth } from '../../middleware/clerkAuth'
import { requireRequestUser } from '../../lib/resolveUser'
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

const ListQuotesSchema = z.object({
  q:     z.string().optional(),
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ── GET /v1/quotes — list quotes for authenticated user
// ?q=&page=&limit= — search by claimReference + pagination
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)
    const { q, page, limit } = ListQuotesSchema.parse(req.query)

    const skip = (page - 1) * limit
    const where = {
      requesterId: user.id,
      ...(q && { claimReference: { contains: q, mode: 'insensitive' as const } }),
    }

    const [quotes, total] = await prisma.$transaction([
      prisma.quote.findMany({
        where,
        include: {
          items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ])

    res.json({
      data: quotes,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/quotes/for-dealer — quotes referencing parts owned by the authenticated dealer
router.get('/for-dealer', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)
    const { q, page, limit } = ListQuotesSchema.parse(req.query)

    const skip = (page - 1) * limit
    const where = {
      items: { some: { part: { dealerId: user.id } } },
      ...(q && { claimReference: { contains: q, mode: 'insensitive' as const } }),
    }

    const [quotes, total] = await prisma.$transaction([
      prisma.quote.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              part: { select: { id: true, name: true, oemNumber: true, condition: true, price: true, currency: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ])

    res.json({
      data: quotes,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/quotes/:id
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

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
    if (quote.requesterId !== user.id && !isDealerOnQuote && user.role !== 'platform_admin') {
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
    const user = await requireRequestUser(req)

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

// ── PATCH /v1/quotes/:id/status — requester accepts or declines a responded quote
router.patch('/:id/status', requireClerkAuth, async (req, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(['accepted', 'declined']) })
      .parse(req.body)

    const user = await requireRequestUser(req)

    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { dealerId: true } } } },
      },
    })
    if (!quote) throw createHttpError(404, 'Quote not found')

    const isRequester = quote.requesterId === user.id

    if (!isRequester && user.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }
    if (quote.status !== 'responded') {
      throw createHttpError(400, 'Quote must be in responded status before accepting or declining')
    }

    let createdOrder: { id: string } | null = null

    if (status === 'accepted') {
      // Atomically: mark quote accepted + create order from quote items
      const currency = quote.items[0]?.currency ?? 'GHS'
      const totalAmount = quote.items.reduce((sum, i) => sum + Number(i.price), 0)

      const [updated, order] = await prisma.$transaction([
        prisma.quote.update({ where: { id: req.params.id }, data: { status } }),
        prisma.order.create({
          data: {
            buyerId: user.id,
            claimReference: quote.claimReference,
            currency,
            totalAmount,
            items: {
              create: quote.items.map((item) => ({
                partId: item.partId,
                quantity: 1,
                price: item.price,
                currency: item.currency,
              })),
            },
          },
        }),
      ])

      createdOrder = order

      await publishEvent('quote_events', req.params.id, {
        event_type: 'QUOTE_ACCEPTED',
        quote_id: req.params.id,
        requester_id: user.id,
        claim_reference: quote.claimReference ?? null,
        order_id: order.id,
      })

      return res.json({ data: updated, orderId: createdOrder.id })
    }

    // declined path
    const updated = await prisma.quote.update({
      where: { id: req.params.id },
      data: { status },
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/quotes/:id/respond — dealer responds with pricing
const RespondSchema = z.object({
  items: z.array(
    z.object({
      quoteItemId: z.string().cuid(),
      price: z.number().positive(),
      currency: z.string().length(3),
      note: z.string().optional(),
    }),
  ).min(1),
})

router.patch('/:id/respond', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { dealerId: true } } } },
      },
    })
    if (!quote) throw createHttpError(404, 'Quote not found')
    if (quote.status !== 'pending') {
      throw createHttpError(400, 'Only pending quotes can be responded to')
    }

    // Verify caller is a dealer whose parts appear on this quote
    const dealerItemIds = new Set(
      quote.items.filter((i) => i.part.dealerId === user.id).map((i) => i.id),
    )
    if (dealerItemIds.size === 0) throw createHttpError(403, 'Forbidden')

    const { items } = RespondSchema.parse(req.body)

    // Only allow updating items that belong to this dealer
    const invalidItem = items.find((i) => !dealerItemIds.has(i.quoteItemId))
    if (invalidItem) throw createHttpError(403, 'One or more items do not belong to your catalogue')

    await prisma.$transaction([
      ...items.map((item) =>
        prisma.quoteItem.update({
          where: { id: item.quoteItemId },
          data: { price: item.price, currency: item.currency, note: item.note },
        }),
      ),
      prisma.quote.update({
        where: { id: req.params.id },
        data: { status: 'responded' },
      }),
    ])

    await publishEvent('quote_events', req.params.id, {
      event_type: 'QUOTE_RESPONDED',
      quote_id: req.params.id,
      dealer_id: user.id,
      claim_reference: quote.claimReference ?? null,
    })

    const updated = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
      },
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/quotes/:id/dealer-decline — dealer declines a pending RFQ
router.patch('/:id/dealer-decline', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { dealerId: true } } } },
      },
    })
    if (!quote) throw createHttpError(404, 'Quote not found')
    if (quote.status !== 'pending') {
      throw createHttpError(400, 'Only pending quotes can be declined')
    }

    const isDealerOnQuote = quote.items.some((i) => i.part.dealerId === user.id)
    if (!isDealerOnQuote && user.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    const updated = await prisma.quote.update({
      where: { id: req.params.id },
      data: { status: 'declined' },
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export default router
