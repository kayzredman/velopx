import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, requireRole, getRequestAuth } from '../../middleware/clerkAuth'
import { requireRequestUser } from '../../lib/resolveUser'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { publishEvent } from '../../kafka/events'
import { canAccessDelivery } from '../../lib/deliveryAccess'

const router = Router()

type DeliveryStatusValue =
  | 'pending'
  | 'assigned'
  | 'collected'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'disputed'

// Valid state machine transitions — enforced server-side
const VALID_TRANSITIONS: Record<DeliveryStatusValue, DeliveryStatusValue[]> = {
  pending:    ['assigned'],
  assigned:   ['collected'],
  collected:  ['in_transit'],
  in_transit: ['delivered'],
  delivered:  ['confirmed', 'disputed'],
  confirmed:  [],
  disputed:   [],
}

const UpdateStatusSchema = z.object({
  status: z.enum(['assigned', 'collected', 'in_transit', 'delivered', 'confirmed', 'disputed']),
  driverId: z.string().cuid().optional(),  // required when → assigned
  proofUrl: z.string().min(1).optional(),   // photo URI or URL when → delivered
  note: z.string().max(500).optional(),
})

// ── GET /v1/deliveries — scoped list by role
router.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    // Scope deliveries to what the authenticated user is allowed to see
    let where: Record<string, unknown> = {}
    if (user.role === 'driver') {
      where = { driverId: user.id }
    } else if (user.role === 'dealer_owner' || user.role === 'dealer_staff') {
      where = { order: { items: { some: { part: { dealerId: user.id } } } } }
    } else if (user.role !== 'platform_admin') {
      // garage, assessor, insurer — buyer perspective
      where = { order: { buyerId: user.id } }
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            claimReference: true,
            status: true,
            currency: true,
            totalAmount: true,
            buyer: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                part: { select: { id: true, name: true, oemNumber: true, condition: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: deliveries })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/deliveries/:id
router.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                part: { select: { id: true, name: true, oemNumber: true, condition: true, price: true, currency: true, dealerId: true } },
              },
            },
          },
        },
      },
    })

    if (!delivery) throw createHttpError(404, 'Delivery not found')
    if (!canAccessDelivery(delivery, user, user.role)) {
      throw createHttpError(403, 'Forbidden')
    }

    res.json({ data: delivery })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/deliveries — dealer creates delivery record for a confirmed order
router.post(
  '/',
  requireClerkAuth,
  requireRole('dealer_owner', 'dealer_staff', 'platform_admin'),
  async (req, res, next) => {
    try {
      const { orderId } = z.object({ orderId: z.string().cuid() }).parse(req.body)

      const user = await requireRequestUser(req)

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { part: { select: { dealerId: true } } } } },
      })
      if (!order) throw createHttpError(404, 'Order not found')
      if (order.status !== 'confirmed') {
        throw createHttpError(400, 'Order must be in confirmed status before creating a delivery')
      }

      const ownsOrderParts = order.items.every((item) => item.part.dealerId === user.id)
      if (!ownsOrderParts && user.role !== 'platform_admin') {
        throw createHttpError(403, 'You can only create deliveries for orders containing your parts')
      }

      const existing = await prisma.delivery.findUnique({ where: { orderId } })
      if (existing) throw createHttpError(409, 'A delivery already exists for this order')

      const delivery = await prisma.delivery.create({
        data: { orderId, status: 'pending' },
        include: {
          order: { select: { id: true, claimReference: true, buyerId: true } },
        },
      })

      await publishEvent('delivery_events', delivery.id, {
        event_type: 'DELIVERY_CREATED',
        delivery_id: delivery.id,
        order_id: orderId,
        actor_id: user.id,
        actor_role: user.role,
      })

      res.status(201).json({ data: delivery })
    } catch (err) {
      next(err)
    }
  },
)

// ── PATCH /v1/deliveries/:id/status — advance the delivery state machine
router.patch('/:id/status', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const body = UpdateStatusSchema.parse(req.body)
    const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } })
    if (!delivery) throw createHttpError(404, 'Delivery not found')

    const currentStatus = delivery.status as DeliveryStatusValue
    const nextStatus = body.status as DeliveryStatusValue

    if (!VALID_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw createHttpError(
        400,
        `Cannot transition delivery from '${currentStatus}' to '${nextStatus}'`,
      )
    }

    // Role-based permission per transition group
    if (
      nextStatus === 'assigned' &&
      !['dealer_owner', 'dealer_staff', 'platform_admin'].includes(user.role)
    ) {
      throw createHttpError(403, 'Only dealers can assign a driver to a delivery')
    }

    if (nextStatus === 'assigned' && !body.driverId) {
      throw createHttpError(400, 'driverId is required when assigning a delivery')
    }

    if (
      ['collected', 'in_transit', 'delivered'].includes(nextStatus) &&
      !['driver', 'platform_admin'].includes(user.role)
    ) {
      throw createHttpError(403, 'Only drivers can update collection and transit status')
    }

    if (nextStatus === 'delivered' && !body.proofUrl) {
      throw createHttpError(400, 'proofUrl is required when marking a delivery as delivered')
    }

    if (
      ['confirmed', 'disputed'].includes(nextStatus) &&
      !['garage_owner', 'garage_staff', 'assessor', 'platform_admin'].includes(user.role)
    ) {
      throw createHttpError(403, 'Only the receiving party can confirm or dispute a delivery')
    }

    const updateData: Record<string, unknown> = { status: nextStatus }
    if (body.driverId) updateData.driverId = body.driverId
    if (body.proofUrl) updateData.proofUrl = body.proofUrl
    if (nextStatus === 'collected') updateData.collectedAt = new Date()
    if (nextStatus === 'delivered') updateData.deliveredAt = new Date()

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: updateData,
    })

    await publishEvent('delivery_events', delivery.id, {
      event_type: 'DELIVERY_STATUS_CHANGED',
      delivery_id: delivery.id,
      order_id: delivery.orderId,
      previous_status: currentStatus,
      new_status: nextStatus,
      actor_id: user.id,
      actor_role: user.role,
      proof_url: body.proofUrl ?? null,
      note: body.note ?? null,
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export default router
