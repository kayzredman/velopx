import { prisma } from '../db/prisma'
import type { PartCondition } from '@prisma/client'

export interface BenchmarkResult {
  oemNumber: string
  condition: PartCondition
  country: string
  floor: number
  average: number
  ceiling: number
  referencePrice: number
  source: 'seeded' | 'blended' | 'market'
  confidence: 'low' | 'medium' | 'high'
  sampleSize: number
  currency: string
}

// Admin-seeded reference prices for Phase 1 (hybrid model §17)
const SEEDED_BENCHMARKS: Record<string, { reference: number; floor: number; ceiling: number }> = {
  '53711-02190-oem': { reference: 17200, floor: 14500, ceiling: 21000 },
  '53711-42200-oem': { reference: 18500, floor: 15000, ceiling: 22000 },
  'default-oem': { reference: 15000, floor: 12000, ceiling: 19000 },
  'default-aftermarket': { reference: 8500, floor: 6000, ceiling: 11000 },
  'default-used': { reference: 4500, floor: 2500, ceiling: 7000 },
}

function seededKey(oem: string, condition: PartCondition): string {
  const normalized = oem.toUpperCase().replace(/\s/g, '')
  return `${normalized}-${condition}`
}

export async function getBenchmark(
  oemNumber: string,
  condition: PartCondition,
  country: string
): Promise<BenchmarkResult> {
  const parts = await prisma.part.findMany({
    where: {
      oemNumber: { equals: oemNumber, mode: 'insensitive' },
      condition,
      country,
    },
    select: { price: true, currency: true },
  })

  const prices = parts.map((p) => Number(p.price))
  const currency = parts[0]?.currency ?? (country === 'KE' ? 'KES' : 'GHS')

  const seedKey = seededKey(oemNumber, condition)
  const seed =
    SEEDED_BENCHMARKS[seedKey] ??
    SEEDED_BENCHMARKS[`default-${condition}`] ??
    SEEDED_BENCHMARKS['default-oem']

  if (prices.length < 5) {
    return {
      oemNumber,
      condition,
      country,
      floor: seed.floor,
      average: seed.reference,
      ceiling: seed.ceiling,
      referencePrice: seed.reference,
      source: 'seeded',
      confidence: 'low',
      sampleSize: prices.length,
      currency,
    }
  }

  const sorted = [...prices].sort((a, b) => a - b)
  const floor = sorted[0] ?? seed.floor
  const ceiling = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] ?? seed.ceiling
  const average = prices.reduce((s, p) => s + p, 0) / prices.length

  const blendedAverage = prices.length >= 50 ? average : (seed.reference + average) / 2

  return {
    oemNumber,
    condition,
    country,
    floor,
    average: Math.round(blendedAverage),
    ceiling,
    referencePrice: seed.reference,
    source: prices.length >= 50 ? 'market' : 'blended',
    confidence: prices.length >= 50 ? 'high' : prices.length >= 20 ? 'medium' : 'low',
    sampleSize: prices.length,
    currency,
  }
}

export function validateInvoice(
  invoiceAmount: number,
  benchmark: BenchmarkResult
): { withinBand: boolean; deviation: number; flag: 'LOW' | 'OK' | 'HIGH' | 'CRITICAL' } {
  const deviation = ((invoiceAmount - benchmark.average) / benchmark.average) * 100

  if (invoiceAmount > benchmark.ceiling) {
    return { withinBand: false, deviation, flag: 'CRITICAL' }
  }
  if (invoiceAmount > benchmark.average * 1.15) {
    return { withinBand: false, deviation, flag: 'HIGH' }
  }
  if (invoiceAmount < benchmark.floor) {
    return { withinBand: false, deviation, flag: 'LOW' }
  }
  return { withinBand: true, deviation, flag: 'OK' }
}
