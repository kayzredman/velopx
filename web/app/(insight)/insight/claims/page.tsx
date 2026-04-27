export default function InsightClaims() {
  const claims = [
    { id: "CLM-2049", garage: "Kumasi AutoFix", vehicle: "Toyota Corolla 2019", insurer: "Enterprise Assurance", assessor: "Kofi Boateng", invoice: 6_840, benchmark: 4_370, overcharge: 2_470, pct: 56.5, flag: "FLAGGED", submitted: "Apr 26, 2026", status: "Open" },
    { id: "CLM-2048", garage: "Accra Panel Works", vehicle: "Hyundai i10 2021", insurer: "Enterprise Assurance", assessor: "Ama Asante", invoice: 2_100, benchmark: 1_980, overcharge: 120, pct: 6.1, flag: "REVIEW", submitted: "Apr 25, 2026", status: "Open" },
    { id: "CLM-2047", garage: "Tema Motors Ltd", vehicle: "Kia Sportage 2022", insurer: "Enterprise Assurance", assessor: "—", invoice: 7_200, benchmark: 6_800, overcharge: 400, pct: 5.9, flag: "OK", submitted: "Apr 24, 2026", status: "Unassigned" },
    { id: "CLM-2046", garage: "Speed Auto Repairs", vehicle: "Toyota Hilux 2022", insurer: "Enterprise Assurance", assessor: "Kofi Boateng", invoice: 8_200, benchmark: 7_600, overcharge: 600, pct: 7.9, flag: "REVIEW", submitted: "Apr 23, 2026", status: "Open" },
    { id: "CLM-2041", garage: "Kumasi AutoFix", vehicle: "Toyota Corolla 2019", insurer: "Enterprise Assurance", assessor: "Kofi Boateng", invoice: 5_450, benchmark: 4_900, overcharge: 550, pct: 11.2, flag: "REVIEW", submitted: "Apr 20, 2026", status: "Closed" },
    { id: "CLM-2038", garage: "Accra Panel Works", vehicle: "Honda CR-V 2020", insurer: "Enterprise Assurance", assessor: "Ama Asante", invoice: 3_120, benchmark: 2_980, overcharge: 140, pct: 4.7, flag: "OK", submitted: "Apr 18, 2026", status: "Closed" },
    { id: "CLM-2034", garage: "Pokuase AutoFix", vehicle: "Nissan Navara 2020", insurer: "Enterprise Assurance", assessor: "Kofi Boateng", invoice: 11_340, benchmark: 7_200, overcharge: 4_140, pct: 57.5, flag: "FLAGGED", submitted: "Apr 15, 2026", status: "Closed" },
  ];

  const flagBadge: Record<string, string> = {
    FLAGGED: "bg-red-500/15 text-red-400 border border-red-500/30",
    REVIEW: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    OK: "bg-green-500/15 text-green-400 border border-green-500/30",
  };

  const statusBadge: Record<string, string> = {
    Open: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    Unassigned: "bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]",
    Closed: "bg-green-500/15 text-green-400 border border-green-500/30",
  };

  const open = claims.filter((c) => c.status === "Open" || c.status === "Unassigned");
  const flagged = claims.filter((c) => c.flag === "FLAGGED");
  const totalSavings = claims.reduce((s, c) => s + c.overcharge, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Claims</h1>
          <p className="text-sm text-[#8A97AA] mt-1">
            All claims submitted under Enterprise Assurance
          </p>
        </div>
        <div className="flex gap-2">
          <select className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]">
            <option>All Statuses</option>
            <option>Open</option>
            <option>Unassigned</option>
            <option>Closed</option>
          </select>
          <select className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]">
            <option>All Flags</option>
            <option>Flagged</option>
            <option>Review</option>
            <option>OK</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Claims", value: claims.length.toString() },
          { label: "Open / Unassigned", value: open.length.toString(), highlight: "amber" },
          { label: "Flagged", value: flagged.length.toString(), highlight: "red" },
          { label: "Total Savings", value: `GHS ${(totalSavings / 1000).toFixed(1)}k`, highlight: "green" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === "red" ? "text-red-400" : s.highlight === "amber" ? "text-amber-400" : s.highlight === "green" ? "text-green-400" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {["CLAIM", "GARAGE / VEHICLE", "ASSESSOR", "INVOICE", "OVERCHARGE", "STATUS", "SUBMITTED", "FLAG"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors">
                  <td className="px-5 py-4 text-[#F5A623] font-mono text-xs font-semibold">{c.id}</td>
                  <td className="px-5 py-4">
                    <p className="text-white">{c.garage}</p>
                    <p className="text-xs text-[#8A97AA] mt-0.5">{c.vehicle}</p>
                  </td>
                  <td className="px-5 py-4 text-[#8A97AA] text-xs">{c.assessor}</td>
                  <td className="px-5 py-4 text-white font-mono">{c.invoice.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <p className="text-red-400 font-mono">+{c.overcharge.toLocaleString()}</p>
                    <p className="text-xs text-[#8A97AA]">+{c.pct}%</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#8A97AA] text-xs">{c.submitted}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${flagBadge[c.flag]}`}>
                      {c.flag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
