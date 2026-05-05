import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { requireClerkAuth, getRequestAuth, getOrCreateUser } from '../../middleware/clerkAuth'

const router = Router()

// ── GET /v1/benchmark?partNumber=&condition=&country= ─────────────────────────
//
// Returns market benchmark bands (floor / average / ceiling) for a given part.
//
// Primary source: BenchmarkPrice table (pre-seeded or computed from live listings).
// Fallback: compute on-the-fly from current active Part listings in the DB.
// This lets the endpoint work immediately even before the benchmark table is seeded.

const QuerySchema = z.object({
  partNumber: z.string().min(1),
  condition:  z.enum(['oem', 'aftermarket', 'used']),
  country:    z.string().length(2).default('GH'),
})

router.get('/', async (req, res, next) => {
  try {
    const { partNumber, condition, country } = QuerySchema.parse(req.query)

    // 1. Check the benchmark table first
    const stored = await prisma.benchmarkPrice.findUnique({
      where: { partNumber_condition_country: { partNumber, condition, country } },
    })

    if (stored) {
      res.json({
        data: {
          partNumber,
          condition,
          country,
          currency: stored.currency,
          floor:     Number(stored.floor),
          average:   Number(stored.average),
          ceiling:   Number(stored.ceiling),
          source:    stored.source,
          confidence: stored.confidenceScore,
          sampleCount: stored.sampleCount,
        },
      })
      return
    }

    // 2. Fallback: compute live from active Part listings
    const parts = await prisma.part.findMany({
      where: {
        condition,
        country,
        stockStatus: 'in_stock',
        OR: [
          { oemNumber: { contains: partNumber, mode: 'insensitive' } },
          { name:      { contains: partNumber, mode: 'insensitive' } },
        ],
      },
      select: { price: true, currency: true },
      take: 200, // cap — enough for live benchmark
    })

    if (parts.length === 0) {
      throw createHttpError(
        404,
        `No benchmark data found for "${partNumber}" (${condition}, ${country})`,
      )
    }

    const prices  = parts.map((p) => Number(p.price)).sort((a, b) => a - b)
    const floor   = prices[0]
    const ceiling = prices[prices.length - 1]
    const average = prices.reduce((s, v) => s + v, 0) / prices.length
    const currency = parts[0].currency

    // Persist so subsequent calls skip the full-table scan
    await prisma.benchmarkPrice.upsert({
      where:  { partNumber_condition_country: { partNumber, condition, country } },
      create: {
        partNumber,
        condition,
        country,
        currency,
        floor,
        average,
        ceiling,
        source:          'market',
        confidenceScore: Math.min(0.9, 0.3 + prices.length * 0.05), // rough confidence
        sampleCount:     prices.length,
      },
      update: {
        floor,
        average,
        ceiling,
        currency,
        confidenceScore: Math.min(0.9, 0.3 + prices.length * 0.05),
        sampleCount:     prices.length,
      },
    }).catch(() => { /* non-fatal — cache miss is fine */ })

    res.json({
      data: {
        partNumber,
        condition,
        country,
        currency,
        floor,
        average: Math.round(average * 100) / 100,
        ceiling,
        source:      'market',
        confidence:  Math.min(0.9, 0.3 + prices.length * 0.05),
        sampleCount: prices.length,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/benchmark — admin: upsert a benchmark band ──────────────────────
router.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await getOrCreateUser(auth.userId!)
    if (user.role !== 'platform_admin') throw createHttpError(403, 'Forbidden')

    const schema = z.object({
      partNumber:      z.string().min(1),
      condition:       z.enum(['oem', 'aftermarket', 'used']),
      country:         z.string().length(2),
      currency:        z.string().length(3).default('GHS'),
      floor:           z.number().positive(),
      average:         z.number().positive(),
      ceiling:         z.number().positive(),
      source:          z.enum(['seeded', 'blended', 'market']).default('seeded'),
      confidenceScore: z.number().min(0).max(1).default(0.8),
      sampleCount:     z.number().int().positive().default(1),
    })

    const data = schema.parse(req.body)
    const record = await prisma.benchmarkPrice.upsert({
      where: {
        partNumber_condition_country: {
          partNumber: data.partNumber,
          condition:  data.condition,
          country:    data.country,
        },
      },
      create: data,
      update: data,
    })

    res.status(201).json({ data: record })
  } catch (err) {
    next(err)
  }
})

export default router
