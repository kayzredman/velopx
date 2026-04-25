import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

const NAV_LINKS = [
  { href: '/dealer', label: 'Dashboard' },
  { href: '/dealer/parts', label: 'Parts' },
  { href: '/dealer/orders', label: 'Orders' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070C14] flex flex-col">
      <header className="border-b border-[#1E2E48] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold">
            velop<span className="text-[#F5A623]">X</span>
          </span>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm text-[#8A97AA] hover:text-[#E8ECF1] hover:bg-[#111E34] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <UserButton
          appearance={{
            elements: { avatarBox: 'ring-2 ring-[#F5A623]' },
          }}
        />
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
