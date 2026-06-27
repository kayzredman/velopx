import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, getRequestAuth, getOrCreateUser } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'

const router = Router()

const SUPPORTED_PROVIDERS = ['flutterwave', 'paystack', 'dpo', 'peach', 'ozow'] as const

// ── POST /v1/payments — enqueue payment initiation (Tier-2 async)
//
// Flow: validate → create/reset pending Payment record → emit payment.initiate
//       → return 202 Accepted immediately.
//
// paymentConsumer handles the actual provider call (Flutterwave / scaffold),
// writes providerRef + checkoutUrl back to the Payment record, and emits
// payment.initiated when done. Clients poll GET /v1/payments/for-order/:orderId.
//
// Going live: set FLUTTERWAVE_SECRET_KEY in .env — zero code change needed.
router.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      orderId:     z.string().cuid(),
      method:      z.enum(['mobile_money', 'card', 'bank_transfer', 'cash_on_delivery', 'purchase_order']),
      phoneNumber: z.string().optional(),
      provider:    z.enum(SUPPORTED_PROVIDERS).default('flutterwave'),
    })

    const { orderId, method, phoneNumber, provider } = schema.parse(req.body)
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      include: { payment: true },
    })
    if (!order) throw createHttpError(404, 'Order not found')
    if (order.buyerId !== user.id) throw createHttpError(403, 'Forbidden')
    if (order.payment && ['completed', 'processing'].includes(order.payment.status)) {
      throw createHttpError(409, 'Payment already in progress or completed for this order')
    }

    // Create/reset pending record so clients can poll status immediately
    const payment = await prisma.payment.upsert({
      where:  { orderId },
      update: {
        status:              'pending',
        provider,
        method,
        phoneNumber,
        providerRef:         null,
        providerCheckoutUrl: null,
        failureReason:       null,
        updatedAt:           new Date(),
      },
      create: {
        orderId,
        payerId:  user.id,
        amount:   order.totalAmount,
        currency: order.currency,
        method,
        provider,
        phoneNumber,
      },
    })

    // Command event — paymentConsumer does the provider call
    await publishEvent('payment.initiate', payment.id, {
      paymentId:   payment.id,
      orderId,
      amount:      Number(order.totalAmount),
      currency:    order.currency,
      method,
      provider,
      phoneNumber,
      email:       user.email,
      name:        user.name ?? user.email,
    })

    res.status(202).json({ data: payment })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/payments/:id — get payment status
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const payment = await prisma.payment.findUnique({
      where:   { id: req.params.id },
      include: { order: { select: { buyerId: true } } },
    })

    if (!payment) throw createHttpError(404, 'Payment not found')
    if (payment.payerId !== user.id && auth.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    res.json({ data: payment })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/payments/for-order/:orderId — get payment for a specific order
router.get('/for-order/:orderId', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)

    const payment = await prisma.payment.findUnique({
      where: { orderId: req.params.orderId },
    })

    if (!payment) {
      res.json({ data: null })
      return
    }

    if (payment.payerId !== user.id && auth.role !== 'platform_admin') {
      throw createHttpError(403, 'Forbidden')
    }

    res.json({ data: payment })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/payments/webhook/flutterwave — Flutterwave webhook handler
//
// Flow: verify signature → emit payment.webhook_received (raw payload)
//       → return 200 immediately.
//
// paymentConsumer handles ALL DB writes so this endpoint never stalls
// waiting on DB latency. Returning 200 fast prevents Flutterwave retry storms.
// Register URL: Flutterwave dashboard → Settings → Webhooks
//   https://api.velopx.app/v1/payments/webhook/flutterwave
router.post('/webhook/flutterwave', async (req, res, next) => {
  try {
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET
    if (secret) {
      const signature = req.headers['verif-hash']
      if (signature !== secret) {
        res.status(401).json({ error: 'Invalid webhook signature' })
        return
      }
    }

    const event = req.body as {
      event: string
      data?: {
        tx_ref?:   string
        status?:   string
        amount?:   number
        currency?: string
        flw_ref?:  string
        meta?:     { orderId?: string }
      }
    }

    // Emit raw payload — consumer handles all DB updates
    await publishEvent('payment.webhook_received', 'flutterwave', {
      provider: 'flutterwave',
      event:    event.event,
      data:     event.data ?? {},
    })

    res.status(200).json({ received: true })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/payments/:id/refund — initiate refund (Tier-2 async) ────────────
router.post('/:id/refund', requireClerkAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string().min(1).max(500),
    })
    const { reason } = schema.parse(req.body)
    const auth    = getRequestAuth(req)
    const user    = await getOrCreateUser(auth.userId!)

    const payment = await prisma.payment.findUnique({
      where:   { id: req.params.id },
      include: { order: { select: { buyerId: true } } },
    })
    if (!payment) throw createHttpError(404, 'Payment not found')

    const isAdmin = ['platform_admin', 'insurer_admin'].includes(user.role)
    if (payment.payerId !== user.id && !isAdmin) throw createHttpError(403, 'Forbidden')
    if (payment.status !== 'completed') {
      throw createHttpError(409, `Cannot refund a payment with status "${payment.status}"`)
    }

    // Mark refunded immediately + emit event for consumer to handle provider call
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'refunded', updatedAt: new Date() },
    })

    await publishEvent('payment.refund', payment.id, {
      paymentId:   payment.id,
      orderId:     payment.orderId,
      amount:      Number(payment.amount),
      currency:    payment.currency,
      provider:    payment.provider,
      providerRef: payment.providerRef,
      reason,
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export default router
