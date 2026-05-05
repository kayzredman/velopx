import { apiFetch } from '@/lib/api'

interface Order {
  id: string
  status: string
  claimReference: string | null
  totalAmount: string
  currency: string
  createdAt: string
  buyer: { id: string; name: string | null; email: string }
}

interface Delivery {
  id: string
  status: string
  createdAt: string
}

interface Quote {
  id: string
  status: string
  createdAt: string
}

interface DashboardData {
  orders: Order[]
  deliveries: Delivery[]
  quotes: Quote[]
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const [ordersRes, deliveriesRes, quotesRes] = await Promise.all([
      apiFetch<{ data: Order[] }>('/v1/orders'),
      apiFetch<{ data: Delivery[] }>('/v1/deliveries'),
      apiFetch<{ data: Quote[] }>('/v1/quotes'),
    ])
    return {
      orders: ordersRes.data,
      deliveries: deliveriesRes.data,
      quotes: quotesRes.data,
    }
  } catch {
    return { orders: [], deliveries: [], quotes: [] }
  }
}

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  confirmed:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  dispatched: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  delivered:  'bg-green-500/15 text-green-400 border border-green-500/30',
  completed:  'bg-green-500/15 text-green-400 border border-green-500/30',
  cancelled:  'bg-red-500/15 text-red-400 border border-red-500/30',
  disputed:   'bg-rose-500/15 text-rose-400 border border-rose-500/30',
}

export default async function InsurerDashboard() {
  const { orders, deliveries, quotes } = await getDashboardData()

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  })

  const totalClaims = orders.length
  const activeClaims = orders.filter((o) =>
    ['pending', 'confirmed', 'dispatched'].includes(o.status),
  ).length
  const disputedClaims = orders.filter((o) => o.status === 'disputed').length
  const activeDeliveries = deliveries.filter((d) =>
    ['assigned', 'collected', 'in_transit'].includes(d.status),
  ).length
  const pendingAssessments = quotes.filter((q) => q.status === 'pending').length

  const STAT_CARDS = [
    {
      label: 'TOTAL CLAIMS',
      value: totalClaims.toLocaleString(),
      trend: `${activeClaims} active`,
      trendColor: activeClaims > 0 ? 'text-amber-400' : 'text-[#506070]',
    },
    {
      label: 'ACTIVE DELIVERIES',
      value: activeDeliveries.toLocaleString(),
      trend: 'In transit now',
      trendColor: activeDeliveries > 0 ? 'text-blue-400' : 'text-[#506070]',
    },
    {
      label: 'PENDING ASSESSMENTS',
      value: pendingAssessments.toLocaleString(),
      trend: 'Awaiting assessor response',
      trendColor: pendingAssessments > 0 ? 'text-[#F5A623]' : 'text-[#506070]',
    },
    {
      label: 'DISPUTED CLAIMS',
      value: disputedClaims.toLocaleString(),
      trend: disputedClaims > 0 ? 'Requires review' : 'None open',
      trendColor: disputedClaims > 0 ? 'text-rose-400' : 'text-green-400',
    },
  ]

  const recentOrders = orders.slice(0, 6)

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Insurer Dashboard</h1>
        <p className="text-[#506070] text-sm mt-1">{today} · Claims overview and delivery performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5">
            <p className="text-[#506070] text-[10px] font-bold uppercase tracking-[0.12em]">{s.label}</p>
            <p className="text-3xl font-extrabold text-[#E8ECF1] mt-2 leading-tight">{s.value}</p>
            <p className={`text-xs mt-2 font-medium ${s.trendColor}`}>{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Delivery performance snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            label: 'Pending',
            count: deliveries.filter((d) => d.status === 'pending').length,
            color: 'text-[#8A97AA]',
            bg: 'bg-[#1E2E48]/40',
          },
          {
            label: 'In Transit',
            count: deliveries.filter((d) => ['assigned', 'collected', 'in_transit'].includes(d.status)).length,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border border-blue-500/20',
          },
          {
            label: 'Confirmed',
            count: deliveries.filter((d) => d.status === 'confirmed').length,
            color: 'text-green-400',
            bg: 'bg-green-500/10 border border-green-500/20',
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.bg}`}>
            <p className="text-[#506070] text-xs font-semibold uppercase tracking-wider">{s.label} Deliveries</p>
            <p className={`text-4xl font-extrabold mt-2 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Recent claims */}
      <div>
        <h2 className="text-sm font-semibold text-[#8A97AA] uppercase tracking-wider mb-3">Recent Claims</h2>
        <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48] bg-[#0C1526]">
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Claim Ref</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Buyer</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#506070] text-sm">
                    No claims yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#1E2E48]/60 last:border-0 hover:bg-[#0C1526]/60">
                    <td className="px-4 py-3 font-mono text-[#E8ECF1] text-xs">
                      {order.claimReference ?? order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-[#8A97AA] text-xs">
                      {order.buyer?.name ?? order.buyer?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[#E8ECF1] text-xs font-semibold">
                      {order.currency} {Number(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${ORDER_STATUS_BADGE[order.status] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#506070] text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
