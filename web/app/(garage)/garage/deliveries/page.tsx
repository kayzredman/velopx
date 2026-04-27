export default function GarageDeliveries() {
  const deliveries = [
    {
      id: "DEL-8821",
      order: "ORD-5514",
      part: "Front Bumper Assembly",
      dealer: "Accra Auto Parts Ltd",
      driver: "Kofi Adu",
      phone: "+233 24 111 2345",
      dispatched: "Apr 26, 2026 09:14",
      eta: "Apr 28, 2026",
      status: "IN TRANSIT",
      distance: "42 km away",
    },
    {
      id: "DEL-8818",
      order: "ORD-5510",
      part: "Headlight Assembly (L)",
      dealer: "Prime Parts Ghana",
      driver: "Ama Owusu",
      phone: "+233 20 555 6789",
      dispatched: "Apr 25, 2026 14:30",
      eta: "Apr 27, 2026",
      status: "IN TRANSIT",
      distance: "18 km away",
    },
    {
      id: "DEL-8811",
      order: "ORD-5498",
      part: "Front Shock Absorber Pair",
      dealer: "Tema Spares Hub",
      driver: "Yaw Nkrumah",
      phone: "+233 55 777 8901",
      dispatched: "Apr 22, 2026 11:00",
      eta: "Apr 26, 2026",
      status: "PENDING PICKUP",
      distance: "At dealer — awaiting dispatch",
    },
    {
      id: "DEL-8800",
      order: "ORD-5502",
      part: "Brake Pad Set (Front)",
      dealer: "Accra Auto Parts Ltd",
      driver: "Kofi Adu",
      phone: "+233 24 111 2345",
      dispatched: "Apr 24, 2026 08:00",
      eta: "Apr 25, 2026",
      status: "DELIVERED",
      distance: "—",
    },
  ];

  const statusBadge: Record<string, string> = {
    "IN TRANSIT": "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    DELIVERED: "bg-green-500/15 text-green-400 border border-green-500/30",
    "PENDING PICKUP": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  };

  const inTransit = deliveries.filter((d) => d.status === "IN TRANSIT").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Deliveries</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Inbound parts deliveries to your workshop</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "En Route", value: inTransit.toString(), highlight: "blue" },
          { label: "Awaiting Dispatch", value: deliveries.filter((d) => d.status === "PENDING PICKUP").length.toString(), highlight: "amber" },
          { label: "Delivered Today", value: deliveries.filter((d) => d.status === "DELIVERED").length.toString(), highlight: "green" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === "blue" ? "text-blue-400" : s.highlight === "amber" ? "text-amber-400" : "text-green-400"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Delivery cards */}
      <div className="space-y-3">
        {deliveries.map((d) => (
          <div
            key={d.id}
            className={`bg-[#0D1E35] border rounded-xl p-5 transition-colors ${
              d.status === "DELIVERED" ? "border-[#1E2E48] opacity-70" : "border-[#1E2E48] hover:border-[#2a3e5c]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: part info */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[#F5A623] font-mono text-xs font-semibold">{d.id}</span>
                  <span className="text-[#8A97AA] text-xs">·</span>
                  <span className="text-[#8A97AA] text-xs">{d.order}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[d.status]}`}>
                    {d.status}
                  </span>
                </div>
                <p className="text-white font-medium mt-2">{d.part}</p>
                <p className="text-xs text-[#8A97AA] mt-0.5">From {d.dealer}</p>
              </div>

              {/* Right: driver + ETA */}
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-medium">{d.driver}</p>
                <p className="text-xs text-[#8A97AA]">{d.phone}</p>
                <p className="text-xs text-[#8A97AA] mt-2">ETA: <span className="text-white">{d.eta}</span></p>
              </div>
            </div>

            {/* Location row */}
            {d.status !== "DELIVERED" && (
              <div className="mt-4 pt-4 border-t border-[#1E2E48] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#8A97AA]">
                  <svg className="text-blue-400" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
                  </svg>
                  {d.distance}
                </div>
                <p className="text-xs text-[#8A97AA]">Dispatched: {d.dispatched}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
