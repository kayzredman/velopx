export default function AssessReports() {
  const reports = [
    {
      title: "Monthly Assessment Summary — April 2026",
      type: "Monthly Summary",
      generated: "Apr 26, 2026",
      claims: 21,
      flags: 5,
      savings: "GHS 14,200",
      status: "Ready",
    },
    {
      title: "Monthly Assessment Summary — March 2026",
      type: "Monthly Summary",
      generated: "Mar 31, 2026",
      claims: 18,
      flags: 4,
      savings: "GHS 11,800",
      status: "Ready",
    },
    {
      title: "Q1 2026 Overcharge Analysis",
      type: "Quarterly Report",
      generated: "Apr 3, 2026",
      claims: 54,
      flags: 12,
      savings: "GHS 38,400",
      status: "Ready",
    },
    {
      title: "Kumasi AutoFix — Garage Audit Report",
      type: "Garage Audit",
      generated: "Apr 15, 2026",
      claims: 9,
      flags: 4,
      savings: "GHS 9,100",
      status: "Ready",
    },
    {
      title: "Monthly Assessment Summary — May 2026",
      type: "Monthly Summary",
      generated: "—",
      claims: 0,
      flags: 0,
      savings: "—",
      status: "Scheduled",
    },
  ];

  const typeBadge: Record<string, string> = {
    "Monthly Summary": "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    "Quarterly Report": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    "Garage Audit": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Reports</h1>
          <p className="text-sm text-[#8A97AA] mt-1">
            Generated assessment reports for your account
          </p>
        </div>
        <button
          type="button"
          className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + Generate Report
        </button>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.map((r) => (
          <div
            key={r.title}
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-5 flex items-center gap-6 hover:border-[#2a3e5c] transition-colors"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-[#1E2E48] flex items-center justify-center shrink-0">
              <svg
                className="text-[#F5A623]"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium text-sm truncate">{r.title}</p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${typeBadge[r.type] ?? "bg-[#1E2E48] text-[#8A97AA]"}`}
                >
                  {r.type}
                </span>
              </div>
              <p className="text-xs text-[#8A97AA] mt-1">
                Generated: {r.generated}
              </p>
            </div>

            {/* Stats */}
            {r.status === "Ready" && (
              <div className="hidden lg:flex items-center gap-8 text-center shrink-0">
                <div>
                  <p className="text-white font-semibold">{r.claims}</p>
                  <p className="text-xs text-[#8A97AA]">Claims</p>
                </div>
                <div>
                  <p className="text-red-400 font-semibold">{r.flags}</p>
                  <p className="text-xs text-[#8A97AA]">Flagged</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold">{r.savings}</p>
                  <p className="text-xs text-[#8A97AA]">Savings</p>
                </div>
              </div>
            )}

            {/* Status / actions */}
            <div className="shrink-0 flex items-center gap-3">
              {r.status === "Scheduled" ? (
                <span className="text-xs text-[#8A97AA] bg-[#1E2E48] px-3 py-1.5 rounded-lg">
                  Scheduled
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className="text-xs text-[#8A97AA] hover:text-white transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-[#1E2E48] hover:bg-[#2a3e5c] text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Download PDF
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
