import { getAuth, requireAuth } from '@clerk/express'
import type { Request, Response, NextFunction } from 'express'

// Drop-in middleware for protected routes
export const requireClerkAuth = requireAuth()

// Role-based access control — reads role from Clerk publicMetadata (synced to JWT)
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = getAuth(req)

    if (!auth?.userId) {
      res.status(401).json({ error: 'Unauthenticated' })
      return
    }

    if (roles.length > 0) {
      const role = (auth.sessionClaims?.metadata as Record<string, unknown>)?.role as
        | string
        | undefined

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
