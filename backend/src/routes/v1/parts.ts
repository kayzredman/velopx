import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, requireRole, getRequestAuth } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'

const router = Router()

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreatePartSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  oemNumber: z.string().optional(),
  condition: z.enum(['oem', 'aftermarket', 'used']),
  price: z.number().positive(),
  currency: z.string().length(3).default('GHS'),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'limited']).default('in_stock'),
  attributes: z.record(z.unknown()).default({}),
  images: z.array(z.string().url()).default([]),
})

const SearchPartsSchema = z.object({
  q: z.string().optional(),
  condition: z.enum(['oem', 'aftermarket', 'used']).optional(),
  country: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ── GET /v1/parts — public search
router.get('/', async (req, res, next) => {
  try {
    const { q, condition, country, page, limit } = SearchPartsSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where = {
      ...(condition && { condition }),
      ...(country && { country }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { oemNumber: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [parts, total] = await prisma.$transaction([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { dealer: { select: { id: true, name: true } } },
      }),
      prisma.part.count({ where }),
    ])

    res.json({
      data: parts,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/parts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const part = await prisma.part.findUnique({
      where: { id: req.params.id },
      include: { dealer: { select: { id: true, name: true } } },
    })

    if (!part) throw createHttpError(404, 'Part not found')
    res.json({ data: part })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/parts — dealer creates a part listing
router.post(
  '/',
  requireClerkAuth,
  requireRole('dealer_owner', 'dealer_staff', 'platform_admin'),
  async (req, res, next) => {
    try {
      const auth = getRequestAuth(req)
      const data = CreatePartSchema.parse(req.body)

      // Resolve platform userId from Clerk userId
      const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
      if (!user) throw createHttpError(404, 'User not found — ensure webhook provisioned')

      const part = await prisma.part.create({
        data: {
          ...data,
          price: data.price,
          dealerId: user.id,
        },
      })

      res.status(201).json({ data: part })
    } catch (err) {
      next(err)
    }
  }
)

// ── PATCH /v1/parts/:id — dealer updates their own listing
router.patch(
  '/:id',
  requireClerkAuth,
  requireRole('dealer_owner', 'dealer_staff', 'platform_admin'),
  async (req, res, next) => {
    try {
      const auth = getRequestAuth(req)

      const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
      if (!user) throw createHttpError(404, 'User not found')

      const part = await prisma.part.findUnique({ where: { id: req.params.id } })
      if (!part) throw createHttpError(404, 'Part not found')
      if (part.dealerId !== user.id && auth.role !== 'platform_admin') {
        throw createHttpError(403, 'You can only update your own listings')
      }

      const updated = await prisma.part.update({
        where: { id: req.params.id },
        data: CreatePartSchema.partial().parse(req.body),
      })

      res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }
)

// ── DELETE /v1/parts/:id
router.delete(
  '/:id',
  requireClerkAuth,
  requireRole('dealer_owner', 'platform_admin'),
  async (req, res, next) => {
    try {
      const auth = getRequestAuth(req)
      const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
      if (!user) throw createHttpError(404, 'User not found')

      const part = await prisma.part.findUnique({ where: { id: req.params.id } })
      if (!part) throw createHttpError(404, 'Part not found')
      if (part.dealerId !== user.id && auth.role !== 'platform_admin') {
        throw createHttpError(403, 'Forbidden')
      }

      await prisma.part.delete({ where: { id: req.params.id } })
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
)

export default router
