export default function GarageJobCards() {
  const jobs = [
    {
      id: "JOB-0112",
      customer: "Kwame Owusu",
      vehicle: "Toyota Corolla 2019 · GR-1234-21",
      description: "Front-end collision repair — bumper, headlights, bonnet",
      parts: ["ORD-5514 · Front Bumper Assembly", "ORD-5510 · Headlight Assembly (L)"],
      partsReady: false,
      mechanic: "Kojo Mensah",
      opened: "Apr 24, 2026",
      status: "WAITING FOR PARTS",
    },
    {
      id: "JOB-0111",
      customer: "Ama Frimpong",
      vehicle: "Toyota Yaris 2021 · AS-5678-22",
      description: "Front brake replacement",
      parts: ["ORD-5502 · Brake Pad Set (Front)"],
      partsReady: true,
      mechanic: "Abena Owusu",
      opened: "Apr 25, 2026",
      status: "IN PROGRESS",
    },
    {
      id: "JOB-0109",
      customer: "Yaw Darko",
      vehicle: "Toyota Hilux 2022 · BA-9012-23",
      description: "Suspension overhaul — front shock absorbers",
      parts: ["ORD-5498 · Front Shock Absorber Pair"],
      partsReady: false,
      mechanic: "Kojo Mensah",
      opened: "Apr 22, 2026",
      status: "WAITING FOR PARTS",
    },
    {
      id: "JOB-0105",
      customer: "Akosua Boateng",
      vehicle: "Toyota Corolla 2019 · GE-3456-20",
      description: "Cooling system repair — water pump replacement",
      parts: ["ORD-5490 · Water Pump"],
      partsReady: true,
      mechanic: "Abena Owusu",
      opened: "Apr 20, 2026",
      status: "COMPLETE",
    },
    {
      id: "JOB-0101",
      customer: "Kofi Adu",
      vehicle: "Honda CR-V 2020 · WR-7890-21",
      description: "Full service — oil change, filters, spark plugs",
      parts: [],
      partsReady: true,
      mechanic: "Kojo Mensah",
      opened: "Apr 18, 2026",
      status: "COMPLETE",
    },
  ];

  const statusBadge: Record<string, string> = {
    "WAITING FOR PARTS": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    "IN PROGRESS": "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    COMPLETE: "bg-green-500/15 text-green-400 border border-green-500/30",
  };

  const open = jobs.filter((j) => j.status !== "COMPLETE").length;
  const waiting = jobs.filter((j) => j.status === "WAITING FOR PARTS").length;
  const complete = jobs.filter((j) => j.status === "COMPLETE").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Job Cards</h1>
          <p className="text-sm text-[#8A97AA] mt-1">Active and completed workshop jobs</p>
        </div>
        <button type="button" className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
          + New Job Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Jobs", value: open.toString(), highlight: "blue" },
          { label: "Waiting for Parts", value: waiting.toString(), highlight: "amber" },
          { label: "Completed (Month)", value: complete.toString(), highlight: "green" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === "blue" ? "text-blue-400" : s.highlight === "amber" ? "text-amber-400" : "text-green-400"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {jobs.map((j) => (
          <div
            key={j.id}
            className={`bg-[#0D1E35] border rounded-xl p-5 transition-colors ${
              j.status === "COMPLETE" ? "border-[#1E2E48] opacity-60" : "border-[#1E2E48] hover:border-[#2a3e5c]"
            }`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[#F5A623] font-mono text-xs font-semibold">{j.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[j.status]}`}>
                    {j.status}
                  </span>
                </div>
                <p className="text-white font-medium mt-2">{j.customer}</p>
                <p className="text-xs text-[#8A97AA] mt-0.5">{j.vehicle}</p>
                <p className="text-sm text-[#8A97AA] mt-2">{j.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[#8A97AA]">Mechanic</p>
                <p className="text-white text-sm font-medium">{j.mechanic}</p>
                <p className="text-xs text-[#8A97AA] mt-2">Opened: {j.opened}</p>
              </div>
            </div>

            {/* Parts row */}
            {j.parts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1E2E48]">
                <p className="text-xs font-medium text-[#8A97AA] mb-2">Parts</p>
                <div className="flex flex-wrap gap-2">
                  {j.parts.map((p) => (
                    <span
                      key={p}
                      className={`text-xs px-2.5 py-1 rounded-lg border ${
                        j.partsReady
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
