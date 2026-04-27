export default function AssessHistory() {
  const history = [
    {
      id: "CLM-2041",
      garage: "Kumasi AutoFix",
      vehicle: "Toyota Corolla 2019",
      insurer: "Enterprise Assurance",
      invoiceTotal: 6_840,
      benchmarkTotal: 4_370,
      overcharge: 2_470,
      pct: 56.5,
      status: "FLAGGED",
      statusColor: "red",
      closed: "Apr 22, 2026",
      outcome: "Adjusted",
    },
    {
      id: "CLM-2038",
      garage: "Accra Panel Works",
      vehicle: "Honda CR-V 2020",
      insurer: "StarLife General",
      invoiceTotal: 3_120,
      benchmarkTotal: 2_980,
      overcharge: 140,
      pct: 4.7,
      status: "OK",
      statusColor: "green",
      closed: "Apr 20, 2026",
      outcome: "Approved",
    },
    {
      id: "CLM-2034",
      garage: "Tema Motors Ltd",
      vehicle: "Hyundai Tucson 2021",
      insurer: "Enterprise Assurance",
      invoiceTotal: 5_450,
      benchmarkTotal: 4_900,
      overcharge: 550,
      pct: 11.2,
      status: "REVIEW",
      statusColor: "amber",
      closed: "Apr 18, 2026",
      outcome: "Adjusted",
    },
    {
      id: "CLM-2029",
      garage: "Kumasi AutoFix",
      vehicle: "Toyota Hilux 2022",
      insurer: "Hollard Ghana",
      invoiceTotal: 8_200,
      benchmarkTotal: 7_600,
      overcharge: 600,
      pct: 7.9,
      status: "REVIEW",
      statusColor: "amber",
      closed: "Apr 15, 2026",
      outcome: "Approved",
    },
    {
      id: "CLM-2021",
      garage: "Speed Auto Repairs",
      vehicle: "Toyota Yaris 2018",
      insurer: "StarLife General",
      invoiceTotal: 1_890,
      benchmarkTotal: 1_830,
      overcharge: 60,
      pct: 3.3,
      status: "OK",
      statusColor: "green",
      closed: "Apr 10, 2026",
      outcome: "Approved",
    },
    {
      id: "CLM-2017",
      garage: "Accra Panel Works",
      vehicle: "Nissan Navara 2020",
      insurer: "Hollard Ghana",
      invoiceTotal: 11_340,
      benchmarkTotal: 7_200,
      overcharge: 4_140,
      pct: 57.5,
      status: "FLAGGED",
      statusColor: "red",
      closed: "Apr 7, 2026",
      outcome: "Rejected",
    },
  ];

  const statusBadge: Record<string, string> = {
    FLAGGED: "bg-red-500/15 text-red-400 border border-red-500/30",
    REVIEW: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    OK: "bg-green-500/15 text-green-400 border border-green-500/30",
  };

  const outcomeBadge: Record<string, string> = {
    Approved: "text-green-400",
    Adjusted: "text-amber-400",
    Rejected: "text-red-400",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Assessment History</h1>
          <p className="text-sm text-[#8A97AA] mt-1">
            All closed claims assessed by your account
          </p>
        </div>
        <div className="flex gap-2">
          <select className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]">
            <option>All Insurers</option>
            <option>Enterprise Assurance</option>
            <option>StarLife General</option>
            <option>Hollard Ghana</option>
          </select>
          <select className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]">
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>This year</option>
          </select>
          <button
            type="button"
            className="bg-[#1E2E48] hover:bg-[#2a3e5c] text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Closed", value: "48", sub: "last 30 days" },
          { label: "Flagged", value: "11", sub: "22.9% flag rate", highlight: "red" },
          { label: "Total Savings", value: "GHS 38.4k", sub: "overcharge recovered", highlight: "green" },
          { label: "Avg Accuracy", value: "94.2%", sub: "your score" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4"
          >
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                s.highlight === "red"
                  ? "text-red-400"
                  : s.highlight === "green"
                    ? "text-green-400"
                    : "text-white"
              }`}
            >
              {s.value}
            </p>
            <p className="text-xs text-[#8A97AA] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2E48]">
              {["CLAIM", "GARAGE / VEHICLE", "INSURER", "INVOICE", "BENCHMARK", "OVERCHARGE", "OUTCOME", "CLOSED", "FLAG"].map(
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
            {history.map((c) => (
              <tr
                key={c.id}
                className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors"
              >
                <td className="px-5 py-4 text-[#F5A623] font-mono text-xs font-semibold">
                  {c.id}
                </td>
                <td className="px-5 py-4">
                  <p className="text-white">{c.garage}</p>
                  <p className="text-xs text-[#8A97AA] mt-0.5">{c.vehicle}</p>
                </td>
                <td className="px-5 py-4 text-[#8A97AA]">{c.insurer}</td>
                <td className="px-5 py-4 text-white font-mono">
                  {c.invoiceTotal.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-[#8A97AA] font-mono">
                  {c.benchmarkTotal.toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <p className="text-red-400 font-mono">
                    +{c.overcharge.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#8A97AA]">+{c.pct}%</p>
                </td>
                <td className={`px-5 py-4 font-medium ${outcomeBadge[c.outcome]}`}>
                  {c.outcome}
                </td>
                <td className="px-5 py-4 text-[#8A97AA] text-xs">{c.closed}</td>
                <td className="px-5 py-4">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[c.status]}`}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
