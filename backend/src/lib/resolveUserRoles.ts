import { clerkClient } from '@clerk/express'
import { prisma } from '../db/prisma'
import { expandRoles } from './roles'
import { rolesFromSessionClaims } from './sessionMetadata'

function addRoles(target: Set<string>, primary?: string | null, extra?: unknown) {
  for (const r of expandRoles(primary, extra)) target.add(r)
}

/** Union roles from JWT claims, DB (by clerkId or email), and Clerk publicMetadata. */
export async function resolveAllUserRoles(
  userId: string,
  sessionClaims?: Record<string, unknown> | null,
): Promise<string[]> {
  const merged = new Set<string>()
  for (const r of rolesFromSessionClaims(sessionClaims)) merged.add(r)

  const byClerk = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (byClerk) addRoles(merged, byClerk.role)

  try {
    const clerkUser = await clerkClient.users.getUser(userId)
    const meta = clerkUser.publicMetadata as Record<string, unknown> | undefined
    addRoles(merged, meta?.role as string | undefined, meta?.roles)

    if (!byClerk) {
      const email =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress
      if (email) {
        const byEmail = await prisma.user.findUnique({ where: { email } })
        if (byEmail) addRoles(merged, byEmail.role)
      }
    }
  } catch {
    // Clerk unreachable — JWT + DB roles above are enough
  }

  return [...merged]
}
