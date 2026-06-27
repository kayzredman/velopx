import { auth } from '@clerk/nextjs/server'
import { hasValidClerkKeys } from './clerkConfig'

export async function safeAuth() {
  if (!hasValidClerkKeys()) {
    return { userId: null as string | null, sessionClaims: null as Record<string, unknown> | null }
  }
  return await auth()
}
