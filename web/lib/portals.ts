import type { LucideIcon } from 'lucide-react'
import { BarChart3, ClipboardCheck, Store, Wrench } from 'lucide-react'
import { expandUserRoles } from './utils'

export type PortalId = 'dealer' | 'assess' | 'insight' | 'garage'

export interface PortalDefinition {
  id: PortalId
  href: string
  label: string
  product: string
  description: string
  badge: string
  /** Any of these roles grants access. platform_admin is handled separately. */
  roles: string[]
  icon: LucideIcon
  accent: string
  iconColor: string
  ring: string
}

export const VELOPX_PORTALS: PortalDefinition[] = [
  {
    id: 'dealer',
    href: '/dealer',
    label: 'Dealer',
    product: 'VelopX Dealer',
    description: 'Manage your parts catalogue, respond to RFQs, and track dispatches.',
    badge: 'Parts dealer',
    roles: ['dealer_owner', 'dealer_staff'],
    icon: Store,
    accent: 'from-amber-500/15 via-amber-500/5 to-transparent',
    iconColor: 'text-amber-400',
    ring: 'hover:ring-amber-500/40',
  },
  {
    id: 'assess',
    href: '/assess',
    label: 'Assess',
    product: 'VelopX Assess',
    description: 'Validate invoices against live market benchmarks and flag overcharging.',
    badge: 'Insurance assessor',
    roles: ['assessor'],
    icon: ClipboardCheck,
    accent: 'from-blue-500/15 via-blue-500/5 to-transparent',
    iconColor: 'text-blue-400',
    ring: 'hover:ring-blue-500/40',
  },
  {
    id: 'insight',
    href: '/insight',
    label: 'Insight',
    product: 'VelopX Insight',
    description: 'Analytics, marketplace visibility, and fraud intelligence for insurers.',
    badge: 'Insurance company',
    roles: ['insurer_admin', 'insurer_staff'],
    icon: BarChart3,
    accent: 'from-purple-500/15 via-purple-500/5 to-transparent',
    iconColor: 'text-purple-400',
    ring: 'hover:ring-purple-500/40',
  },
  {
    id: 'garage',
    href: '/garage',
    label: 'Garage',
    product: 'VelopX Garage',
    description: 'Find parts, send RFQs, track inbound deliveries, and manage job cards.',
    badge: 'Workshop',
    roles: ['garage_owner', 'garage_staff'],
    icon: Wrench,
    accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    iconColor: 'text-emerald-400',
    ring: 'hover:ring-emerald-500/40',
  },
]

/** Preferred landing portal when a user has multiple products. */
const PORTAL_PRIORITY: PortalId[] = ['assess', 'dealer', 'garage', 'insight']

const PORTAL_PATH_PREFIXES: { prefix: string; id: PortalId }[] = [
  { prefix: '/dealer', id: 'dealer' },
  { prefix: '/assess', id: 'assess' },
  { prefix: '/insight', id: 'insight' },
  { prefix: '/insurer', id: 'insight' },
  { prefix: '/garage', id: 'garage' },
]

function hasPlatformAdmin(all: string[]): boolean {
  return all.includes('platform_admin')
}

export function getAccessiblePortals(
  role?: string | null,
  roles?: string[] | null,
): PortalDefinition[] {
  const all = expandUserRoles(role, roles)
  if (all.length === 0) return []
  if (hasPlatformAdmin(all)) return [...VELOPX_PORTALS]
  return VELOPX_PORTALS.filter((portal) => all.some((r) => portal.roles.includes(r)))
}

export function getPrimaryPortalPath(role?: string | null, roles?: string[] | null): string | null {
  const accessible = getAccessiblePortals(role, roles)
  if (accessible.length === 0) return null
  if (accessible.length === 1) return accessible[0].href

  const ids = new Set(accessible.map((p) => p.id))
  for (const id of PORTAL_PRIORITY) {
    if (ids.has(id)) {
      return accessible.find((p) => p.id === id)!.href
    }
  }
  return accessible[0].href
}

export function canAccessPortalPath(
  pathname: string,
  role?: string | null,
  roles?: string[] | null,
): boolean {
  const match = PORTAL_PATH_PREFIXES.find(({ prefix }) => pathname.startsWith(prefix))
  if (!match) return true

  const accessible = getAccessiblePortals(role, roles)
  return accessible.some((p) => p.id === match.id)
}

export function portalIdForPath(pathname: string): PortalId | null {
  return PORTAL_PATH_PREFIXES.find(({ prefix }) => pathname.startsWith(prefix))?.id ?? null
}

/** Default redirect after sign-in or visiting `/`. */
export function getRoleHomePath(role?: string | null, roles?: string[] | null): string {
  const all = expandUserRoles(role, roles)
  const accessible = getAccessiblePortals(role, roles)

  if (accessible.length === 0) {
    if (all.includes('driver')) return '/dealer/dispatch'
    return '/select-portal'
  }
  if (accessible.length === 1) return accessible[0].href
  // Multi-product accounts always land on the workspace picker first
  return '/select-portal'
}
