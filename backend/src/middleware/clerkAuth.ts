import type { Request, Response, NextFunction } from 'express'
import { clerkClient } from '@clerk/express'
import type { UserRole } from '@prisma/client'
import { prisma } from '../db/prisma'
import { safeGetAuth } from '../lib/clerkConfig'
import { hasAnyRole } from '../lib/roles'
import { resolveAllUserRoles } from '../lib/resolveUserRoles'
import {
  primaryRoleFromSessionClaims,
  rolesFromSessionClaims,
} from '../lib/sessionMetadata'

function userRolesFromAuth(auth: NonNullable<ReturnType<typeof safeGetAuth>>): string[] {
  return rolesFromSessionClaims(auth.sessionClaims as Record<string, unknown> | undefined)
}

async function resolveUserRoles(auth: NonNullable<ReturnType<typeof safeGetAuth>>): Promise<string[]> {
  const userId = auth.userId
  if (!userId) return []
  return resolveAllUserRoles(userId, auth.sessionClaims as Record<string, unknown> | undefined)
}

export function requireClerkAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = safeGetAuth(req)
  if (!auth?.userId) {
    res.status(401).json({ error: 'Unauthenticated' })
    return
  }
  next()
}

// Role-based access control — reads role(s) from Clerk publicMetadata (JWT or DB fallback)
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = safeGetAuth(req)

      if (!auth?.userId) {
        res.status(401).json({ error: 'Unauthenticated' })
        return
      }

      if (roles.length > 0) {
        const userRoles = await resolveUserRoles(auth)
        if (!hasAnyRole(userRoles, ...roles)) {
          res.status(403).json({ error: 'Insufficient permissions' })
          return
        }
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

// Helper — extract typed auth from request without throwing
export function getRequestAuth(req: Request) {
  const auth = safeGetAuth(req)
  const claims = auth?.sessionClaims as Record<string, unknown> | undefined
  const roles = auth ? userRolesFromAuth(auth) : []
  const role = primaryRoleFromSessionClaims(claims)

  return {
    userId: auth?.userId,
    orgId: auth?.orgId,
    sessionId: auth?.sessionId,
    role,
    roles,
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
