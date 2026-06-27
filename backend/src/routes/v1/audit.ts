import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth } from '../../middleware/clerkAuth'
import { requireRequestUser } from '../../lib/resolveUser'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'

const router = Router()

// ── GET /v1/audit/export?claimReference= — per-claim audit export (Phase 1)
router.get('/export', requireClerkAuth, async (req, res, next) => {
  try {
    const { claimReference } = z
      .object({ claimReference: z.string().min(1) })
      .parse(req.query)

    const user = await requireRequestUser(req)

    const allowedRoles = ['assessor', 'insurer_admin', 'insurer_staff', 'platform_admin']
    if (!allowedRoles.includes(user.role)) {
      throw createHttpError(403, 'Only assessors and insurers can export claim audit reports')
    }

    const events = await prisma.auditEvent.findMany({
      where: { claimReference },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        actionType: true,
        resource: true,
        resourceId: true,
        claimReference: true,
        outcome: true,
        role: true,
        country: true,
        latencyMs: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })

    const quotes = await prisma.quote.findMany({
      where: { claimReference },
      include: {
        items: { include: { part: { select: { name: true, oemNumber: true, condition: true } } } },
      },
    })

    const orders = await prisma.order.findMany({
      where: { claimReference },
      include: {
        items: { include: { part: { select: { name: true, oemNumber: true } } } },
        delivery: true,
      },
    })

    res.json({
      data: {
        claimReference,
        exportedAt: new Date().toISOString(),
        exportedBy: { id: user.id, name: user.name, role: user.role },
        summary: {
          auditEventCount: events.length,
          quoteCount: quotes.length,
          orderCount: orders.length,
        },
        auditEvents: events,
        quotes,
        orders,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
