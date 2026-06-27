import type { UserRole } from '../types'

export const DEALER_ROLES: UserRole[] = ['dealer_owner', 'dealer_staff']
export const GARAGE_ROLES: UserRole[] = ['garage_owner', 'garage_staff']
export const MARKETPLACE_VIEWER_ROLES: UserRole[] = [
  'assessor',
  'insurer_admin',
  'insurer_staff',
  'platform_admin',
]

export function expandRoles(primary?: string | null, extra?: unknown): string[] {
  const roles = new Set<string>()
  if (primary) roles.add(primary)
  if (Array.isArray(extra)) {
    for (const r of extra) {
      if (typeof r === 'string') roles.add(r)
    }
  }
  return [...roles]
}

export function hasAnyRole(userRoles: string[], ...allowed: string[]): boolean {
  return allowed.some((r) => userRoles.includes(r))
}

export function isMarketplaceViewer(role?: string | null, roles?: string[]): boolean {
  const all = roles?.length ? roles : expandRoles(role)
  return all.some((r) => MARKETPLACE_VIEWER_ROLES.includes(r as UserRole))
}

export function isDealerRole(role?: string | null, roles?: string[]): boolean {
  const all = roles?.length ? roles : expandRoles(role)
  return all.some((r) => DEALER_ROLES.includes(r as UserRole))
}
