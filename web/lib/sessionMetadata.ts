import { expandUserRoles } from './utils'

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

/** Clerk may expose publicMetadata as metadata, publicMetadata, or public_metadata in JWT claims. */
export function metadataFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!sessionClaims) return undefined
  return (
    asRecord(sessionClaims.metadata) ??
    asRecord(sessionClaims.publicMetadata) ??
    asRecord(sessionClaims.public_metadata)
  )
}

export function rolesFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): string[] {
  const meta = metadataFromSessionClaims(sessionClaims)
  if (!meta) return []
  const extra = Array.isArray(meta.roles)
    ? meta.roles.filter((r): r is string => typeof r === 'string')
    : undefined
  return expandUserRoles(meta.role as string | undefined, extra)
}

export function primaryRoleFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): string | undefined {
  const meta = metadataFromSessionClaims(sessionClaims)
  const roles = rolesFromSessionClaims(sessionClaims)
  return (meta?.role as string | undefined) ?? roles[0]
}

/** Merge JWT session claims with Clerk user publicMetadata (authoritative for dual roles). */
export function rolesForClerkUser(
  clerkUser: { publicMetadata?: Record<string, unknown> } | null | undefined,
  sessionClaims?: Record<string, unknown> | null,
): string[] {
  const merged = new Set(rolesFromSessionClaims(sessionClaims))
  const pub = clerkUser?.publicMetadata
  if (pub) {
    const extra = Array.isArray(pub.roles)
      ? pub.roles.filter((r): r is string => typeof r === 'string')
      : undefined
    for (const r of expandUserRoles(pub.role as string | undefined, extra)) merged.add(r)
  }
  return [...merged]
}

export function primaryRoleForClerkUser(
  clerkUser: { publicMetadata?: Record<string, unknown> } | null | undefined,
  sessionClaims?: Record<string, unknown> | null,
): string | undefined {
  const pub = clerkUser?.publicMetadata
  const fromPub = pub?.role as string | undefined
  if (fromPub) return fromPub
  const roles = rolesForClerkUser(clerkUser, sessionClaims)
  return roles[0]
}
