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
    href: '/insight',
    label: 'Overview',
    exact: true,
    icon: <Ico d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    badge: null,
  },
  {
    href: '/insight/claims',
    label: 'Claims',
    exact: false,
    icon: <Ico d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    badge: 24,
  },
  {
    href: '/insight/anomalies',
    label: 'Anomalies',
    exact: false,
    icon: <Ico d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    badge: 8,
  },
  {
    href: '/insight/assessors',
    label: 'Assessors',
    exact: false,
    icon: <Ico d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    badge: null,
  },
]

const TOOLS_NAV = [
  {
    href: '/insight/reports',
    label: 'Reports',
    exact: false,
    icon: <Ico d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    badge: null,
  },
  {
    href: '/insight/settings',
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

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060F1E] flex">
      <aside className="fixed top-0 left-0 h-screen w-[264px] bg-[#0A1628] border-r border-[#1E2E48] flex flex-col z-40">
        <div className="px-5 py-5 border-b border-[#1E2E48]">
          <Link href="/insight" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#F5A623] flex items-center justify-center text-black font-black text-sm">⚡</span>
            <div>
              <span className="text-white font-bold text-sm tracking-tight">velopX</span>
              <span className="block text-[#8A97AA] text-[10px] uppercase tracking-widest leading-none mt-0.5">Insight</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          <p className="text-[#3D5068] text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-1">Intelligence</p>
          {MAIN_NAV.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}

          <p className="text-[#3D5068] text-[9px] font-bold uppercase tracking-[0.15em] px-3 mt-5 mb-1">Tools</p>
          {TOOLS_NAV.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[#1E2E48] flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">Abena Osei</p>
            <p className="text-[#8A97AA] text-[10px] truncate">Enterprise Assurance Ltd</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-[264px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
