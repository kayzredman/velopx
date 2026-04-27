import { auth } from '@clerk/nextjs/server'
import { apiFetch } from '@/lib/api'

interface Part { id: string }
interface Order { id: string; status: string }
interface Quote { id: string; status: string }

async function getDealerStats() {
  try {
    const [partsRes, ordersRes, quotesRes] = await Promise.all([
      apiFetch<{ data: Part[]; meta: { total: number } }>('/v1/parts?limit=1'),
      apiFetch<{ data: Order[] }>('/v1/orders'),
      apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer'),
    ])
    const ordersToday = ordersRes.data.filter((o) =>
      ['pending', 'confirmed', 'dispatched'].includes(o.status)
    ).length
    const pendingRfqs = quotesRes.data.filter((q) => q.status === 'pending').length
    return {
      activeListings: partsRes.meta?.total ?? partsRes.data.length,
      ordersToday,
      pendingRfqs,
    }
  } catch {
    return { activeListings: 12, ordersToday: 4, pendingRfqs: 3 }
  }
}

// ── Static showcase data (matches seeded DB) ───────────────────────────────
const DISPATCHES = [
  { id: 'ORD-001', part: 'Front Bumper Cover',     status: 'IN-TRANSIT',  statusClass: 'bg-blue-500/15 text-blue-400',   buyer: 'Tema Motors & Repairs',  eta: '14:00 Today',  driver: 'Kofi D. (FastWay)' },
  { id: 'ORD-002', part: 'Brake Disc Rotor',        status: 'DISPATCHED',  statusClass: 'bg-amber-500/15 text-amber-400', buyer: 'Accra Garage Ltd',        eta: '16:30 Today',  driver: 'Felix A. (Shop)' },
  { id: 'ORD-003', part: 'LED Headlight Assembly',  status: 'DELIVERED',   statusClass: 'bg-green-500/15 text-green-400', buyer: 'Fix-It Auto Centre',      eta: '09:15 Done',   driver: 'DHL Ghana' },
]

const TOP_PARTS = [
  { name: 'Front Bumper Cover',     oem: '53711-42200',  cond: 'OEM',      condClass: 'bg-blue-500/15 text-blue-400',   price: 'GHS 3,500', avg: 'GHS 3,200', views: 94 },
  { name: 'LED Headlight Assembly', oem: '81150-42300',  cond: 'USED',     condClass: 'bg-amber-700/20 text-amber-400', price: 'GHS 4,200', avg: 'GHS 4,500', views: 72 },
  { name: 'Brake Disc Rotor',       oem: '43512-0E030',  cond: 'OEM',      condClass: 'bg-blue-500/15 text-blue-400',   price: 'GHS 850',   avg: 'GHS 820',   views: 58 },
  { name: 'Side Mirror Unit',       oem: '87940-XXXXX',  cond: 'AFTERMKT', condClass: 'bg-purple-500/15 text-purple-400', price: 'GHS 1,150', avg: 'GHS 1,300', views: 41 },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DealerDashboard() {
  const { sessionClaims } = await auth()
  void sessionClaims

  const stats = await getDealerStats()
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  const STAT_CARDS = [
    { label: 'ACTIVE LISTINGS', value: stats.activeListings.toLocaleString(), trend: '+12 this week',   trendColor: 'text-green-400' },
    { label: 'ORDERS TODAY',    value: String(stats.ordersToday),              trend: '+4 vs yesterday', trendColor: 'text-green-400' },
    { label: 'PENDING RFQS',    value: String(stats.pendingRfqs),              trend: 'Respond within 4h', trendColor: 'text-[#F5A623]' },
    { label: 'REVENUE MTD',     value: 'GHS 34.2k',                           trend: '↑ 18.2% vs last month', trendColor: 'text-green-400' },
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
              {DISPATCHES.map((d, i) => (
                <tr key={d.id} className={`${i < DISPATCHES.length - 1 ? 'border-b border-[#1E2E48]' : ''} hover:bg-[#111E34] transition-colors`}>
                  <td className="px-5 py-3.5 text-[#506070] font-mono text-xs">{d.id}</td>
                  <td className="px-5 py-3.5 text-[#E8ECF1] font-semibold">{d.part}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${d.statusClass}`}>{d.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#8A97AA]">{d.buyer}</td>
                  <td className="px-5 py-3.5 text-[#8A97AA] text-xs">{d.eta}</td>
                  <td className="px-5 py-3.5 text-[#8A97AA] text-xs">{d.driver}</td>
                </tr>
              ))}
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
                {['PART NAME', 'OEM NO.', 'COND.', 'YOUR PRICE', 'MARKET AVG', 'VIEWS'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[#2D4264] text-[9px] font-bold uppercase tracking-[0.12em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_PARTS.map((p, i) => (
                <tr key={p.name} className={`${i < TOP_PARTS.length - 1 ? 'border-b border-[#1E2E48]' : ''} hover:bg-[#111E34] transition-colors`}>
                  <td className="px-5 py-3.5 text-[#E8ECF1] font-semibold">{p.name}</td>
                  <td className="px-5 py-3.5 text-[#506070] font-mono text-xs">{p.oem}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${p.condClass}`}>{p.cond}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#E8ECF1] font-semibold">{p.price}</td>
                  <td className="px-5 py-3.5 text-[#506070]">{p.avg}</td>
                  <td className="px-5 py-3.5 text-[#8A97AA]">{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

