import { apiFetch } from '@/lib/api'

interface LineItem {
  id: string
  partName: string
  oemNumber: string | null
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
  garageName: string | null
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

const STATUS_BADGE: Record<string, string> = {
  open:         'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  under_review: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  closed:       'bg-green-500/15 text-green-400 border border-green-500/30',
}

const FLAG_BADGE: Record<string, string> = {
  ok:      'bg-green-500/15 text-green-400 border border-green-500/30',
  review:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  flagged: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
}

export default async function InsurerClaimsPage() {
  const claims = await getClaims()

  const totalValue = claims.reduce((sum, c) => sum + Number(c.invoiceAmount), 0)
  const flagged = claims.filter((c) => c.flag === 'flagged').length
  const closed = claims.filter((c) => c.status === 'closed').length

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Claims</h1>
        <p className="text-[#506070] text-sm mt-1">All insurance claims processed through VelopX</p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] px-5 py-3 flex items-center gap-3">
          <span className="text-[#506070] text-xs font-semibold uppercase tracking-wider">Total Claims</span>
          <span className="text-[#E8ECF1] font-bold text-xl">{claims.length}</span>
        </div>
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] px-5 py-3 flex items-center gap-3">
          <span className="text-[#506070] text-xs font-semibold uppercase tracking-wider">Total Value</span>
          <span className="text-[#E8ECF1] font-bold text-xl">
            {claims[0]?.currency ?? 'GHS'} {totalValue.toLocaleString()}
          </span>
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

      {/* Claims table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2E48] bg-[#0C1526]">
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Claim Ref</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Parts</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Assessor</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Invoice</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Flag</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-[#506070] text-sm">
                  No claims found
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="border-b border-[#1E2E48]/60 last:border-0 hover:bg-[#0C1526]/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-[#E8ECF1] text-xs">
                    {claim.claimReference}
                  </td>
                  <td className="px-4 py-3 text-[#8A97AA] text-xs max-w-[180px]">
                    <span className="truncate block">
                      {claim.lineItems?.map((i) => i.partName).join(', ') || '—'}
                    </span>
                    <span className="text-[#3D5068] text-[10px]">{claim.lineItems?.length ?? 0} line items</span>
                  </td>
                  <td className="px-4 py-3 text-[#8A97AA] text-xs">
                    {claim.assessor?.name ?? claim.assessor?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#E8ECF1] text-xs font-semibold whitespace-nowrap">
                    {claim.currency} {Number(claim.invoiceAmount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {claim.flag ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${FLAG_BADGE[claim.flag] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                        {claim.flag}
                      </span>
                    ) : <span className="text-[#3D5068] text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[claim.status] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#506070] text-xs whitespace-nowrap">
                    {new Date(claim.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
