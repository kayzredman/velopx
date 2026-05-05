import { apiFetch } from '@/lib/api'

interface LineItem {
  id: string
  partName: string
  invoicePrice: number
  currency: string
}

interface Claim {
  id: string
  status: string
  flag: string | null
  claimReference: string
  invoiceAmount: number
  currency: string
  createdAt: string
  assessor: { id: string; name: string | null; email: string }
  lineItems: LineItem[]
}

async function getClaims(): Promise<Claim[]> {
  try {
    const res = await apiFetch<{ data: Claim[] }>('/v1/claims')
    return res.data
  } catch {
    return []
  }
}

const FLAG_BADGE: Record<string, string> = {
  ok:      'bg-green-500/15 text-green-400 border border-green-500/30',
  review:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  flagged: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
}

export default async function InsurerAssessorsPage() {
  const claims = await getClaims()

  const flagged = claims.filter((c) => c.flag === 'flagged').length
  const closed  = claims.filter((c) => c.status === 'closed').length

  // Group by assessor
  const byAssessor = claims.reduce<Record<string, { name: string; email: string; claims: Claim[] }>>((acc, c) => {
    const key = c.assessor.id
    if (!acc[key]) {
      acc[key] = { name: c.assessor.name ?? c.assessor.email, email: c.assessor.email, claims: [] }
    }
    acc[key].claims.push(c)
    return acc
  }, {})

  const assessorList = Object.entries(byAssessor)
    .map(([id, info]) => ({
      id,
      name:    info.name,
      email:   info.email,
      total:   info.claims.length,
      flagged: info.claims.filter((c) => c.flag === 'flagged').length,
      closed:  info.claims.filter((c) => c.status === 'closed').length,
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Assessors</h1>
        <p className="text-[#506070] text-sm mt-1">Assessor claim activity and flag rates</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] px-5 py-3 flex items-center gap-3">
          <span className="text-[#506070] text-xs font-semibold uppercase tracking-wider">Total Claims</span>
          <span className="text-[#E8ECF1] font-bold text-xl">{claims.length}</span>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-5 py-3 flex items-center gap-3">
          <span className="text-rose-400/70 text-xs font-semibold uppercase tracking-wider">Flagged</span>
          <span className="text-rose-400 font-bold text-xl">{flagged}</span>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-3 flex items-center gap-3">
          <span className="text-green-400/70 text-xs font-semibold uppercase tracking-wider">Closed</span>
          <span className="text-green-400 font-bold text-xl">{closed}</span>
        </div>
      </div>

      {/* Assessor summary table */}
      {assessorList.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8A97AA] uppercase tracking-wider mb-3">Assessor Summary</h2>
          <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2E48] bg-[#0C1526]">
                  <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Assessor</th>
                  <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Total Claims</th>
                  <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Flagged</th>
                  <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Closed</th>
                  <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Flag Rate</th>
                </tr>
              </thead>
              <tbody>
                {assessorList.map((a) => (
                  <tr key={a.id} className="border-b border-[#1E2E48]/60 last:border-0 hover:bg-[#0C1526]/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[#E8ECF1] text-xs font-medium">{a.name}</p>
                      <p className="text-[#3D5068] text-[10px]">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#8A97AA] text-xs">{a.total}</td>
                    <td className="px-4 py-3 text-rose-400 text-xs font-semibold">{a.flagged}</td>
                    <td className="px-4 py-3 text-green-400 text-xs">{a.closed}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#1E2E48] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${a.total > 0 ? Math.round((a.flagged / a.total) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-[#8A97AA]">
                          {a.total > 0 ? Math.round((a.flagged / a.total) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent claims */}
      <div>
        <h2 className="text-sm font-semibold text-[#8A97AA] uppercase tracking-wider mb-3">Recent Claims</h2>
        <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48] bg-[#0C1526]">
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Claim Ref</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Assessor</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Invoice</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Flag</th>
                <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-[#506070] text-sm">No claim activity yet</td>
                </tr>
              ) : (
                claims.slice(0, 50).map((c) => (
                  <tr key={c.id} className="border-b border-[#1E2E48]/60 last:border-0 hover:bg-[#0C1526]/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#E8ECF1] text-xs">{c.claimReference}</td>
                    <td className="px-4 py-3 text-[#8A97AA] text-xs">
                      {c.assessor.name ?? c.assessor.email}
                    </td>
                    <td className="px-4 py-3 text-[#E8ECF1] text-xs font-semibold">
                      {c.currency} {Number(c.invoiceAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {c.flag ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${FLAG_BADGE[c.flag] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                          {c.flag}
                        </span>
                      ) : <span className="text-[#3D5068] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[#506070] text-xs">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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

