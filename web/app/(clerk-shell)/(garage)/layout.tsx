'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

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
    href: '/garage',
    label: 'Dashboard',
    exact: true,
    icon: <Ico d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    badge: null,
  },
  {
    href: '/garage/search',
    label: 'Find Parts',
    exact: false,
    icon: <Ico d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    badge: null,
  },
  {
    href: '/garage/rfqs',
    label: 'My RFQs',
    exact: false,
    icon: <Ico d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />,
    badge: 2,
  },
  {
    href: '/garage/orders',
    label: 'Orders',
    exact: false,
    icon: <Ico d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
    badge: 3,
  },
  {
    href: '/garage/deliveries',
    label: 'Deliveries',
    exact: false,
    icon: <Ico d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" d2="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />,
    badge: null,
  },
]

const TOOLS_NAV = [
  {
    href: '/garage/job-cards',
    label: 'Job Cards',
    exact: false,
    icon: <Ico d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    badge: null,
  },
  {
    href: '/garage/settings',
    label: 'Settings',
    exact: false,
    icon: <Ico d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    badge: null,
  },
]

function NavItem({ item }: { item: typeof MAIN_NAV[0] }) {
  const pathname = usePathname()
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-[#F5A623]/10 text-[#F5A623] font-medium'
          : 'text-[#8A97AA] hover:text-white hover:bg-white/5'
      }`}
    >
      {item.icon}
      <span className="flex-1">{item.label}</span>
      {item.badge != null && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          isActive ? 'bg-[#F5A623]/20 text-[#F5A623]' : 'bg-[#1E2E48] text-[#8A97AA]'
        }`}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060F1E] flex">
      <aside className="fixed top-0 left-0 h-screen w-[264px] bg-[#0A1628] border-r border-[#1E2E48] flex flex-col z-40">
        <div className="px-5 py-5 border-b border-[#1E2E48]">
          <Link href="/garage" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#F5A623] flex items-center justify-center text-black font-black text-sm">⚡</span>
            <div>
              <span className="text-white font-bold text-sm tracking-tight">velopX</span>
              <span className="block text-[#8A97AA] text-[10px] uppercase tracking-widest leading-none mt-0.5">Garage</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          <p className="text-[#3D5068] text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-1">Workshop</p>
          {MAIN_NAV.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}

          <p className="text-[#3D5068] text-[9px] font-bold uppercase tracking-[0.15em] px-3 mt-5 mb-1">Management</p>
          {TOOLS_NAV.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[#1E2E48] flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">Ama Owusu</p>
            <p className="text-[#8A97AA] text-[10px] truncate">Kumasi AutoFix</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-[264px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
