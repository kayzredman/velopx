export default function AssessPartSearch() {
  const results = [
    {
      part: "Front Bumper Assembly",
      oem: "TY-211-BMP-01",
      make: "Toyota Corolla 2019",
      condition: "OEM",
      condColor: "blue",
      dealerLow: 1_200,
      dealerAvg: 1_580,
      dealerHigh: 2_100,
      sources: 14,
    },
    {
      part: "Headlight Assembly (L)",
      oem: "TY-811-HDL-L2",
      make: "Toyota Corolla 2019",
      condition: "OEM",
      condColor: "blue",
      dealerLow: 780,
      dealerAvg: 920,
      dealerHigh: 1_150,
      sources: 9,
    },
    {
      part: "Bonnet / Hood",
      oem: "TY-604-BNT-00",
      make: "Toyota Corolla 2019",
      condition: "Used",
      condColor: "amber",
      dealerLow: 400,
      dealerAvg: 510,
      dealerHigh: 680,
      sources: 6,
    },
    {
      part: "Radiator Bracket",
      oem: "TY-214-RAD-BR",
      make: "Toyota Corolla 2019",
      condition: "Aftermarket",
      condColor: "purple",
      dealerLow: 95,
      dealerAvg: 120,
      dealerHigh: 160,
      sources: 11,
    },
    {
      part: "Side Mirror (R)",
      oem: "TY-876-MIR-R1",
      make: "Toyota Corolla 2019",
      condition: "OEM",
      condColor: "blue",
      dealerLow: 310,
      dealerAvg: 390,
      dealerHigh: 520,
      sources: 7,
    },
  ];

  const condBadge: Record<string, string> = {
    OEM: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    Used: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    Aftermarket: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Part Price Search</h1>
        <p className="text-sm text-[#8A97AA] mt-1">
          Benchmark any part against live dealer market data
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A97AA]"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            defaultValue="Toyota Corolla 2019 front bumper"
            className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
          />
        </div>
        <select className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]">
          <option>All Conditions</option>
          <option>OEM Only</option>
          <option>Used Only</option>
          <option>Aftermarket</option>
        </select>
        <button
          type="button"
          className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {/* Results table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2E48] flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {results.length} results
          </span>
          <span className="text-xs text-[#8A97AA]">
            Prices in GHS · Updated daily
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {[
                  "PART / OEM NO.",
                  "VEHICLE",
                  "COND.",
                  "SOURCES",
                  "DEALER LOW",
                  "DEALER AVG",
                  "DEALER HIGH",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.oem}
                  className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors group"
                >
                  <td className="px-5 py-4">
                    <p className="text-white font-medium">{r.part}</p>
                    <p className="text-xs text-[#8A97AA] font-mono mt-0.5">
                      {r.oem}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[#8A97AA]">{r.make}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${condBadge[r.condition]}`}
                    >
                      {r.condition}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#8A97AA]">{r.sources}</td>
                  <td className="px-5 py-4 text-green-400 font-mono">
                    {r.dealerLow.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-white font-mono font-semibold">
                    {r.dealerAvg.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-red-400 font-mono">
                    {r.dealerHigh.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      className="text-xs text-[#F5A623] hover:text-[#e09520] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Use as benchmark →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <svg
          className="text-blue-400 mt-0.5 shrink-0"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <p className="text-xs text-blue-300 leading-relaxed">
          Benchmark prices are aggregated from verified dealer listings across
          the VelopX marketplace. Low / Avg / High represent the 10th, 50th and
          90th percentile of active listings for this part and vehicle
          combination.
        </p>
      </div>
    </div>
  );
}
