import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Part {
  id: string
}

interface Order {
  id: string
  status: string
}

interface Quote {
  id: string
  status: string
}

async function getDealerStats() {
  try {
    const [partsRes, ordersRes, quotesRes] = await Promise.all([
      apiFetch<{ data: Part[]; meta: { total: number } }>('/v1/parts?limit=1'),
      apiFetch<{ data: Order[] }>('/v1/orders'),
      apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer'),
    ])

    const openOrders = ordersRes.data.filter((o) =>
      ['pending', 'confirmed', 'dispatched'].includes(o.status),
    ).length

    const pendingQuotes = quotesRes.data.filter((q) => q.status === 'pending').length

    return {
      activeListings: partsRes.meta?.total ?? partsRes.data.length,
      openOrders,
      pendingQuotes,
    }
  } catch {
    return { activeListings: 0, openOrders: 0, pendingQuotes: 0 }
  }
}

export default async function DealerDashboard() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role as
    | string
    | undefined

  const stats = await getDealerStats()

  const statCards = [
    { label: 'Active Listings', value: stats.activeListings, href: '/dealer/parts' },
    { label: 'Pending Quotes', value: stats.pendingQuotes, href: '/dealer/parts' },
    { label: 'Open Orders', value: stats.openOrders, href: '/dealer/orders' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Dealer Dashboard</h1>
        <p className="text-[#8A97AA] mt-1">Manage your parts catalogue and orders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-6 hover:border-[#F5A623]/40 transition-colors"
          >
            <p className="text-[#8A97AA] text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-[#E8ECF1] mt-1">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dealer/parts"
          className="flex items-center gap-3 rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5 hover:border-[#F5A623]/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] text-lg font-bold">
            +
          </div>
          <div>
            <p className="text-[#E8ECF1] font-medium text-sm">Add a Part</p>
            <p className="text-[#8A97AA] text-xs mt-0.5">List a new part in your catalogue</p>
          </div>
        </Link>
        <Link
          href="/dealer/orders"
          className="flex items-center gap-3 rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5 hover:border-[#F5A623]/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] text-lg font-bold">
            ↗
          </div>
          <div>
            <p className="text-[#E8ECF1] font-medium text-sm">View Orders</p>
            <p className="text-[#8A97AA] text-xs mt-0.5">Manage incoming orders and dispatches</p>
          </div>
        </Link>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <pre className="text-xs text-[#8A97AA] bg-[#0C1526] border border-[#1E2E48] rounded p-4 overflow-auto">
          {JSON.stringify({ role, stats }, null, 2)}
        </pre>
      )}
    </div>
  )
}
