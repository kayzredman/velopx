export default function DispatchPage() {
  const dispatches = [
    {
      orderId: 'ORD-001',
      part: 'Front Bumper Assembly',
      vehicle: 'Toyota Corolla 2019',
      buyer: 'Tema Motors',
      buyerAddr: 'Tema, Greater Accra',
      driver: 'Kofi Asante',
      driverPhone: '+233 24 111 2233',
      status: 'IN-TRANSIT' as const,
      eta: '13:45 today',
      distance: '34 km',
      pickedUp: '11:20',
    },
    {
      orderId: 'ORD-002',
      part: 'Brake Disc Set (Front)',
      vehicle: 'Honda CR-V 2021',
      buyer: 'Kumasi AutoFix',
      buyerAddr: 'Adum, Kumasi',
      driver: 'Yaw Darko',
      driverPhone: '+233 20 444 5566',
      status: 'DISPATCHED' as const,
      eta: '15:00 today',
      distance: '260 km',
      pickedUp: '09:00',
    },
    {
      orderId: 'ORD-003',
      part: 'LED Headlight Assembly',
      vehicle: 'Hyundai Tucson 2020',
      buyer: 'Accra Service Hub',
      buyerAddr: 'East Legon, Accra',
      driver: 'Ama Boateng',
      driverPhone: '+233 26 777 8899',
      status: 'DELIVERED' as const,
      eta: 'Delivered 10:15',
      distance: '12 km',
      pickedUp: '09:30',
    },
    {
      orderId: 'ORD-004',
      part: 'Alternator 14V 90A',
      vehicle: 'Nissan X-Trail 2018',
      buyer: 'Ridge Garage',
      buyerAddr: 'Ridge, Accra',
      driver: 'Unassigned',
      driverPhone: '—',
      status: 'PENDING' as const,
      eta: 'Awaiting pickup',
      distance: '8 km',
      pickedUp: '—',
    },
  ]

  const statusConfig = {
    'IN-TRANSIT': { label: 'IN TRANSIT', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    DISPATCHED: { label: 'DISPATCHED', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    DELIVERED: { label: 'DELIVERED', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
    PENDING: { label: 'PENDING', cls: 'bg-white/5 text-[#8A97AA] border border-white/10' },
  }

  const stats = [
    { label: 'Active Runs', val: '2', note: 'In transit now' },
    { label: 'Delivered Today', val: '1', note: 'As of 10:15' },
    { label: 'Pending Pickup', val: '1', note: 'Awaiting driver' },
    { label: 'Avg. Delivery Time', val: '2.4 hrs', note: 'Last 30 days' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dispatch</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Track all active and completed deliveries</p>
        </div>
        <button type="button" className="px-4 py-2.5 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Dispatch
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
            <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.val}</p>
            <p className="text-[#8A97AA] text-xs mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Dispatch table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">All Dispatches</h2>
          <span className="text-[#8A97AA] text-xs">{dispatches.length} orders</span>
        </div>

        <div className="grid grid-cols-[1fr_1.2fr_1.1fr_1fr_1fr_90px] gap-0">
          {/* Column headers */}
          <div className="contents">
            {['ORDER', 'PART / VEHICLE', 'BUYER', 'DRIVER', 'ETA', 'STATUS'].map((h) => (
              <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
                {h}
              </div>
            ))}
          </div>

          {dispatches.map((d, i) => {
            const sc = statusConfig[d.status]
            const isLast = i === dispatches.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={d.orderId} className="contents group">
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className="text-white text-sm font-medium font-mono">{d.orderId}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5">{d.distance}</p>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className="text-white text-sm">{d.part}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5">{d.vehicle}</p>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className="text-white text-sm">{d.buyer}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5">{d.buyerAddr}</p>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                  <p className={`text-sm ${d.driver === 'Unassigned' ? 'text-[#8A97AA] italic' : 'text-white'}`}>{d.driver}</p>
                  <p className="text-[#8A97AA] text-xs mt-0.5">{d.driverPhone}</p>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm ${d.status === 'DELIVERED' ? 'text-green-400' : d.status === 'PENDING' ? 'text-[#8A97AA]' : 'text-white'}`}>
                    {d.eta}
                  </span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${sc.cls}`}>
                    {sc.label}
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
