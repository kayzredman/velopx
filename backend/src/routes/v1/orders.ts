import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth } from '../../middleware/clerkAuth'
import { requireRequestUser } from '../../lib/resolveUser'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'
import { isDealerOnOrder } from '../../lib/deliveryAccess'

const router = Router()

const orderInclude = {
  items: { include: { part: { select: { id: true, name: true, oemNumber: true, condition: true, dealerId: true } } } },
  delivery: true,
} as const

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

// ── GET /v1/orders/for-dealer — orders containing seller's parts
router.get('/for-dealer', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const orders = await prisma.order.findMany({
      where: {
        items: { some: { part: { dealerId: user.id } } },
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: orders })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/orders — buyer's orders
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        items: { include: { part: { select: { id: true, name: true } } } },
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: orders })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/orders/:id
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    })

    if (!order) throw createHttpError(404, 'Order not found')

    const isBuyer = order.buyerId === user.id
    const isDealer = isDealerOnOrder(order, user.id)
    if (!isBuyer && !isDealer && user.role !== 'platform_admin') {
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
    const user = await requireRequestUser(req)

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

    await publishEvent('order_events', order.id, {
      event_type: 'ORDER_CREATED',
      order_id: order.id,
      buyer_id: user.id,
      claim_reference: data.claimReference ?? null,
      currency: data.currency,
      total_amount: totalAmount,
      item_count: data.items.length,
    })

    res.status(201).json({ data: order })
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

    const user = await requireRequestUser(req)

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { part: { select: { dealerId: true } } } } },
    })
    if (!order) throw createHttpError(404, 'Order not found')

    const isBuyer = order.buyerId === user.id
    const isDealer = isDealerOnOrder(order, user.id)

    if (!isBuyer && !isDealer && user.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    const dealerAllowed: typeof status[] = ['confirmed', 'dispatched', 'cancelled']
    const buyerAllowed: typeof status[] = ['completed', 'cancelled', 'disputed']

    if (isDealer && !isBuyer && !dealerAllowed.includes(status)) {
      throw createHttpError(403, 'Dealers can only confirm, dispatch, or cancel orders')
    }
    if (isBuyer && !isDealer && !buyerAllowed.includes(status)) {
      throw createHttpError(403, 'Buyers cannot set this order status')
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    })

    await publishEvent('order_events', req.params.id, {
      event_type: 'ORDER_STATUS_CHANGED',
      order_id: req.params.id,
      previous_status: order.status,
      new_status: status,
      actor_id: user.id,
      actor_role: user.role,
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export default router
