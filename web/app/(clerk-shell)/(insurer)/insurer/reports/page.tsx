import { apiFetch } from '@/lib/api'

interface Claim {
  id: string
  claimReference: string
  garageName: string | null
  invoiceAmount: string
  benchmarkAmount: string | null
  currency: string
  flag: string
  status: string
  createdAt: string
}

async function getClaims(): Promise<Claim[]> {
  try {
    const res = await apiFetch<{ data: Claim[] }>('/v1/claims?limit=500')
    return res.data
  } catch {
    return []
  }
}

export default async function InsurerReportsPage() {
  const claims = await getClaims()

  const flaggedCount = claims.filter((c) => c.flag === 'flagged').length
  const totalSavings = claims.reduce((s, c) => {
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    return s + Math.max(0, diff)
  }, 0)
  const currency = claims[0]?.currency ?? 'GHS'

  return (
    <div className="p-8 space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Audit Reports</h1>
        <p className="text-[#506070] text-sm mt-1">Compliance data for your organisation</p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Claims',   value: String(claims.length),                                                      color: 'text-[#E8ECF1]' },
          { label: 'Flagged',        value: String(flaggedCount),                                                         color: 'text-red-400' },
          { label: 'Total Savings',  value: `${currency} ${Math.round(totalSavings).toLocaleString()}`,                  color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5">
            <p className="text-[#506070] text-xs font-semibold uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Report list */}
      {claims.length === 0 ? (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-8 text-center text-[#506070] text-sm">
          No claim data available yet.
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] divide-y divide-[#1E2E48]">
          <div className="px-5 py-4 grid grid-cols-5 text-xs font-semibold text-[#506070] uppercase tracking-wider">
            <span>Claim Ref</span>
            <span>Garage</span>
            <span>Invoice</span>
            <span>Flag</span>
            <span>Date</span>
          </div>
          {claims.slice(0, 50).map((c) => (
            <div key={c.id} className="px-5 py-4 grid grid-cols-5 items-center hover:bg-[#0D1E35]/50 transition-colors">
              <span className="text-[#E8ECF1] font-mono text-sm">{c.claimReference}</span>
              <span className="text-[#8A97AA] text-sm truncate">{c.garageName ?? '—'}</span>
              <span className="text-[#E8ECF1] font-semibold text-sm">{c.currency} {Number(c.invoiceAmount).toLocaleString()}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                c.flag === 'flagged' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                c.flag === 'review'  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                                       'bg-green-500/15 text-green-400 border border-green-500/30'
              }`}>{c.flag}</span>
              <span className="text-[#506070] text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
