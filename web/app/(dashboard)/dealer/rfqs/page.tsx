export default function RFQsPage() {
  const rfqs = [
    {
      id: 'RFQ-0091',
      part: 'Front Bumper Assembly',
      vehicle: 'Toyota Corolla 2019',
      buyer: 'Tema Motors',
      location: 'Tema, Ghana',
      received: '2 min ago',
      deadline: '14:30 today',
      qty: 1,
      status: 'NEW' as const,
    },
    {
      id: 'RFQ-0090',
      part: 'Brake Disc Set (Front)',
      vehicle: 'Honda CR-V 2021',
      buyer: 'Kumasi AutoFix',
      location: 'Kumasi, Ghana',
      received: '1 hr ago',
      deadline: '18:00 today',
      qty: 2,
      status: 'NEW' as const,
    },
    {
      id: 'RFQ-0089',
      part: 'LED Headlight Assembly',
      vehicle: 'Hyundai Tucson 2020',
      buyer: 'Accra Service Hub',
      location: 'Accra, Ghana',
      received: '3 hrs ago',
      deadline: 'Expired',
      qty: 1,
      status: 'EXPIRED' as const,
    },
    {
      id: 'RFQ-0088',
      part: 'Alternator 14V 90A',
      vehicle: 'Nissan X-Trail 2018',
      buyer: 'Ridge Garage',
      location: 'Accra, Ghana',
      received: 'Yesterday',
      deadline: 'Responded',
      qty: 1,
      status: 'RESPONDED' as const,
    },
    {
      id: 'RFQ-0087',
      part: 'Windscreen (OEM)',
      vehicle: 'Toyota Land Cruiser 200',
      buyer: 'Continental Motors',
      location: 'Accra, Ghana',
      received: 'Yesterday',
      deadline: 'Responded',
      qty: 1,
      status: 'RESPONDED' as const,
    },
  ]

  const statusConfig = {
    NEW: { label: 'NEW', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    RESPONDED: { label: 'RESPONDED', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
    EXPIRED: { label: 'EXPIRED', cls: 'bg-white/5 text-[#8A97AA] border border-white/10' },
  }

  const newCount = rfqs.filter((r) => r.status === 'NEW').length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Requests for Quote</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Respond within the deadline to stay competitive</p>
        </div>
        {newCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-sm font-semibold">
            {newCount} new request{newCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* New RFQ alert banner */}
      {rfqs.filter((r) => r.status === 'NEW').map((rfq) => (
        <div
          key={rfq.id}
          className="mb-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-5 flex items-center gap-5"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              ⚡ {rfq.id} — {rfq.part}
            </p>
            <p className="text-[#8A97AA] text-xs mt-0.5">
              {rfq.buyer} · {rfq.vehicle} · Qty {rfq.qty} · Respond by <span className="text-amber-400 font-medium">{rfq.deadline}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" className="px-4 py-2 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors">
              Send Quote
            </button>
            <button type="button" className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:border-white/20 transition-colors">
              Decline
            </button>
          </div>
        </div>
      ))}

      {/* Table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="grid grid-cols-[1.8fr_1.6fr_1fr_1fr_80px] gap-0">
          {/* Header */}
          <div className="contents">
            {['PART / VEHICLE', 'BUYER', 'RECEIVED', 'DEADLINE', 'STATUS'].map((h) => (
              <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rfqs.map((rfq, i) => {
            const sc = statusConfig[rfq.status]
            const isLast = i === rfqs.length - 1
            const rowBorder = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={rfq.id} className="contents group">
                <div className={`px-5 py-4 ${rowBorder} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className="text-white text-sm font-medium">{rfq.part}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5">{rfq.vehicle} · Qty {rfq.qty}</p>
                </div>
                <div className={`px-5 py-4 ${rowBorder} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className="text-white text-sm">{rfq.buyer}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5">{rfq.location}</p>
                </div>
                <div className={`px-5 py-4 ${rowBorder} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{rfq.received}</span>
                </div>
                <div className={`px-5 py-4 ${rowBorder} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm font-medium ${rfq.status === 'NEW' ? 'text-amber-400' : 'text-[#8A97AA]'}`}>
                    {rfq.deadline}
                  </span>
                </div>
                <div className={`px-5 py-4 ${rowBorder} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${sc.cls}`}>
                    {sc.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-[#8A97AA] text-xs mt-4 text-right">
        Showing {rfqs.length} requests · Last updated just now
      </p>
    </div>
  )
}
