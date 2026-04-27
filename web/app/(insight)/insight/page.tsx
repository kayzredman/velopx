import Link from 'next/link'

const assessors = [
  { name: 'Kofi Boateng', claims: 14, flagged: 6, savings: 'GHS 18,400', accuracy: '94%', lastActive: '2 min ago' },
  { name: 'Akosua Mensah', claims: 11, flagged: 3, savings: 'GHS 9,800', accuracy: '91%', lastActive: '1 hr ago' },
  { name: 'Yaw Asante', claims: 9, flagged: 2, savings: 'GHS 6,100', accuracy: '89%', lastActive: 'Yesterday' },
  { name: 'Esi Darko', claims: 8, flagged: 1, savings: 'GHS 3,200', accuracy: '97%', lastActive: 'Yesterday' },
  { name: 'Kweku Frimpong', claims: 6, flagged: 0, savings: 'GHS 0', accuracy: '100%', lastActive: '2 days ago' },
]

const anomalies = [
  { part: 'Front Bumper Assembly', garage: 'Tema Motors', avgDeviation: '+78%', occurrences: 4, flag: 'CRITICAL' as const },
  { part: 'LED Headlight Assembly', garage: 'Dansoman Auto Works', avgDeviation: '+55%', occurrences: 3, flag: 'HIGH' as const },
  { part: 'Windscreen (OEM)', garage: 'Madina Auto Centre', avgDeviation: '+42%', occurrences: 2, flag: 'HIGH' as const },
  { part: 'Alternator 14V 90A', garage: 'Ridge Garage', avgDeviation: '+31%', occurrences: 5, flag: 'MEDIUM' as const },
  { part: 'Bonnet / Hood Panel', garage: 'Kumasi AutoFix', avgDeviation: '+18%', occurrences: 2, flag: 'MEDIUM' as const },
]

const anomalyConfig = {
  CRITICAL: { cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  HIGH: { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  MEDIUM: { cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
}

const monthly = [
  { month: 'Nov', claims: 38, savings: 12 },
  { month: 'Dec', claims: 44, savings: 18 },
  { month: 'Jan', claims: 41, savings: 15 },
  { month: 'Feb', claims: 52, savings: 24 },
  { month: 'Mar', claims: 60, savings: 31 },
  { month: 'Apr', claims: 48, savings: 28 },
]
const maxClaims = Math.max(...monthly.map((m) => m.claims))

export default function InsightPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Insurance Intelligence</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Enterprise Assurance Ltd · April 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:border-white/20 hover:text-white transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Claims Processed', val: '48', sub: 'This month', color: 'text-white' },
          { label: 'Parts Validated', val: '184', sub: 'Across all claims', color: 'text-white' },
          { label: 'Flags Raised', val: '32', sub: '17.4% of parts', color: 'text-red-400' },
          { label: 'Savings Identified', val: 'GHS 37.5k', sub: 'vs submitted invoices', color: 'text-green-400' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
            <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
            <p className="text-[#8A97AA] text-xs mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bar chart */}
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6">
          <h2 className="text-white font-semibold text-sm mb-6">Monthly Claims Volume</h2>
          <div className="flex items-end gap-3 h-36">
            {monthly.map((m) => {
              const h = Math.round((m.claims / maxClaims) * 100)
              const isCurrent = m.month === 'Apr'
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[#8A97AA] text-[10px]">{m.claims}</span>
                  <div
                    className={`w-full rounded-t-md ${isCurrent ? 'bg-[#F5A623]' : 'bg-[#1E2E48]'}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className={`text-[10px] font-medium ${isCurrent ? 'text-amber-400' : 'text-[#8A97AA]'}`}>{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Savings vs Flags breakdown */}
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6">
          <h2 className="text-white font-semibold text-sm mb-6">Claim Outcomes — April</h2>
          <div className="flex flex-col gap-5">
            {[
              { label: 'Approved as-submitted', pct: 52, color: 'bg-green-500' },
              { label: 'Approved with adjustment', pct: 31, color: 'bg-amber-500' },
              { label: 'Flagged — awaiting action', pct: 17, color: 'bg-red-500' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#8A97AA] text-xs">{row.label}</span>
                  <span className="text-white text-xs font-bold">{row.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1E2E48] overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assessor activity table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden mb-6">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Assessor Activity</h2>
          <Link href="/insight/assessors" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</Link>
        </div>
        <div className="grid grid-cols-[1.5fr_80px_80px_1fr_80px_1fr] gap-0">
          {['ASSESSOR', 'CLAIMS', 'FLAGGED', 'SAVINGS', 'ACCURACY', 'LAST ACTIVE'].map((h) => (
            <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}
          {assessors.map((a, i) => {
            const isLast = i === assessors.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={a.name} className="contents group">
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center gap-3`}>
                  <div className="w-7 h-7 rounded-full bg-[#1E2E48] flex items-center justify-center text-[#8A97AA] text-xs font-bold flex-shrink-0">
                    {a.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="text-white text-sm">{a.name}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-medium">{a.claims}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm font-medium ${a.flagged > 3 ? 'text-red-400' : a.flagged > 0 ? 'text-amber-400' : 'text-[#8A97AA]'}`}>
                    {a.flagged}
                  </span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-green-400 text-sm font-medium">{a.savings}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm">{a.accuracy}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{a.lastActive}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top anomalies */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Top Pricing Anomalies</h2>
          <Link href="/insight/anomalies" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</Link>
        </div>
        <div className="grid grid-cols-[2fr_1.5fr_1fr_80px_90px] gap-0">
          {['PART', 'GARAGE', 'AVG DEVIATION', 'OCCURRENCES', 'SEVERITY'].map((h) => (
            <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}
          {anomalies.map((a, i) => {
            const ac = anomalyConfig[a.flag]
            const isLast = i === anomalies.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={a.part + a.garage} className="contents group">
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm">{a.part}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{a.garage}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm font-bold ${a.flag === 'CRITICAL' ? 'text-red-400' : a.flag === 'HIGH' ? 'text-amber-400' : 'text-orange-400'}`}>
                    {a.avgDeviation}
                  </span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-medium">{a.occurrences}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${ac.cls}`}>{a.flag}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
