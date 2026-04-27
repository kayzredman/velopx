const results = [
  { id: 'p1', name: 'Front Bumper Assembly', oem: 'TO-52119-12850', vehicle: 'Toyota Corolla 2019', condition: 'OEM', dealer: 'Accra Auto Parts Ltd', price: 'GHS 1,240', stock: 3, distance: '34 km', lead: '1 day' },
  { id: 'p2', name: 'Front Bumper Assembly', oem: 'TO-52119-12850', vehicle: 'Toyota Corolla 2019', condition: 'AFTERMKT', dealer: 'Ridge Parts Depot', price: 'GHS 680', stock: 5, distance: '12 km', lead: 'Same day' },
  { id: 'p3', name: 'Brake Disc Set (Front)', oem: 'HO-45251-T2G', vehicle: 'Honda CR-V 2021', condition: 'OEM', dealer: 'Tema Parts Direct', price: 'GHS 860', stock: 2, distance: '34 km', lead: '1–2 days' },
  { id: 'p4', name: 'Alternator 14V 90A', oem: 'NI-23100-JD20A', vehicle: 'Nissan X-Trail 2018', condition: 'USED', dealer: 'Madina Auto Spares', price: 'GHS 320', stock: 1, distance: '22 km', lead: 'Same day' },
  { id: 'p5', name: 'LED Headlight Assembly', oem: 'HY-92101-D9100', vehicle: 'Hyundai Tucson 2020', condition: 'OEM', dealer: 'Accra Auto Parts Ltd', price: 'GHS 540', stock: 2, distance: '34 km', lead: '1 day' },
]

const condBadge: Record<string, string> = {
  OEM: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  USED: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  AFTERMKT: 'bg-white/5 text-[#8A97AA] border border-white/10',
}

export default function GarageSearchPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Find Parts</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Search the VelopX catalogue or send an RFQ to multiple dealers</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5068]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by part name, OEM number, or vehicle..."
            defaultValue="Front Bumper"
            className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 transition-colors placeholder:text-[#3D5068]"
          />
        </div>
        <button type="button" className="px-6 py-3 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors">
          Search
        </button>
        <button type="button" className="px-5 py-3 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:border-white/20 hover:text-white transition-colors">
          Send RFQ
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#8A97AA] text-xs">Filter:</span>
        {['All Conditions', 'OEM Only', 'Used', 'Aftermarket'].map((f, i) => (
          <button
            key={f}
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === 0
                ? 'bg-[#F5A623]/10 text-amber-400 border border-amber-500/30'
                : 'border border-[#1E2E48] text-[#8A97AA] hover:border-white/20 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-[#8A97AA] text-xs">{results.length} results</span>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-3">
        {results.map((p) => (
          <div key={p.id} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] hover:bg-[#0F2240] transition-colors p-5 flex items-center gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white text-sm font-semibold">{p.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${condBadge[p.condition]}`}>
                  {p.condition}
                </span>
              </div>
              <p className="text-[#8A97AA] text-xs font-mono">{p.oem} · {p.vehicle}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[#8A97AA] text-xs">{p.dealer}</p>
              <p className="text-[#8A97AA] text-xs mt-0.5">{p.distance} · {p.stock} in stock · Ships {p.lead}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-amber-400 text-lg font-bold">{p.price}</p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button type="button" className="px-4 py-2 rounded-lg bg-[#F5A623] text-black text-xs font-bold hover:bg-[#d4911f] transition-colors">
                Order Now
              </button>
              <button type="button" className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-xs font-medium hover:border-white/20 hover:text-white transition-colors">
                Add to RFQ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
