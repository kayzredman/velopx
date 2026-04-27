import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

const lineItems = [
  {
    id: 'li-1',
    partNo: 'TO-52119-12850',
    description: 'Front Bumper Assembly',
    condition: 'OEM',
    qty: 1,
    invoicePrice: 2400,
    benchLow: 1100,
    benchAvg: 1240,
    benchHigh: 1450,
    deviation: 93.5,
    flag: 'FLAGGED' as const,
  },
  {
    id: 'li-2',
    partNo: 'TO-43512-20030',
    description: 'Headlight Assembly (Left)',
    condition: 'OEM',
    qty: 1,
    invoicePrice: 1800,
    benchLow: 980,
    benchAvg: 1180,
    benchHigh: 1350,
    deviation: 52.5,
    flag: 'FLAGGED' as const,
  },
  {
    id: 'li-3',
    partNo: 'TO-53101-12B90',
    description: 'Bonnet / Hood Panel',
    condition: 'OEM',
    qty: 1,
    invoicePrice: 1640,
    benchLow: 1400,
    benchAvg: 1510,
    benchHigh: 1700,
    deviation: 8.6,
    flag: 'REVIEW' as const,
  },
  {
    id: 'li-4',
    partNo: 'TO-55901-12360',
    description: 'Radiator Support Bracket',
    condition: 'AFTERMKT',
    qty: 1,
    invoicePrice: 1000,
    benchLow: 780,
    benchAvg: 860,
    benchHigh: 980,
    deviation: 16.3,
    flag: 'REVIEW' as const,
  },
]

const flagConfig = {
  FLAGGED: { label: 'FLAGGED', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  REVIEW: { label: 'REVIEW', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  OK: { label: 'OK', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
}

const condBadge: Record<string, string> = {
  OEM: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  USED: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  AFTERMKT: 'bg-white/5 text-[#8A97AA] border border-white/10',
}

function fmt(n: number) {
  return `GHS ${n.toLocaleString()}`
}

export default async function ClaimDetailPage({ params }: Props) {
  const { id } = await params

  const invoiceTotal = lineItems.reduce((a, l) => a + l.invoicePrice * l.qty, 0)
  const benchmarkTotal = lineItems.reduce((a, l) => a + l.benchAvg * l.qty, 0)
  const overcharge = invoiceTotal - benchmarkTotal
  const overchargePct = ((overcharge / benchmarkTotal) * 100).toFixed(1)

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8A97AA] mb-6">
        <Link href="/assess" className="hover:text-white transition-colors">Claims</Link>
        <span>/</span>
        <span className="text-white font-medium font-mono">{id}</span>
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Validation</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Toyota Corolla 2019 — GH-3421-21 · Tema Motors Auto Repair</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button type="button" className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:border-white/20 transition-colors">
            Export PDF
          </button>
          <button type="button" className="px-4 py-2.5 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors">
            Approve Adjusted
          </button>
        </div>
      </div>

      {/* Claim metadata */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Claim ID', val: id },
          { label: 'Insurer', val: 'Enterprise Assurance' },
          { label: 'Submitted', val: 'Apr 25, 2026 · 09:14' },
          { label: 'Assessor', val: 'Kofi Boateng' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] px-5 py-4">
            <p className="text-[#8A97AA] text-[10px] uppercase tracking-widest mb-1">{m.label}</p>
            <p className="text-white text-sm font-medium font-mono">{m.val}</p>
          </div>
        ))}
      </div>

      {/* Line items table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden mb-8">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Parts Line Items</h2>
          <span className="text-[#8A97AA] text-xs">{lineItems.length} line items</span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_70px_70px_100px_100px_100px_100px_100px_90px] gap-0">
          {[
            'PART / OEM NO.',
            'COND.',
            'QTY',
            'INVOICE',
            'BENCH LOW',
            'BENCH AVG',
            'BENCH HIGH',
            'DEVIATION',
            'FLAG',
          ].map((h) => (
            <div key={h} className="px-3 py-3 bg-[#0A1628] text-[#8A97AA] text-[9px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}

          {/* Rows */}
          {lineItems.map((item, i) => {
            const fc = flagConfig[item.flag]
            const isLast = i === lineItems.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            const deviationColor =
              item.deviation > 30
                ? 'text-red-400'
                : item.deviation > 10
                ? 'text-amber-400'
                : 'text-green-400'

            return (
              <div key={item.id} className="contents group">
                {/* Part name + OEM */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className="text-white text-sm font-medium">{item.description}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5 font-mono">{item.partNo}</p>
                </div>
                {/* Condition */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${condBadge[item.condition]}`}>
                    {item.condition}
                  </span>
                </div>
                {/* Qty */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm">{item.qty}</span>
                </div>
                {/* Invoice price */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-semibold">{fmt(item.invoicePrice)}</span>
                </div>
                {/* Bench low */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{fmt(item.benchLow)}</span>
                </div>
                {/* Bench avg */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm font-medium">{fmt(item.benchAvg)}</span>
                </div>
                {/* Bench high */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{fmt(item.benchHigh)}</span>
                </div>
                {/* Deviation */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm font-bold ${deviationColor}`}>+{item.deviation}%</span>
                </div>
                {/* Flag */}
                <div className={`px-3 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${fc.cls}`}>
                    {fc.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 gap-6">
        {/* Totals card */}
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2E48]">
            <h3 className="text-white font-semibold text-sm">Invoice Summary</h3>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8A97AA] text-sm">Invoice Total</span>
              <span className="text-white text-sm font-semibold">{fmt(invoiceTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8A97AA] text-sm">Benchmark Total (avg)</span>
              <span className="text-[#8A97AA] text-sm font-semibold">{fmt(benchmarkTotal)}</span>
            </div>
            <div className="border-t border-[#1E2E48] pt-4 flex items-center justify-between">
              <span className="text-red-400 text-sm font-medium">Overcharge Detected</span>
              <span className="text-red-400 text-sm font-bold">{fmt(overcharge)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8A97AA] text-sm">Overcharge %</span>
              <span className="text-red-400 text-sm font-bold">+{overchargePct}%</span>
            </div>
          </div>
        </div>

        {/* Assessor notes */}
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2E48]">
            <h3 className="text-white font-semibold text-sm">Assessor Notes</h3>
          </div>
          <div className="px-6 py-5">
            <textarea
              className="w-full h-32 bg-[#0A1628] border border-[#1E2E48] rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-[#F5A623]/50 transition-colors placeholder:text-[#3D5068]"
              placeholder="Add notes about this claim — pricing discrepancies, garage behaviour, approval rationale..."
              defaultValue="Front bumper and headlight invoice prices are 52–93% above benchmark. Recommend adjusting to benchmark avg before approval. Garage should resubmit with revised pricing."
            />
            <div className="flex justify-end mt-3">
              <button type="button" className="px-4 py-2 rounded-lg bg-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:bg-[#2a3f5c] hover:text-white transition-colors">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
