export default function AnalyticsPage() {
  const monthlyRevenue = [
    { month: 'Nov', val: 18400 },
    { month: 'Dec', val: 22100 },
    { month: 'Jan', val: 19800 },
    { month: 'Feb', val: 26500 },
    { month: 'Mar', val: 31200 },
    { month: 'Apr', val: 34200 },
  ]

  const maxVal = Math.max(...monthlyRevenue.map((m) => m.val))

  const topParts = [
    { name: 'Front Bumper Assembly', sales: 18, revenue: 'GHS 22,320', trend: '+12%' },
    { name: 'Brake Disc Set (Front)', sales: 14, revenue: 'GHS 12,040', trend: '+8%' },
    { name: 'LED Headlight Assembly', sales: 11, revenue: 'GHS 5,940', trend: '+22%' },
    { name: 'Alternator 14V 90A', sales: 9, revenue: 'GHS 2,880', trend: '-3%' },
    { name: 'Windscreen (OEM)', sales: 6, revenue: 'GHS 9,600', trend: '+5%' },
  ]

  const kpis = [
    { label: 'Revenue MTD', val: 'GHS 34.2k', delta: '+10.3%', up: true },
    { label: 'Orders MTD', val: '41', delta: '+18%', up: true },
    { label: 'Avg Order Value', val: 'GHS 834', delta: '+4.1%', up: true },
    { label: 'Quote Win Rate', val: '68%', delta: '-2%', up: false },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Performance overview for Accra Auto Parts Ltd</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
            <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className="text-2xl font-bold text-white">{k.val}</p>
            <span className={`text-xs font-semibold mt-1 inline-block ${k.up ? 'text-green-400' : 'text-red-400'}`}>
              {k.delta} vs last month
            </span>
          </div>
        ))}
      </div>

      {/* Revenue bar chart */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-6">Monthly Revenue (GHS)</h2>
        <div className="flex items-end gap-4 h-40">
          {monthlyRevenue.map((m) => {
            const height = Math.round((m.val / maxVal) * 100)
            const isCurrent = m.month === 'Apr'
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[#8A97AA] text-xs">{(m.val / 1000).toFixed(1)}k</span>
                <div
                  className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-[#F5A623]' : 'bg-[#1E2E48] hover:bg-[#2a3f5c]'}`}
                  style={{ height: `${height}%` }}
                />
                <span className={`text-xs font-medium ${isCurrent ? 'text-amber-400' : 'text-[#8A97AA]'}`}>{m.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top parts table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48]">
          <h2 className="text-white font-semibold text-sm">Top Performing Parts</h2>
        </div>
        <div className="grid grid-cols-[2fr_80px_1fr_80px] gap-0">
          {['PART NAME', 'SALES', 'REVENUE', 'TREND'].map((h) => (
            <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}
          {topParts.map((p, i) => {
            const isLast = i === topParts.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            const trendUp = p.trend.startsWith('+')
            return (
              <div key={p.name} className="contents group">
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm">{p.name}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-medium">{p.sales}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-amber-400 text-sm font-semibold">{p.revenue}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>{p.trend}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
