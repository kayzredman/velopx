import type { Request } from 'express'
import { clerkClient } from '@clerk/express'
import { Prisma } from '@prisma/client'
import type { User } from '@prisma/client'
import { prisma } from '../db/prisma'
import { getRequestAuth } from '../middleware/clerkAuth'
import { createHttpError } from '../middleware/errorHandler'
import type { UserRole } from '../types'

const USER_ROLES = new Set<UserRole>([
  'dealer_owner',
  'dealer_staff',
  'garage_owner',
  'garage_staff',
  'assessor',
  'insurer_admin',
  'insurer_staff',
  'driver',
  'platform_admin',
])

function parseRole(role: unknown): UserRole {
  return typeof role === 'string' && USER_ROLES.has(role as UserRole)
    ? (role as UserRole)
    : 'driver'
}

function isUniqueViolation(err: unknown, field?: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') {
    return false
  }
  if (!field) return true
  return (err.meta?.target as string[] | undefined)?.includes(field) ?? false
}

function clerkEmail(clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>): string | null {
  return (
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null
  )
}

/** Find VelopX user for Clerk session; JIT-provision from Clerk when webhook hasn't run yet. */
export async function resolveRequestUser(req: Request): Promise<User | null> {
  const auth = getRequestAuth(req)
  if (!auth.userId) return null

  const byClerk = await prisma.user.findUnique({ where: { clerkId: auth.userId } })
  if (byClerk) {
    const clerkRole = parseRole(auth.role)
    if (clerkRole !== byClerk.role && clerkRole !== 'driver') {
      return prisma.user.update({ where: { id: byClerk.id }, data: { role: clerkRole } })
    }
    return byClerk
  }

  let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>
  try {
    clerkUser = await clerkClient.users.getUser(auth.userId)
  } catch (err) {
    console.error('[resolveUser] Clerk fetch failed:', err)
    return null
  }

  const email = clerkEmail(clerkUser)
  if (!email) return null

  const role = parseRole(auth.role ?? clerkUser.publicMetadata?.role)
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

  // Link seeded / legacy rows that share the email but a different clerkId
  const byEmail = await prisma.user.findUnique({ where: { email } })
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        clerkId: auth.userId,
        name: name ?? byEmail.name,
        role: byEmail.role === 'driver' ? role : byEmail.role,
      },
    })
  }

  try {
    return await prisma.user.create({
      data: { clerkId: auth.userId, email, name, role },
    })
  } catch (err) {
    if (isUniqueViolation(err)) {
      const raced =
        (await prisma.user.findUnique({ where: { clerkId: auth.userId } })) ??
        (await prisma.user.findUnique({ where: { email } }))
      if (raced) return raced
    }
    console.error('[resolveUser] Failed to provision user from Clerk:', err)
    return null
  }
}

export async function requireRequestUser(req: Request): Promise<User> {
  const user = await resolveRequestUser(req)
  if (!user) throw createHttpError(404, 'User not found')
  return user
}
