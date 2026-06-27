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
import { cn, expandUserRoles, isAssessorRole, isDealerRole, isInsurerRole } from '@/lib/utils'
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
  const isDealer = isDealerRole(role, roles ?? undefined)
  const isClaims = isAssessorRole(role, roles ?? undefined)
  const isInsurer = isInsurerRole(role, roles ?? undefined)
  const isPureAssessor = allRoles.includes('assessor')
  const isDualClaims = isPureAssessor && isInsurer

  const base: '/assess' | '/insight' = pathname.startsWith('/insight') ? '/insight' : '/assess'
  const nav = isClaims ? claimsNav(isDualClaims ? base : isInsurer ? '/insight' : '/assess') : dealerNav
  const homeHref = isDealer ? '/dealer' : isDualClaims ? base : isInsurer ? '/insight' : isClaims ? '/assess' : '/dealer'
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
    <>
      <div className="border-b border-border p-5">
        <BrandLogo href={homeHref} />
        <p className="mt-1 text-xs text-muted-foreground">{portalLabel}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== homeHref && pathname.startsWith(href))
          const count = badges?.[href]
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-l-2 border-primary bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count ? (
                <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
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
            className="mt-3 flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {base === '/assess' ? 'Switch to Insurer portal' : 'Switch to Assessor tools'}
          </Link>
        )}
      </nav>
      <div className="border-t border-border p-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-navy-950 md:flex">
        <NavContent />
      </aside>
      <div className="flex items-center justify-between border-b border-border bg-navy-950 p-4 md:hidden">
        <BrandLogo href={homeHref} />
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-navy-950">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
