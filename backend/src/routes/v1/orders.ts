import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, getRequestAuth, getOrCreateUser } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'

const router = Router()

const CreateOrderSchema = z.object({
  claimReference: z.string().optional(),
  currency: z.string().length(3),
  items: z
    .array(
      z.object({
        partId: z.string().cuid(),
        quantity: z.number().int().positive().default(1),
        price: z.number().positive(),
      })
    )
    .min(1),
})

const ListOrdersSchema = z.object({
  view:  z.enum(['buyer', 'seller']).optional(),
  q:     z.string().optional(),
  tab:   z.enum(['all', 'pending', 'active', 'confirmed', 'delivered', 'disputed']).optional(),
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ── GET /v1/orders
// ?view=seller — dealers see orders placed for their parts
// ?q=          — filter by claim reference (case-insensitive substring)
// ?page=&limit= — pagination
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const { view, q, tab, page, limit } = ListOrdersSchema.parse(req.query)
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const isSellerView =
      view === 'seller' &&
      (user.role === 'dealer_owner' || user.role === 'dealer_staff' || user.role === 'platform_admin')

    const skip = (page - 1) * limit

    const tabWhere =
      tab === 'pending'   ? { status: 'pending' }
      : tab === 'active'    ? { status: { in: ['confirmed', 'dispatched'] } }
      : tab === 'confirmed' ? { status: 'confirmed' }
      : tab === 'delivered' ? { status: { in: ['delivered', 'completed'] } }
      : tab === 'disputed'  ? { status: 'disputed' }
      : {}

    const where = {
      ...(isSellerView
        ? { items: { some: { part: { dealerId: user.id } } } }
        : { buyerId: user.id }),
      ...(q && { claimReference: { contains: q, mode: 'insensitive' as const } }),
      ...tabWhere,
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          buyer: isSellerView ? { select: { id: true, name: true, email: true } } : false,
          items: { include: { part: { select: { id: true, name: true } } } },
          delivery: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    res.json({
      data: orders,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/orders/:id
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { id: true, name: true, oemNumber: true, condition: true, dealerId: true } } } },
        delivery: true,
      },
    })

    if (!order) throw createHttpError(404, 'Order not found')

    // Allow: buyer, the dealer who owns the part(s), or platform admin
    const isBuyer = order.buyerId === user.id
    const isSeller = order.items.some((item: { part: { dealerId: string } }) => item.part.dealerId === user.id)
    if (!isBuyer && !isSeller && auth.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    res.json({ data: order })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/orders
router.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const data = CreateOrderSchema.parse(req.body)
    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        claimReference: data.claimReference,
        currency: data.currency,
        totalAmount,
        items: {
          create: data.items.map((item) => ({
            partId: item.partId,
            quantity: item.quantity,
            price: item.price,
            currency: data.currency,
          })),
        },
      },
      include: { items: true },
    })

    publishEvent('order_events', order.id, {
      event_type: 'ORDER_CREATED',
      order_id: order.id,
      buyer_id: user.id,
      claim_reference: data.claimReference ?? null,
      currency: data.currency,
      total_amount: totalAmount,
      item_count: data.items.length,
    }).catch((e) => console.warn('[orders] Kafka publish failed:', e))

    res.status(201).json({ data: order })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/orders/:id/delivery-location
// Buyer (garage) sets or overrides the delivery destination for a specific order.
// Prefers this over the user's saved profile location when a delivery is created.
router.patch('/:id/delivery-location', requireClerkAuth, async (req, res, next) => {
  try {
    const { lat, lng, address } = z.object({
      lat:     z.number().finite(),
      lng:     z.number().finite(),
      address: z.string().max(500).optional(),
    }).parse(req.body)

    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) throw createHttpError(404, 'Order not found')

    // Only the buyer or platform_admin may set the delivery location
    if (order.buyerId !== user.id && user.role !== 'platform_admin') {
      throw createHttpError(403, 'Only the buyer can set the delivery location for this order')
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { deliveryLat: lat, deliveryLng: lng, deliveryAddress: address ?? null },
    })

    publishEvent('order_events', req.params.id, {
      event_type: 'ORDER_DELIVERY_LOCATION_SET',
      order_id: req.params.id,
      actor_id: user.id,
      actor_role: user.role,
      lat,
      lng,
      address: address ?? null,
    }).catch((e) => console.warn('[orders] Kafka publish failed:', e))

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/orders/:id/status
router.patch('/:id/status', requireClerkAuth, async (req, res, next) => {
  try {
    const { status } = z
      .object({
        status: z.enum([
          'confirmed',
          'dispatched',
          'delivered',
          'completed',
          'cancelled',
          'disputed',
        ]),
      })
      .parse(req.body)

    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { part: { select: { dealerId: true } } } } },
    })
    if (!order) throw createHttpError(404, 'Order not found')

    const isBuyer  = order.buyerId === user.id
    const isSeller = order.items.some((item: { part: { dealerId: string } }) => item.part.dealerId === user.id)
    if (!isBuyer && !isSeller && auth.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    // ── State machine enforcement ─────────────────────────────────────────
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending:    ['confirmed', 'cancelled'],
      confirmed:  ['dispatched', 'cancelled'],
      dispatched: ['delivered', 'cancelled'],
      delivered:  ['completed', 'disputed'],
      completed:  [],
      cancelled:  [],
      disputed:   ['completed', 'cancelled'],
    }
    const allowed = VALID_TRANSITIONS[order.status] ?? []
    if (!allowed.includes(status)) {
      throw createHttpError(
        422,
        `Invalid transition: ${order.status} → ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      )
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    })

    publishEvent('order_events', req.params.id, {
      event_type: 'ORDER_STATUS_CHANGED',
      order_id: req.params.id,
      previous_status: order.status,
      new_status: status,
      actor_id: user.id,
      actor_role: user.role,
    }).catch((e) => console.warn('[orders] Kafka publish failed:', e))

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export default router
