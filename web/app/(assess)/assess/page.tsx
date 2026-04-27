import Link from 'next/link'

const claims = [
  {
    id: 'CLM-2841',
    insurer: 'Enterprise Assurance',
    garage: 'Tema Motors Auto Repair',
    vehicle: 'Toyota Corolla 2019 — GH-3421-21',
    parts: 4,
    invoiceTotal: 'GHS 6,840',
    benchmarkTotal: 'GHS 5,210',
    overcharge: 'GHS 1,630',
    overchargePct: '31.3%',
    flag: 'FLAGGED' as const,
    submitted: 'Apr 25, 09:14',
  },
  {
    id: 'CLM-2840',
    insurer: 'Enterprise Assurance',
    garage: 'Kumasi AutoFix',
    vehicle: 'Honda CR-V 2021 — AS-1122-20',
    parts: 2,
    invoiceTotal: 'GHS 3,200',
    benchmarkTotal: 'GHS 3,050',
    overcharge: 'GHS 150',
    overchargePct: '4.9%',
    flag: 'REVIEW' as const,
    submitted: 'Apr 25, 08:50',
  },
  {
    id: 'CLM-2839',
    insurer: 'Star Insurance',
    garage: 'Accra Service Hub',
    vehicle: 'Hyundai Tucson 2020 — GR-7744-19',
    parts: 3,
    invoiceTotal: 'GHS 4,120',
    benchmarkTotal: 'GHS 4,090',
    overcharge: 'GHS 30',
    overchargePct: '0.7%',
    flag: 'OK' as const,
    submitted: 'Apr 24, 16:30',
  },
  {
    id: 'CLM-2838',
    insurer: 'SIC Insurance',
    garage: 'Ridge Garage',
    vehicle: 'Nissan X-Trail 2018 — GA-5566-17',
    parts: 5,
    invoiceTotal: 'GHS 9,450',
    benchmarkTotal: 'GHS 6,800',
    overcharge: 'GHS 2,650',
    overchargePct: '38.9%',
    flag: 'FLAGGED' as const,
    submitted: 'Apr 24, 14:05',
  },
  {
    id: 'CLM-2837',
    insurer: 'Hollard Insurance',
    garage: 'Continental Motors Repair',
    vehicle: 'Toyota Land Cruiser 200 — GW-9900-18',
    parts: 2,
    invoiceTotal: 'GHS 11,200',
    benchmarkTotal: 'GHS 10,800',
    overcharge: 'GHS 400',
    overchargePct: '3.7%',
    flag: 'OK' as const,
    submitted: 'Apr 24, 11:00',
  },
  {
    id: 'CLM-2836',
    insurer: 'Enterprise Assurance',
    garage: 'Dansoman Auto Works',
    vehicle: 'Ford Ranger 2022 — GH-2211-22',
    parts: 6,
    invoiceTotal: 'GHS 14,300',
    benchmarkTotal: 'GHS 10,100',
    overcharge: 'GHS 4,200',
    overchargePct: '41.6%',
    flag: 'FLAGGED' as const,
    submitted: 'Apr 23, 15:45',
  },
  {
    id: 'CLM-2835',
    insurer: 'Star Insurance',
    garage: 'Madina Auto Centre',
    vehicle: 'Kia Sportage 2021 — GE-3344-21',
    parts: 3,
    invoiceTotal: 'GHS 5,600',
    benchmarkTotal: 'GHS 5,500',
    overcharge: 'GHS 100',
    overchargePct: '1.8%',
    flag: 'OK' as const,
    submitted: 'Apr 23, 10:20',
  },
]

const flagConfig = {
  FLAGGED: { label: 'FLAGGED', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  REVIEW: { label: 'REVIEW', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  OK: { label: 'OK', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
}

export default function AssessPage() {
  const flagged = claims.filter((c) => c.flag === 'FLAGGED').length
  const review = claims.filter((c) => c.flag === 'REVIEW').length
  const totalOvercharge = 'GHS 9,160'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Claims</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Review and validate parts invoices against market benchmarks</p>
        </div>
        <button type="button" className="px-4 py-2.5 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Claim
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Total Claims</p>
          <p className="text-2xl font-bold text-white">{claims.length}</p>
          <p className="text-[#8A97AA] text-xs mt-1">Last 7 days</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Flagged</p>
          <p className="text-2xl font-bold text-red-400">{flagged}</p>
          <p className="text-[#8A97AA] text-xs mt-1">Overcharge detected</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Under Review</p>
          <p className="text-2xl font-bold text-amber-400">{review}</p>
          <p className="text-[#8A97AA] text-xs mt-1">Needs attention</p>
        </div>
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Total Overcharge</p>
          <p className="text-2xl font-bold text-white">{totalOvercharge}</p>
          <p className="text-[#8A97AA] text-xs mt-1">Across flagged claims</p>
        </div>
      </div>

      {/* Claims table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="grid grid-cols-[100px_1.6fr_1fr_1fr_1fr_1fr_90px] gap-0">
          {['CLAIM', 'GARAGE / VEHICLE', 'INSURER', 'INVOICE', 'BENCHMARK', 'OVERCHARGE', 'FLAG'].map((h) => (
            <div key={h} className="px-4 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}

          {claims.map((c, i) => {
            const fc = flagConfig[c.flag]
            const isLast = i === claims.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={c.id} className="contents group">
                <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <Link href={`/assess/claims/${c.id}`} className="text-amber-400 text-sm font-medium font-mono hover:underline underline-offset-2">
                    {c.id}
                  </Link>
                </div>
                <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className="text-white text-sm font-medium">{c.garage}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5">{c.vehicle} · {c.parts} parts</p>
                </div>
                <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{c.insurer}</span>
                </div>
                <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-semibold">{c.invoiceTotal}</span>
                </div>
                <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{c.benchmarkTotal}</span>
                </div>
                <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <div>
                    <p className={`text-sm font-semibold ${c.flag === 'FLAGGED' ? 'text-red-400' : c.flag === 'REVIEW' ? 'text-amber-400' : 'text-green-400'}`}>
                      {c.overcharge}
                    </p>
                    <p className="text-[#8A97AA] text-xs">{c.overchargePct}</p>
                  </div>
                </div>
                <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${fc.cls}`}>
                    {fc.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
