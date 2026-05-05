'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

// ── Icon helper ────────────────────────────────────────────────────────────────
function Ico({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg aria-hidden="true" className="w-[15px] h-[15px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
    </svg>
  )
}

const MAIN_NAV = [
  {
    href: '/dealer',
    label: 'Dashboard',
    exact: true,
    icon: <Ico d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    badge: null,
  },
  {
    href: '/dealer/parts',
    label: 'Catalogue',
    exact: false,
    icon: <Ico d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    badge: 84,
  },
  {
    href: '/dealer/orders',
    label: 'Orders',
    exact: false,
    icon: <Ico d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
    badge: null,
  },
  {
    href: '/dealer/rfqs',
    label: 'RFQs',
    exact: false,
    icon: <Ico d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />,
    badge: 3,
  },
  {
    href: '/dealer/dispatch',
    label: 'Dispatch',
    exact: false,
    icon: <Ico d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" d2="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />,
    badge: null,
  },
]

const INSIGHT_NAV = [
  {
    href: '/dealer/analytics',
    label: 'Analytics',
    icon: <Ico d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    badge: null,
  },
  {
    href: '/dealer/reviews',
    label: 'Reviews',
    icon: <Ico d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    badge: null,
  },
  {
    href: '/dealer/settings',
    label: 'Settings',
    icon: <Ico d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    badge: null,
  },
]

function NavItem({
  item,
}: {
  item: { href: string; label: string; icon: React.ReactNode; badge: number | null; exact?: boolean }
}) {
  const pathname = usePathname()
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dealer' ? true : pathname === item.href

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-[#F5A623]/10 text-[#F5A623] font-semibold'
          : 'text-[#8A97AA] hover:text-[#E8ECF1] hover:bg-[#111E34]'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={active ? 'text-[#F5A623]' : 'text-[#506070]'}>{item.icon}</span>
        {item.label}
      </span>
      {item.badge != null && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight ${
            active ? 'bg-[#F5A623]/20 text-[#F5A623]' : 'bg-[#1E2E48] text-[#8A97AA]'
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070C14] flex">
      {/* ── Sidebar ── */}
      <aside className="w-[264px] flex-shrink-0 border-r border-[#1E2E48] bg-[#0B1220] flex flex-col fixed top-0 bottom-0 overflow-y-auto">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-[#1E2E48]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5A623] flex items-center justify-center text-black font-black text-sm leading-none">⚡</div>
            <div className="leading-none">
              <span className="text-[16px] font-extrabold tracking-tight">velop<span className="text-[#F5A623]">X</span></span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#506070]">Dealer</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[#2D4264] text-[9px] font-bold uppercase tracking-[0.15em] px-3 pb-2 pt-1">Main</p>
          {MAIN_NAV.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
          <p className="text-[#2D4264] text-[9px] font-bold uppercase tracking-[0.15em] px-3 pb-2 pt-5">Insights</p>
          {INSIGHT_NAV.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#1E2E48] flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: 'w-9 h-9 ring-2 ring-[#1E2E48]' } }} />
          <div className="min-w-0">
            <p className="text-[#E8ECF1] text-sm font-semibold truncate">Accra Auto Parts</p>
            <p className="text-[#506070] text-xs truncate">Accra, Ghana</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 ml-[264px] min-h-screen">
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  )
}

