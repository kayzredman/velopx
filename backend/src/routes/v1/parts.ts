import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { requireClerkAuth, requireRole, getRequestAuth } from '../../middleware/clerkAuth'
import { requireRequestUser } from '../../lib/resolveUser'
import { MARKETPLACE_VIEWER_ROLES, isMarketplaceViewer } from '../../lib/roles'
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
  dealerId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

function buildPartsWhere(params: z.infer<typeof SearchPartsSchema>) {
  const { q, condition, country, dealerId } = params
  return {
    ...(dealerId && { dealerId }),
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
}

async function searchParts(
  params: z.infer<typeof SearchPartsSchema>,
  options: { enrichedDealer: boolean }
) {
  const { page, limit } = params
  const skip = (page - 1) * limit
  const where = buildPartsWhere(params)

  const dealerSelect = options.enrichedDealer
    ? { id: true, name: true, email: true, role: true }
    : { id: true, name: true }

  const [parts, total] = await prisma.$transaction([
    prisma.part.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { dealer: { select: dealerSelect } },
    }),
    prisma.part.count({ where }),
  ])

  return {
    data: parts,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  }
}

// ── GET /v1/parts/mine — authenticated dealer's own catalogue
router.get('/mine', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const { page, limit } = SearchPartsSchema.parse(req.query)
    const skip = (page - 1) * limit
    const where = { dealerId: user.id }

    const [parts, total] = await prisma.$transaction([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

// ── GET /v1/parts/mine/:id — single owned listing (dealer scope)
router.get('/mine/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const user = await requireRequestUser(req)

    const part = await prisma.part.findFirst({
      where: { id: req.params.id, dealerId: user.id },
    })

    if (!part) throw createHttpError(404, 'Part not found')
    res.json({ data: part })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/parts/benchmark — assessor price benchmark (Phase 1 seeded mode)
router.get('/benchmark', async (req, res, next) => {
  try {
    const { oem, condition, country } = z
      .object({
        oem: z.string().min(1),
        condition: z.enum(['oem', 'aftermarket', 'used']),
        country: z.string().length(2).default('GH'),
      })
      .parse(req.query)

    const { getBenchmark } = await import('../../lib/benchmark')
    const benchmark = await getBenchmark(oem, condition, country)
    res.json({ data: benchmark })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/parts/marketplace — all dealers' listings (assessor / insurer)
router.get(
  '/marketplace',
  requireClerkAuth,
  requireRole(...MARKETPLACE_VIEWER_ROLES),
  async (req, res, next) => {
    try {
      const params = SearchPartsSchema.parse(req.query)
      const result = await searchParts(params, { enrichedDealer: true })
      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /v1/parts — public search (all dealers; basic dealer info)
router.get('/', async (req, res, next) => {
  try {
    const params = SearchPartsSchema.parse(req.query)
    const auth = getRequestAuth(req)
    const enriched = isMarketplaceViewer(auth.role, auth.roles)
    const result = await searchParts(params, { enrichedDealer: enriched })
    res.json(result)
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
      const data = CreatePartSchema.parse(req.body)

      const user = await requireRequestUser(req)

      const part = await prisma.part.create({
        data: {
          ...data,
          attributes: data.attributes as unknown as Prisma.InputJsonValue,
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
      const user = await requireRequestUser(req)

      const part = await prisma.part.findUnique({ where: { id: req.params.id } })
      if (!part) throw createHttpError(404, 'Part not found')
      if (part.dealerId !== user.id && user.role !== 'platform_admin') {
        throw createHttpError(403, 'You can only update your own listings')
      }

      const rawUpdate = CreatePartSchema.partial().parse(req.body)
      const updated = await prisma.part.update({
        where: { id: req.params.id },
        data: {
          ...rawUpdate,
          ...(rawUpdate.attributes !== undefined && {
            attributes: rawUpdate.attributes as unknown as Prisma.InputJsonValue,
          }),
        },
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
      const user = await requireRequestUser(req)

      const part = await prisma.part.findUnique({ where: { id: req.params.id } })
      if (!part) throw createHttpError(404, 'Part not found')
      if (part.dealerId !== user.id && user.role !== 'platform_admin') {
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
