'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquareQuote,
  Truck,
  Menu,
  Wrench,
  Building2,
  Store,
  ArrowLeftRight,
} from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn, expandUserRoles, isAssessorRole, isDealerRole, isInsurerRole } from '@/lib/utils'
import { getAccessiblePortals } from '@/lib/portals'
import { useState } from 'react'

const dealerNav = [
  { href: '/dealer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dealer/parts', label: 'My Catalogue', icon: Package },
  { href: '/dealer/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dealer/rfqs', label: 'RFQs', icon: MessageSquareQuote },
  { href: '/dealer/dispatch', label: 'Dispatch', icon: Truck },
]

function claimsNav(base: '/assess' | '/insight') {
  return [
    { href: base, label: 'Tools', icon: Wrench },
    { href: `${base}/catalogue`, label: 'Marketplace', icon: Package },
    { href: `${base}/garages`, label: 'Garages', icon: Building2 },
    { href: `${base}/dealers`, label: 'Dealers', icon: Store },
  ]
}

export function AppSidebar({
  role,
  roles,
  badges,
}: {
  role?: string | null
  roles?: string[] | null
  badges?: Record<string, number>
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const allRoles = expandUserRoles(role, roles ?? undefined)
  const accessiblePortals = getAccessiblePortals(role, roles ?? undefined)
  const isDealer = isDealerRole(role, roles ?? undefined)
  const isClaims = isAssessorRole(role, roles ?? undefined)
  const isInsurer = isInsurerRole(role, roles ?? undefined)
  const isPureAssessor = allRoles.includes('assessor')
  const isDualClaims = isPureAssessor && isInsurer
  const hasMultiPortal = accessiblePortals.length > 1

  const base: '/assess' | '/insight' = pathname.startsWith('/insight') ? '/insight' : '/assess'
  const nav = isDealer
    ? dealerNav
    : isClaims
      ? claimsNav(isDualClaims ? base : isInsurer ? '/insight' : '/assess')
      : hasMultiPortal
        ? [{ href: '/select-portal', label: 'Choose workspace', icon: ArrowLeftRight }]
        : []
  const homeHref = isDealer
    ? '/dealer'
    : isDualClaims
      ? base
      : isInsurer
        ? '/insight'
        : isClaims
          ? '/assess'
          : accessiblePortals[0]?.href ?? '/select-portal'
  const portalLabel = isDealer
    ? 'Dealer'
    : isDualClaims
      ? 'Assessor & Insurer'
      : isInsurer
        ? 'Insurer'
        : isClaims
          ? 'Assessor'
          : 'Portal'

  const NavContent = () => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-sidebar-border p-5 pl-6">
        <BrandLogo href={homeHref} className="text-sidebar-foreground" />
        <p className="mt-1 text-xs text-sidebar-muted">{portalLabel}</p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 pl-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== homeHref && pathname.startsWith(href))
          const count = badges?.[href]
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-l-2 border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10'
                  : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {count ? (
                <span className="ml-auto rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {count}
                </span>
              ) : null}
            </Link>
          )
        })}
        {isDualClaims && (
          <Link
            href={base === '/assess' ? '/insight' : '/assess'}
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center gap-3 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {base === '/assess' ? 'Switch to Insurer portal' : 'Switch to Assessor tools'}
          </Link>
        )}
        {hasMultiPortal && !isDualClaims && (
          <Link
            href="/select-portal"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center gap-3 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Switch workspace
          </Link>
        )}
      </nav>
      <div className="mt-auto shrink-0 space-y-2 border-t border-sidebar-border p-4 pl-6">
        <p className="text-xs font-medium text-sidebar-muted">Appearance</p>
        <ThemeToggle variant="sidebar" />
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  )

  return (
    <>
      <aside className="portal-sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex">
        <NavContent />
      </aside>
      <div className="portal-sidebar flex items-center justify-between border-b border-sidebar-border p-4 md:hidden">
        <BrandLogo href={homeHref} className="text-sidebar-foreground" />
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-white/10" onClick={() => setOpen(!open)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <aside className="portal-sidebar relative flex h-full w-64 flex-col border-r">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
