export default function InsightAnomalies() {
  const anomalies = [
    {
      part: "Front Bumper Assembly",
      oem: "TY-211-BMP-01",
      garage: "Kumasi AutoFix",
      occurrences: 6,
      avgDeviation: 72.4,
      benchmarkAvg: 1_580,
      invoiceAvg: 2_724,
      lastSeen: "Apr 26, 2026",
      severity: "CRITICAL",
    },
    {
      part: "Headlight Assembly (L)",
      oem: "TY-811-HDL-L2",
      garage: "Kumasi AutoFix",
      occurrences: 4,
      avgDeviation: 52.5,
      benchmarkAvg: 920,
      invoiceAvg: 1_403,
      lastSeen: "Apr 26, 2026",
      severity: "CRITICAL",
    },
    {
      part: "Alternator",
      oem: "TY-270-ALT-01",
      garage: "Accra Panel Works",
      occurrences: 3,
      avgDeviation: 38.1,
      benchmarkAvg: 650,
      invoiceAvg: 898,
      lastSeen: "Apr 22, 2026",
      severity: "HIGH",
    },
    {
      part: "Front Shock Absorber (L)",
      oem: "TY-484-SHK-L1",
      garage: "Tema Motors Ltd",
      occurrences: 5,
      avgDeviation: 31.5,
      benchmarkAvg: 540,
      invoiceAvg: 710,
      lastSeen: "Apr 20, 2026",
      severity: "HIGH",
    },
    {
      part: "Radiator (1.6L)",
      oem: "TY-214-RAD-00",
      garage: "Speed Auto Repairs",
      occurrences: 2,
      avgDeviation: 24.3,
      benchmarkAvg: 780,
      invoiceAvg: 969,
      lastSeen: "Apr 18, 2026",
      severity: "HIGH",
    },
    {
      part: "Brake Disc (Front)",
      oem: "TY-435-DSC-F0",
      garage: "Pokuase AutoFix",
      occurrences: 4,
      avgDeviation: 18.7,
      benchmarkAvg: 280,
      invoiceAvg: 332,
      lastSeen: "Apr 15, 2026",
      severity: "MEDIUM",
    },
    {
      part: "Side Mirror (R)",
      oem: "TY-876-MIR-R1",
      garage: "Accra Panel Works",
      occurrences: 3,
      avgDeviation: 14.2,
      benchmarkAvg: 390,
      invoiceAvg: 445,
      lastSeen: "Apr 12, 2026",
      severity: "MEDIUM",
    },
    {
      part: "Water Pump",
      oem: "TY-161-WPM-00",
      garage: "Tema Motors Ltd",
      occurrences: 2,
      avgDeviation: 11.6,
      benchmarkAvg: 310,
      invoiceAvg: 346,
      lastSeen: "Apr 10, 2026",
      severity: "MEDIUM",
    },
  ];

  const severityBadge: Record<string, string> = {
    CRITICAL: "bg-red-500/15 text-red-400 border border-red-500/30",
    HIGH: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  };

  const critical = anomalies.filter((a) => a.severity === "CRITICAL").length;
  const high = anomalies.filter((a) => a.severity === "HIGH").length;
  const totalOcc = anomalies.reduce((s, a) => s + a.occurrences, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Pricing Anomalies</h1>
        <p className="text-sm text-[#8A97AA] mt-1">
          Patterns of overcharging detected across all claims
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Anomaly Patterns", value: anomalies.length.toString() },
          { label: "Critical", value: critical.toString(), highlight: "red" },
          { label: "High Severity", value: high.toString(), highlight: "orange" },
          { label: "Total Occurrences", value: totalOcc.toString(), highlight: "amber" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${
              s.highlight === "red" ? "text-red-400" :
              s.highlight === "orange" ? "text-orange-400" :
              s.highlight === "amber" ? "text-amber-400" :
              "text-white"
            }`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
        <svg className="text-red-400 mt-0.5 shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-300">
            2 critical anomaly patterns detected at Kumasi AutoFix
          </p>
          <p className="text-xs text-red-400/70 mt-0.5">
            Front Bumper and Headlight Assembly are consistently invoiced at 50–75% above benchmark across multiple claims.
          </p>
        </div>
        <button type="button" className="ml-auto shrink-0 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg transition-colors">
          Investigate
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {["PART / OEM NO.", "GARAGE", "OCCURRENCES", "AVG DEVIATION", "BENCHMARK AVG", "INVOICE AVG", "OVERCHARGE AVG", "LAST SEEN", "SEVERITY"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a) => {
                const overchargeAvg = a.invoiceAvg - a.benchmarkAvg;
                return (
                  <tr key={a.oem} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{a.part}</p>
                      <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{a.oem}</p>
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA]">{a.garage}</td>
                    <td className="px-5 py-4 text-white font-semibold">{a.occurrences}</td>
                    <td className="px-5 py-4 text-red-400 font-mono font-semibold">+{a.avgDeviation.toFixed(1)}%</td>
                    <td className="px-5 py-4 text-[#8A97AA] font-mono">{a.benchmarkAvg.toLocaleString()}</td>
                    <td className="px-5 py-4 text-white font-mono">{a.invoiceAvg.toLocaleString()}</td>
                    <td className="px-5 py-4 text-red-400 font-mono">+{overchargeAvg.toLocaleString()}</td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs">{a.lastSeen}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityBadge[a.severity]}`}>
                        {a.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
