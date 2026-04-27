export default function GarageDashboardPage() {
  const inboundOrders = [
    { id: 'ORD-102', part: 'Brake Disc Set (Front)', dealer: 'Accra Auto Parts Ltd', status: 'IN-TRANSIT' as const, eta: '14:30 today', driver: 'Kofi Asante' },
    { id: 'ORD-101', part: 'Alternator 14V 90A', dealer: 'Ridge Parts Depot', status: 'DISPATCHED' as const, eta: '16:00 today', driver: 'Yaw Darko' },
    { id: 'ORD-100', part: 'Windscreen (OEM)', dealer: 'Kumasi Parts Hub', status: 'DELIVERED' as const, eta: 'Delivered 09:45', driver: 'Ama Boateng' },
  ]

  const openRfqs = [
    { id: 'RFQ-0055', part: 'Front Bumper Assembly', vehicle: 'Toyota Corolla 2019', replies: 3, best: 'GHS 1,240', deadline: '15:00 today' },
    { id: 'RFQ-0054', part: 'LED Headlight Assembly', vehicle: 'Hyundai Tucson 2020', replies: 1, best: 'GHS 540', deadline: '18:00 today' },
  ]

  const statusConfig = {
    'IN-TRANSIT': { label: 'IN TRANSIT', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    DISPATCHED: { label: 'DISPATCHED', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    DELIVERED: { label: 'DELIVERED', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workshop Dashboard</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Kumasi AutoFix · Adum, Kumasi</p>
        </div>
        <a
          href="/garage/search"
          className="px-4 py-2.5 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find Parts
        </a>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open RFQs', val: '2', note: 'Awaiting quotes', highlight: true },
          { label: 'Active Orders', val: '3', note: 'Parts inbound', highlight: false },
          { label: 'Parts Received', val: '1', note: 'Today', highlight: false },
          { label: 'Open Job Cards', val: '5', note: 'In progress', highlight: false },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border p-5 ${k.highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#1E2E48] bg-[#0D1E35]'}`}
          >
            <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.highlight ? 'text-amber-400' : 'text-white'}`}>{k.val}</p>
            <p className="text-[#8A97AA] text-xs mt-1">{k.note}</p>
          </div>
        ))}
      </div>

      {/* Open RFQs */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden mb-6">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Open RFQs</h2>
          <a href="/garage/rfqs" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</a>
        </div>
        <div className="divide-y divide-[#1E2E48]">
          {openRfqs.map((rfq) => (
            <div key={rfq.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#0F2240] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{rfq.part}</span>
                  <span className="text-[#8A97AA] text-xs font-mono">{rfq.id}</span>
                </div>
                <p className="text-[#8A97AA] text-xs mt-0.5">{rfq.vehicle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-amber-400 text-sm font-semibold">{rfq.replies} replies · best {rfq.best}</p>
                <p className="text-[#8A97AA] text-xs mt-0.5">Respond by {rfq.deadline}</p>
              </div>
              <button type="button" className="px-4 py-2 rounded-lg bg-[#F5A623] text-black text-xs font-bold hover:bg-[#d4911f] transition-colors flex-shrink-0">
                View Quotes
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inbound deliveries */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Inbound Deliveries</h2>
          <a href="/garage/deliveries" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</a>
        </div>
        <div className="grid grid-cols-[100px_1.8fr_1.2fr_1fr_1fr_90px] gap-0">
          {['ORDER', 'PART', 'DEALER', 'DRIVER', 'ETA', 'STATUS'].map((h) => (
            <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}
          {inboundOrders.map((o, i) => {
            const sc = statusConfig[o.status]
            const isLast = i === inboundOrders.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={o.id} className="contents group">
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-mono">{o.id}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm">{o.part}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{o.dealer}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{o.driver}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm ${o.status === 'DELIVERED' ? 'text-green-400' : 'text-white'}`}>{o.eta}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${sc.cls}`}>{sc.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
