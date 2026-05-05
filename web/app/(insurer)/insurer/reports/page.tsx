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
    {
      title: 'Claims Audit Export',
      description: 'Full audit trail of all claims, assessments, and part valuations for the selected period.',
      format: 'CSV / PDF',
      available: false,
    },
    {
      title: 'Delivery Performance Report',
      description: 'Completion rates, average delivery times, driver performance, and disputes by month.',
      format: 'CSV / PDF',
      available: false,
    },
    {
      title: 'Assessor Activity Report',
      description: 'Quote response rates, win rates, and benchmark compliance per assessor.',
      format: 'CSV',
      available: false,
    },
    {
      title: 'Anomaly Detection Summary',
      description: 'Flagged pricing anomalies and overcharge detections across the reporting period.',
      format: 'PDF',
      available: false,
    },
  ]

  return (
    <div className="p-8 space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Audit Reports</h1>
        <p className="text-[#506070] text-sm mt-1">Exportable compliance and audit reports for your organisation</p>
      </div>

      {/* Notice */}
      <div className="rounded-xl border border-[#F5A623]/25 bg-gradient-to-r from-[#F5A623]/10 to-[#F5A623]/[0.03] p-5">
        <p className="text-[#F5A623] text-xs font-semibold uppercase tracking-wider mb-1">⚡ Coming Soon</p>
        <p className="text-[#8A97AA] text-sm">
          Report generation and export are being built. All audit data is being collected now and will be available for export when this feature launches.
        </p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((r) => (
          <div key={r.title} className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[#E8ECF1] font-semibold text-sm">{r.title}</h3>
                <span className="text-[10px] font-semibold bg-[#1E2E48] text-[#506070] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {r.format}
                </span>
              </div>
              <p className="text-[#506070] text-xs leading-relaxed">{r.description}</p>
            </div>
            <button
              disabled
              className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1E2E48] text-[#3D5068] cursor-not-allowed"
            >
              Export
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
