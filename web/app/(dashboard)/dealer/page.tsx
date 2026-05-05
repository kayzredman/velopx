import { auth } from '@clerk/nextjs/server'
import { apiFetch } from '@/lib/api'

interface Quote { id: string; status: string }

interface AnalyticsData {
  revenueMtd: number
  ordersMtd: number
  ordersToday: number
  quoteWinRate: number
  topParts: { partId: string; name: string; oemNumber: string | null; currency: string; orderCount: number; totalRevenue: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
}

interface Delivery {
  id: string
  status: string
  estimatedDelivery: string | null
  driver: { id: string; name: string | null; email: string } | null
  order: {
    id: string
    buyer: { id: string; name: string | null; email: string }
    items: { part: { name: string; oemNumber: string | null; condition: string } }[]
  }
}

const ACTIVE_DISPATCH_STATUSES = ['assigned', 'collected', 'in_transit']

function fmtRevenue(amount: number, currency = 'GHS') {
  if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(1)}k`
  return `${currency} ${Math.round(amount).toLocaleString()}`
}

function statusProps(status: string): { label: string; cls: string } {
  switch (status) {
    case 'in_transit': return { label: 'IN-TRANSIT', cls: 'bg-blue-500/15 text-blue-400' }
    case 'assigned':   return { label: 'ASSIGNED',   cls: 'bg-amber-500/15 text-amber-400' }
    case 'collected':  return { label: 'COLLECTED',  cls: 'bg-purple-500/15 text-purple-400' }
    default:           return { label: status.toUpperCase(), cls: 'bg-[#1E2E48] text-[#8A97AA]' }
  }
}

async function getDealerDashboardData() {
  try {
    const [analyticsRes, deliveriesRes, quotesRes] = await Promise.all([
      apiFetch<{ data: AnalyticsData }>('/v1/analytics/dealer'),
      apiFetch<{ data: Delivery[] }>('/v1/deliveries'),
      apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer'),
    ])

    const analytics  = analyticsRes.data
    const dispatches = deliveriesRes.data.filter((d) => ACTIVE_DISPATCH_STATUSES.includes(d.status))
    const pendingRfqs = quotesRes.data.filter((q) => q.status === 'pending').length

    // Revenue trend: compare current month to previous month
    const monthly = analytics.monthlyRevenue
    const revTrend = (() => {
      if (monthly.length < 2) return null
      const curr = monthly[monthly.length - 1].revenue
      const prev = monthly[monthly.length - 2].revenue
      if (prev === 0) return null
      const pct = ((curr - prev) / prev) * 100
      return pct
    })()

    return { analytics, dispatches, pendingRfqs, revTrend }
  } catch {
    return null
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DealerDashboard() {
  const { sessionClaims } = await auth()
  void sessionClaims

  const data  = await getDealerDashboardData()
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  const analytics   = data?.analytics
  const dispatches  = data?.dispatches ?? []
  const pendingRfqs = data?.pendingRfqs ?? 0
  const revTrend    = data?.revTrend

  const revenueMtdStr = analytics ? fmtRevenue(analytics.revenueMtd) : '—'
  const revTrendStr   = revTrend != null
    ? `${revTrend >= 0 ? '↑' : '↓'} ${Math.abs(revTrend).toFixed(1)}% vs last month`
    : '— vs last month'

  const STAT_CARDS = [
    { label: 'ORDERS TODAY',    value: analytics ? String(analytics.ordersToday)  : '—', trend: analytics ? `${analytics.ordersMtd} this month` : '', trendColor: 'text-green-400' },
    { label: 'PENDING RFQS',    value: String(pendingRfqs),                              trend: 'Respond within 4h',   trendColor: 'text-[#F5A623]' },
    { label: 'QUOTE WIN RATE',  value: analytics ? `${analytics.quoteWinRate}%`   : '—', trend: 'Accepted / responded', trendColor: 'text-green-400' },
    { label: 'REVENUE MTD',     value: revenueMtdStr,                                    trend: revTrendStr,            trendColor: revTrend != null && revTrend >= 0 ? 'text-green-400' : 'text-red-400' },
  ]

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Dashboard</h1>
        <p className="text-[#506070] text-sm mt-1">{today} · Performance overview and pending actions</p>
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

      {/* Urgent RFQ banner */}
      <div className="rounded-xl border border-[#F5A623]/25 bg-gradient-to-r from-[#F5A623]/10 to-[#F5A623]/[0.03] p-5">
        <p className="text-[#F5A623] text-[11px] font-bold uppercase tracking-[0.12em] mb-2">
          ⚡ New RFQ — Respond by 14:30
        </p>
        <p className="text-[#8A97AA] text-sm mb-1">
          Tema Motors &amp; Repairs · Claim <span className="font-mono text-[#506070] text-xs">CLM-GH-8821</span>
        </p>
        <p className="text-[#E8ECF1] text-sm font-semibold mb-4">
          2020 Toyota Hilux 2.8 GD-6 · <span className="text-white">Front Bumper Assembly (OEM)</span>
        </p>
        <div className="flex gap-3">
          <button type="button" className="px-4 py-2 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors">
            Send Quote
          </button>
          <button type="button" className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:border-white/20 transition-colors">
            Decline
          </button>
        </div>
      </div>

      {/* Active Dispatches */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-[#E8ECF1] text-sm font-bold">Active Dispatches</h2>
          <a href="/dealer/dispatch" className="text-[#F5A623] text-xs font-semibold hover:text-[#d4911f] transition-colors">
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['ORDER', 'PART', 'STATUS', 'BUYER', 'ETA', 'DRIVER'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[#2D4264] text-[9px] font-bold uppercase tracking-[0.12em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-[#506070] text-sm">No active dispatches</td>
                </tr>
              ) : dispatches.slice(0, 5).map((d, i) => {
                const sp = statusProps(d.status)
                const partName = d.order.items[0]?.part.name ?? 'Unknown'
                const buyer  = d.order.buyer.name ?? d.order.buyer.email
                const driver = d.driver ? (d.driver.name ?? d.driver.email) : 'Unassigned'
                const eta    = d.estimatedDelivery
                  ? new Date(d.estimatedDelivery).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'TBD'
                return (
                  <tr key={d.id} className={`${i < dispatches.length - 1 ? 'border-b border-[#1E2E48]' : ''} hover:bg-[#111E34] transition-colors`}>
                    <td className="px-5 py-3.5 text-[#506070] font-mono text-xs">{d.order.id.slice(0, 8)}</td>
                    <td className="px-5 py-3.5 text-[#E8ECF1] font-semibold">{partName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${sp.cls}`}>{sp.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[#8A97AA]">{buyer}</td>
                    <td className="px-5 py-3.5 text-[#8A97AA] text-xs">{eta}</td>
                    <td className="px-5 py-3.5 text-[#8A97AA] text-xs">{driver}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Catalogue Listings */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-[#E8ECF1] text-sm font-bold">Top Catalogue Listings — This Week</h2>
          <a href="/dealer/parts" className="text-[#F5A623] text-xs font-semibold hover:text-[#d4911f] transition-colors">
            Manage Catalogue →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['PART NAME', 'OEM NO.', 'ORDERS', 'REVENUE'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[#2D4264] text-[9px] font-bold uppercase tracking-[0.12em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(analytics?.topParts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-[#506070] text-sm">No sales data yet</td>
                </tr>
              ) : (analytics?.topParts ?? []).map((p, i, arr) => (
                <tr key={p.partId} className={`${i < arr.length - 1 ? 'border-b border-[#1E2E48]' : ''} hover:bg-[#111E34] transition-colors`}>
                  <td className="px-5 py-3.5 text-[#E8ECF1] font-semibold">{p.name}</td>
                  <td className="px-5 py-3.5 text-[#506070] font-mono text-xs">{p.oemNumber ?? '—'}</td>
                  <td className="px-5 py-3.5 text-[#E8ECF1] font-semibold">{p.orderCount}</td>
                  <td className="px-5 py-3.5 text-[#8A97AA]">{fmtRevenue(p.totalRevenue, p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

