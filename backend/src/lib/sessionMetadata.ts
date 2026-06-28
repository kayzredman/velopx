import { expandRoles } from './roles'

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
  return expandRoles(meta.role as string | undefined, meta.roles)
}

export function primaryRoleFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): string | undefined {
  const meta = metadataFromSessionClaims(sessionClaims)
  const roles = rolesFromSessionClaims(sessionClaims)
  return (meta?.role as string | undefined) ?? roles[0]
}
