import { apiFetch } from '@/lib/api'

interface Delivery {
  id: string
  status: string
  createdAt: string
  collectedAt: string | null
  deliveredAt: string | null
  driver: { id: string; name: string | null; email: string } | null
  order: {
    id: string
    claimReference: string | null
    items: { part: { id: string; name: string } }[]
  }
}

async function getDeliveries(): Promise<Delivery[]> {
  try {
    const res = await apiFetch<{ data: Delivery[] }>('/v1/deliveries')
    return res.data
  } catch {
    return []
  }
}

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]',
  assigned:   'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  collected:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  in_transit: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  delivered:  'bg-green-500/15 text-green-400 border border-green-500/30',
  confirmed:  'bg-green-500/15 text-green-400 border border-green-500/30',
  disputed:   'bg-rose-500/15 text-rose-400 border border-rose-500/30',
}

export default async function InsurerDeliveriesPage() {
  const deliveries = await getDeliveries()

  const inTransit = deliveries.filter((d) => ['assigned', 'collected', 'in_transit'].includes(d.status)).length
  const confirmed = deliveries.filter((d) => d.status === 'confirmed').length
  const disputed = deliveries.filter((d) => d.status === 'disputed').length
  const completionRate = deliveries.length > 0
    ? Math.round(((confirmed) / deliveries.length) * 100)
    : 0

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Delivery Performance</h1>
        <p className="text-[#506070] text-sm mt-1">Track all parts deliveries across your claims</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: deliveries.length, color: 'text-[#E8ECF1]', border: 'border-[#1E2E48]', bg: 'bg-[#0C1526]' },
          { label: 'In Transit', value: inTransit, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
          { label: 'Confirmed', value: confirmed, color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5' },
          { label: 'Disputed', value: disputed, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-5`}>
            <p className="text-[#506070] text-[10px] font-bold uppercase tracking-[0.12em]">{s.label}</p>
            <p className={`text-3xl font-extrabold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Completion rate */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[#506070] text-xs font-semibold uppercase tracking-wider">Completion Rate</p>
          <span className="text-[#E8ECF1] font-bold text-sm">{completionRate}%</span>
        </div>
        <div className="h-2 bg-[#1E2E48] rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
        </div>
        <p className="text-[#3D5068] text-[11px] mt-2">{confirmed} of {deliveries.length} deliveries confirmed received</p>
      </div>

      {/* Deliveries table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2E48] bg-[#0C1526]">
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Claim Ref</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Parts</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Driver</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Delivered</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-14 text-[#506070] text-sm">No deliveries yet</td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} className="border-b border-[#1E2E48]/60 last:border-0 hover:bg-[#0C1526]/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-[#E8ECF1] text-xs">
                    {d.order.claimReference ?? d.order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-[#8A97AA] text-xs max-w-[200px]">
                    <span className="truncate block">
                      {d.order.items?.map((i) => i.part.name).join(', ') || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8A97AA] text-xs">
                    {d.driver?.name ?? d.driver?.email ?? <span className="text-[#3D5068]">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[d.status] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#506070] text-xs">
                    {d.deliveredAt
                      ? new Date(d.deliveredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
