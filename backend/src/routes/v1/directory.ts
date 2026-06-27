import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, requireRole } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { GARAGE_ROLES, DEALER_ROLES, MARKETPLACE_VIEWER_ROLES } from '../../lib/roles'

const router = Router()

const viewerGuard = [requireClerkAuth, requireRole(...MARKETPLACE_VIEWER_ROLES)] as const

const ListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().optional(),
})

function searchFilter(q: string | undefined) {
  if (!q) return {}
  return {
    OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { email: { contains: q, mode: 'insensitive' as const } },
    ],
  }
}

// GET /v1/directory/garages — all registered garages (assessor / insurer)
router.get('/garages', ...viewerGuard, async (req, res, next) => {
  try {
    const { page, limit, q } = ListSchema.parse(req.query)
    const skip = (page - 1) * limit
    const where = { role: { in: GARAGE_ROLES }, ...searchFilter(q) }

    const [garages, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { quotes: true, orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      data: garages.map(({ _count, ...g }) => ({
        ...g,
        quoteCount: _count.quotes,
        orderCount: _count.orders,
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// GET /v1/directory/dealers — all registered dealers (assessor / insurer)
router.get('/dealers', ...viewerGuard, async (req, res, next) => {
  try {
    const { page, limit, q } = ListSchema.parse(req.query)
    const skip = (page - 1) * limit
    const where = { role: { in: DEALER_ROLES }, ...searchFilter(q) }

    const [dealers, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { parts: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      data: dealers.map(({ _count, ...d }) => ({
        ...d,
        listingCount: _count.parts,
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

export default router
