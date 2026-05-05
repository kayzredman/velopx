import { getAuth, clerkClient } from '@clerk/express'
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma'
import type { UserRole } from '../types'

// Drop-in middleware for protected routes — always returns 401 JSON, never redirects
export function requireClerkAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req)
  if (!auth?.userId) {
    res.status(401).json({ error: 'Unauthenticated' })
    return
  }
  next()
}

// Role-based access control — checks Clerk JWT claim first, falls back to DB role.
// The JWT claim may be absent when Clerk publicMetadata has not been set (e.g. new
// sign-ups that never went through the webhook), so the DB is the authoritative source.
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = getAuth(req)

    if (!auth?.userId) {
      res.status(401).json({ error: 'Unauthenticated' })
      return
    }

    if (roles.length > 0) {
      // Try JWT claim first (fast path)
      let role = (auth.sessionClaims?.metadata as Record<string, unknown>)?.role as
        | string
        | undefined

      // Fall back to DB when JWT has no role claim (sign-ups without Clerk metadata sync)
      if (!role) {
        try {
          const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } })
          role = user?.role ?? undefined
        } catch {
          // DB unreachable — deny
        }
      }

      if (!role || !roles.includes(role)) {
        res.status(403).json({ error: 'Insufficient permissions' })
        return
      }
    }

    next()
  }
}

// Helper — extract typed auth from request without throwing
export function getRequestAuth(req: Request) {
  const auth = getAuth(req)
  const role = (auth.sessionClaims?.metadata as Record<string, unknown>)?.role as
    | string
    | undefined

  return {
    userId: auth.userId,
    orgId: auth.orgId,
    sessionId: auth.sessionId,
    role,
  }
}

// Auto-provision a DB User row on first authenticated request.
// Falls back gracefully if Clerk API is unreachable (uses clerkId as email placeholder).
export async function getOrCreateUser(clerkId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  let email = `${clerkId}@unknown.local`
  let name: string | undefined

  try {
    const clerkUser = await clerkClient.users.getUser(clerkId)
    const primary = clerkUser.emailAddresses.find(
      (e: { id: string }) => e.id === clerkUser.primaryEmailAddressId
    )
    email = primary?.emailAddress ?? email
    name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined
    const role = (
      (clerkUser.unsafeMetadata?.role ?? clerkUser.publicMetadata?.role) as UserRole | undefined
    ) ?? 'dealer_owner'

    return prisma.user.create({ data: { clerkId, email, name, role } })
  } catch {
    return prisma.user.create({ data: { clerkId, email, name, role: 'dealer_owner' } })
  }
}
