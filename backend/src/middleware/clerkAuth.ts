import type { Request, Response, NextFunction } from 'express'
import { safeGetAuth } from '../lib/clerkConfig'
import { expandRoles, hasAnyRole } from '../lib/roles'

function metadataFromAuth(auth: NonNullable<ReturnType<typeof safeGetAuth>>) {
  return auth.sessionClaims?.metadata as Record<string, unknown> | undefined
}

function userRolesFromAuth(auth: NonNullable<ReturnType<typeof safeGetAuth>>): string[] {
  const metadata = metadataFromAuth(auth)
  return expandRoles(metadata?.role as string | undefined, metadata?.roles)
}

export function requireClerkAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = safeGetAuth(req)
  if (!auth?.userId) {
    res.status(401).json({ error: 'Unauthenticated' })
    return
  }
  next()
}

// Role-based access control — reads role(s) from Clerk publicMetadata (synced to JWT)
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = safeGetAuth(req)

    if (!auth?.userId) {
      res.status(401).json({ error: 'Unauthenticated' })
      return
    }

    if (roles.length > 0) {
      const userRoles = userRolesFromAuth(auth)
      if (!hasAnyRole(userRoles, ...roles)) {
        res.status(403).json({ error: 'Insufficient permissions' })
        return
      }
    }

    next()
  }
}

// Helper — extract typed auth from request without throwing
export function getRequestAuth(req: Request) {
  const auth = safeGetAuth(req)
  const metadata = auth ? metadataFromAuth(auth) : undefined
  const roles = auth ? userRolesFromAuth(auth) : []
  const role = (metadata?.role as string | undefined) ?? roles[0]

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
