import { Router } from 'express'
import createHttpError from 'http-errors'
import { z } from 'zod'
import { requireClerkAuth } from '../../middleware/clerkAuth'

const router = Router()

// NHTSA vPIC API — free, no auth required
const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

interface NhtsaResult {
  Make: string
  Model: string
  ModelYear: string
  BodyClass: string
  EngineDisplacementL: string
  FuelTypePrimary: string
  DriveType: string
  TransmissionStyle: string
  VehicleType: string
  ErrorCode: string
  ErrorText: string
  [key: string]: string
}

// ── GET /v1/vehicles/decode?vin=VIN ──────────────────────────────────────────
const QuerySchema = z.object({
  vin: z.string().length(17, 'VIN must be exactly 17 characters'),
})

router.get('/decode', requireClerkAuth, async (req, res, next) => {
  try {
    const { vin } = QuerySchema.parse(req.query)

    const url = `${NHTSA_BASE}/${encodeURIComponent(vin)}?format=json`
    const upstream = await fetch(url)
    if (!upstream.ok) throw createHttpError(502, 'NHTSA API unavailable')

    const json = await upstream.json() as { Results?: NhtsaResult[] }
    const result = json.Results?.[0]
    if (!result) throw createHttpError(502, 'No result from NHTSA API')

    // errorCode '0' means decoded OK; other codes indicate partial/full failure
    const errorCode = result.ErrorCode ?? ''
    if (errorCode !== '0' && !result.Make) {
      throw createHttpError(422, result.ErrorText ?? 'VIN could not be decoded')
    }

    res.json({
      data: {
        vin,
        make: result.Make || null,
        model: result.Model || null,
        year: result.ModelYear ? parseInt(result.ModelYear, 10) : null,
        bodyClass: result.BodyClass || null,
        engineDisplacementL: result.EngineDisplacementL || null,
        fuelType: result.FuelTypePrimary || null,
        driveType: result.DriveType || null,
        transmissionStyle: result.TransmissionStyle || null,
        vehicleType: result.VehicleType || null,
        errorCode,
        errorText: errorCode !== '0' ? (result.ErrorText || null) : null,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
