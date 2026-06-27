import { getAuth } from '@clerk/express'
import type { Request } from 'express'

export function hasValidClerkKeys(): boolean {
  const pk = process.env.CLERK_PUBLISHABLE_KEY ?? ''
  const sk = process.env.CLERK_SECRET_KEY ?? ''
  return (
    pk.startsWith('pk_') &&
    sk.startsWith('sk_') &&
    !pk.includes('xxxx') &&
    !sk.includes('xxxx')
  )
}

export function safeGetAuth(req: Request) {
  if (!hasValidClerkKeys()) return null
  try {
    return getAuth(req)
  } catch {
    return null
  }
}
