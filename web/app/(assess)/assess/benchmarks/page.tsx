export default function AssessBenchmarks() {
  const categories = [
    {
      label: "Body & Exterior",
      parts: [
        { name: "Front Bumper Assembly", oem: "TY-211-BMP-01", avg: 1_580, prev: 1_420, pct: 11.3, makes: "Toyota Corolla / Yaris / Camry" },
        { name: "Rear Bumper Assembly", oem: "TY-215-BMP-02", avg: 1_340, prev: 1_290, pct: 3.9, makes: "Toyota Corolla / Yaris" },
        { name: "Bonnet / Hood", oem: "TY-604-BNT-00", avg: 510, prev: 490, pct: 4.1, makes: "Toyota Corolla" },
        { name: "Front Door Panel (L)", oem: "TY-671-DRL-00", avg: 620, prev: 600, pct: 3.3, makes: "Toyota Corolla" },
        { name: "Headlight Assembly (L)", oem: "TY-811-HDL-L2", avg: 920, prev: 820, pct: 12.2, makes: "Toyota Corolla 2018–2021" },
      ],
    },
    {
      label: "Mechanical",
      parts: [
        { name: "Radiator (1.6L)", oem: "TY-214-RAD-00", avg: 780, prev: 750, pct: 4.0, makes: "Toyota Corolla" },
        { name: "Alternator", oem: "TY-270-ALT-01", avg: 650, prev: 620, pct: 4.8, makes: "Toyota Corolla / Camry" },
        { name: "Starter Motor", oem: "TY-280-STR-00", avg: 420, prev: 400, pct: 5.0, makes: "Toyota Corolla" },
        { name: "Water Pump", oem: "TY-161-WPM-00", avg: 310, prev: 295, pct: 5.1, makes: "Toyota Corolla" },
      ],
    },
    {
      label: "Suspension & Brakes",
      parts: [
        { name: "Front Shock Absorber (L)", oem: "TY-484-SHK-L1", avg: 540, prev: 510, pct: 5.9, makes: "Toyota Corolla" },
        { name: "Brake Disc (Front)", oem: "TY-435-DSC-F0", avg: 280, prev: 265, pct: 5.7, makes: "Toyota Corolla / Camry" },
        { name: "Brake Pad Set (Front)", oem: "TY-435-PAD-F0", avg: 185, prev: 180, pct: 2.8, makes: "Toyota Corolla / Yaris / Camry" },
      ],
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Benchmarks</h1>
          <p className="text-sm text-[#8A97AA] mt-1">
            Market reference prices — updated weekly from verified listings
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#8A97AA]">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          Last updated 2 hours ago
        </div>
      </div>

      {/* Category tables */}
      {categories.map((cat) => (
        <div
          key={cat.label}
          className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-[#1E2E48]">
            <h2 className="text-sm font-semibold text-white">{cat.label}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {["PART / OEM NO.", "COMPATIBLE MAKES", "AVG PRICE (GHS)", "PREV. MONTH", "CHANGE"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {cat.parts.map((p) => {
                const up = p.pct >= 0;
                return (
                  <tr
                    key={p.oem}
                    className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{p.name}</p>
                      <p className="text-xs text-[#8A97AA] font-mono mt-0.5">
                        {p.oem}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs max-w-[200px]">
                      {p.makes}
                    </td>
                    <td className="px-5 py-4 text-white font-mono font-semibold">
                      {p.avg.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] font-mono">
                      {p.prev.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-mono font-semibold ${up ? "text-red-400" : "text-green-400"}`}
                      >
                        {up ? "▲" : "▼"} {Math.abs(p.pct).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
