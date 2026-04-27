export default function GarageRFQs() {
  const rfqs = [
    {
      id: "RFQ-0091",
      part: "Front Bumper Assembly",
      oem: "TY-211-BMP-01",
      vehicle: "Toyota Corolla 2019",
      sentAt: "Apr 26, 2026",
      deadline: "Apr 28, 2026",
      quotes: 3,
      bestPrice: 1_480,
      status: "QUOTES IN",
    },
    {
      id: "RFQ-0089",
      part: "Headlight Assembly (L)",
      oem: "TY-811-HDL-L2",
      vehicle: "Toyota Corolla 2019",
      sentAt: "Apr 25, 2026",
      deadline: "Apr 27, 2026",
      quotes: 2,
      bestPrice: 870,
      status: "QUOTES IN",
    },
    {
      id: "RFQ-0084",
      part: "Alternator",
      oem: "TY-270-ALT-01",
      vehicle: "Toyota Camry 2020",
      sentAt: "Apr 24, 2026",
      deadline: "Apr 26, 2026",
      quotes: 0,
      bestPrice: null,
      status: "AWAITING",
    },
    {
      id: "RFQ-0080",
      part: "Front Shock Absorber Pair",
      oem: "TY-484-SHK-F2",
      vehicle: "Toyota Hilux 2022",
      sentAt: "Apr 22, 2026",
      deadline: "Apr 24, 2026",
      quotes: 4,
      bestPrice: 980,
      status: "ORDERED",
    },
    {
      id: "RFQ-0076",
      part: "Radiator (1.6L)",
      oem: "TY-214-RAD-00",
      vehicle: "Toyota Corolla 2019",
      sentAt: "Apr 20, 2026",
      deadline: "Apr 22, 2026",
      quotes: 2,
      bestPrice: 740,
      status: "EXPIRED",
    },
  ];

  const statusBadge: Record<string, string> = {
    "QUOTES IN": "bg-green-500/15 text-green-400 border border-green-500/30",
    AWAITING: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    ORDERED: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    EXPIRED: "bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]",
  };

  const quotesIn = rfqs.filter((r) => r.status === "QUOTES IN").length;
  const awaiting = rfqs.filter((r) => r.status === "AWAITING").length;
  const totalOrdered = rfqs.filter((r) => r.status === "ORDERED").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">My RFQs</h1>
          <p className="text-sm text-[#8A97AA] mt-1">
            Requests for quotation sent to dealers
          </p>
        </div>
        <button
          type="button"
          className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New RFQ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Quotes Received", value: quotesIn.toString(), highlight: "green" },
          { label: "Awaiting Response", value: awaiting.toString(), highlight: "amber" },
          { label: "Ordered", value: totalOrdered.toString(), highlight: "blue" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === "green" ? "text-green-400" : s.highlight === "amber" ? "text-amber-400" : "text-blue-400"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quotes In alert */}
      {quotesIn > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <svg className="text-green-400 shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-sm text-green-300">
            You have <span className="font-semibold">{quotesIn} RFQs with quotes ready</span> — review and confirm your orders.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2E48]">
              {["RFQ", "PART / OEM NO.", "VEHICLE", "SENT", "DEADLINE", "QUOTES", "BEST PRICE", "STATUS", ""].map(
                (h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rfqs.map((r) => (
              <tr key={r.id} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors group">
                <td className="px-5 py-4 text-[#F5A623] font-mono text-xs font-semibold">{r.id}</td>
                <td className="px-5 py-4">
                  <p className="text-white font-medium">{r.part}</p>
                  <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{r.oem}</p>
                </td>
                <td className="px-5 py-4 text-[#8A97AA] text-xs">{r.vehicle}</td>
                <td className="px-5 py-4 text-[#8A97AA] text-xs">{r.sentAt}</td>
                <td className="px-5 py-4 text-[#8A97AA] text-xs">{r.deadline}</td>
                <td className="px-5 py-4 text-white font-semibold">{r.quotes}</td>
                <td className="px-5 py-4">
                  {r.bestPrice ? (
                    <span className="text-green-400 font-mono font-semibold">
                      GHS {r.bestPrice.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[#8A97AA]">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {r.status === "QUOTES IN" && (
                    <button type="button" className="text-xs text-[#F5A623] hover:text-[#e09520] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View Quotes →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
