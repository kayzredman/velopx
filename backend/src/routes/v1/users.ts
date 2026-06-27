import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth, requireRole, getRequestAuth } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'
import { clerkClient } from '@clerk/express'

const router = Router()

const UpdateMeSchema = z.object({
  name:    z.string().min(1).max(200).optional(),
  lat:     z.number().finite().optional(),
  lng:     z.number().finite().optional(),
  address: z.string().max(500).optional(),
})

// ── GET /v1/users/me
router.get('/me', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/users/me
router.patch('/me', requireClerkAuth, async (req, res, next) => {
  try {
    const auth = getRequestAuth(req)
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId! } })
    if (!user) throw createHttpError(404, 'User not found')

    const body = UpdateMeSchema.parse(req.body)
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name    !== undefined && { name:    body.name }),
        ...(body.lat     !== undefined && { lat:     body.lat }),
        ...(body.lng     !== undefined && { lng:     body.lng }),
        ...(body.address !== undefined && { address: body.address }),
      },
    })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/users/team/drivers — list all drivers (dealer roles)
router.get(
  '/team/drivers',
  requireClerkAuth,
  requireRole('dealer_owner', 'dealer_staff', 'platform_admin'),
  async (_req, res, next) => {
    try {
      const drivers = await prisma.user.findMany({
        where: { role: 'driver' },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { name: 'asc' },
      })
      res.json({ data: drivers })
    } catch (err) {
      next(err)
    }
  },
)

// ── POST /v1/users/team/drivers — create a driver account (dealer_owner only)
const CreateDriverSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8),
})

router.post(
  '/team/drivers',
  requireClerkAuth,
  requireRole('dealer_owner', 'platform_admin'),
  async (req, res, next) => {
    try {
      const { email, name, password } = CreateDriverSchema.parse(req.body)

      // Check if a DB user with that email already exists
      const existing = await prisma.user.findFirst({ where: { email } })
      if (existing) throw createHttpError(409, 'A user with that email already exists')

      // Create Clerk user first
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
        publicMetadata: { role: 'driver' },
      })

      // Create DB record
      const driver = await prisma.user.create({
        data: { clerkId: clerkUser.id, email, name, role: 'driver' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })

      res.status(201).json({ data: driver })
    } catch (err) {
      // Surface Clerk API errors as 400
      if (err && typeof err === 'object' && 'status' in err && 'errors' in err) {
        const clerkErr = err as { status: number; errors: Array<{ message: string }> }
        return next(createHttpError(400, clerkErr.errors?.[0]?.message ?? 'Failed to create Clerk user'))
      }
      next(err)
    }
  },
)

// ── DELETE /v1/users/team/drivers/:id — remove a driver (dealer_owner only)
router.delete(
  '/team/drivers/:id',
  requireClerkAuth,
  requireRole('dealer_owner', 'platform_admin'),
  async (req, res, next) => {
    try {
      const driver = await prisma.user.findUnique({ where: { id: req.params.id } })
      if (!driver) throw createHttpError(404, 'Driver not found')
      if (driver.role !== 'driver') throw createHttpError(400, 'User is not a driver')

      // Remove from DB (Clerk account stays — driver keeps their login)
      await prisma.user.delete({ where: { id: req.params.id } })
      res.json({ data: { id: req.params.id } })
    } catch (err) {
      next(err)
    }
  },
)

// ── GET /v1/users/team/staff — list workshop staff (garage roles)
router.get(
  '/team/staff',
  requireClerkAuth,
  requireRole('garage_owner', 'garage_staff', 'platform_admin'),
  async (_req, res, next) => {
    try {
      const staff = await prisma.user.findMany({
        where: { role: 'garage_staff' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: 'asc' },
      })
      res.json({ data: staff })
    } catch (err) {
      next(err)
    }
  },
)

// ── POST /v1/users/team/staff — create a workshop staff account (garage_owner only)
const CreateStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8),
})

router.post(
  '/team/staff',
  requireClerkAuth,
  requireRole('garage_owner', 'platform_admin'),
  async (req, res, next) => {
    try {
      const { email, name, password } = CreateStaffSchema.parse(req.body)

      const existing = await prisma.user.findFirst({ where: { email } })
      if (existing) throw createHttpError(409, 'A user with that email already exists')

      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
        publicMetadata: { role: 'garage_staff' },
      })

      const staff = await prisma.user.create({
        data: { clerkId: clerkUser.id, email, name, role: 'garage_staff' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })

      res.status(201).json({ data: staff })
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && 'errors' in err) {
        const clerkErr = err as { status: number; errors: Array<{ message: string }> }
        return next(createHttpError(400, clerkErr.errors?.[0]?.message ?? 'Failed to create Clerk user'))
      }
      next(err)
    }
  },
)

// ── DELETE /v1/users/team/staff/:id — remove a staff member (garage_owner only)
router.delete(
  '/team/staff/:id',
  requireClerkAuth,
  requireRole('garage_owner', 'platform_admin'),
  async (req, res, next) => {
    try {
      const member = await prisma.user.findUnique({ where: { id: req.params.id } })
      if (!member) throw createHttpError(404, 'Staff member not found')
      if (!['garage_staff', 'workshop_manager'].includes(member.role)) {
        throw createHttpError(400, 'User is not a workshop staff member')
      }

      await prisma.user.delete({ where: { id: req.params.id } })
      res.json({ data: { id: req.params.id } })
    } catch (err) {
      next(err)
    }
  },
)

export default router
