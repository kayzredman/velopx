export default function GarageOrders() {
  const orders = [
    {
      id: "ORD-5514",
      part: "Front Bumper Assembly",
      oem: "TY-211-BMP-01",
      vehicle: "Toyota Corolla 2019",
      dealer: "Accra Auto Parts Ltd",
      price: 1_480,
      ordered: "Apr 26, 2026",
      eta: "Apr 28, 2026",
      status: "IN TRANSIT",
    },
    {
      id: "ORD-5510",
      part: "Headlight Assembly (L)",
      oem: "TY-811-HDL-L2",
      vehicle: "Toyota Corolla 2019",
      dealer: "Prime Parts Ghana",
      price: 870,
      ordered: "Apr 25, 2026",
      eta: "Apr 27, 2026",
      status: "IN TRANSIT",
    },
    {
      id: "ORD-5502",
      part: "Brake Pad Set (Front)",
      oem: "TY-435-PAD-F0",
      vehicle: "Toyota Yaris 2021",
      dealer: "Accra Auto Parts Ltd",
      price: 175,
      ordered: "Apr 24, 2026",
      eta: "Apr 25, 2026",
      status: "DELIVERED",
    },
    {
      id: "ORD-5498",
      part: "Front Shock Absorber Pair",
      oem: "TY-484-SHK-F2",
      vehicle: "Toyota Hilux 2022",
      dealer: "Tema Spares Hub",
      price: 980,
      ordered: "Apr 22, 2026",
      eta: "Apr 26, 2026",
      status: "PENDING PICKUP",
    },
    {
      id: "ORD-5490",
      part: "Water Pump",
      oem: "TY-161-WPM-00",
      vehicle: "Toyota Corolla 2019",
      dealer: "Prime Parts Ghana",
      price: 295,
      ordered: "Apr 20, 2026",
      eta: "Apr 23, 2026",
      status: "DELIVERED",
    },
  ];

  const statusBadge: Record<string, string> = {
    "IN TRANSIT": "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    DELIVERED: "bg-green-500/15 text-green-400 border border-green-500/30",
    "PENDING PICKUP": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  };

  const active = orders.filter((o) => o.status !== "DELIVERED").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const totalSpend = orders.reduce((s, o) => s + o.price, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Orders</h1>
          <p className="text-sm text-[#8A97AA] mt-1">Parts ordered by your workshop</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Orders", value: active.toString(), highlight: "blue" },
          { label: "Delivered", value: delivered.toString(), highlight: "green" },
          { label: "Total Spend (Month)", value: `GHS ${totalSpend.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === "blue" ? "text-blue-400" : s.highlight === "green" ? "text-green-400" : "text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2E48]">
              {["ORDER", "PART / OEM NO.", "VEHICLE", "DEALER", "PRICE (GHS)", "ORDERED", "ETA", "STATUS"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors">
                <td className="px-5 py-4 text-[#F5A623] font-mono text-xs font-semibold">{o.id}</td>
                <td className="px-5 py-4">
                  <p className="text-white font-medium">{o.part}</p>
                  <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{o.oem}</p>
                </td>
                <td className="px-5 py-4 text-[#8A97AA] text-xs">{o.vehicle}</td>
                <td className="px-5 py-4 text-[#8A97AA]">{o.dealer}</td>
                <td className="px-5 py-4 text-white font-mono font-semibold">{o.price.toLocaleString()}</td>
                <td className="px-5 py-4 text-[#8A97AA] text-xs">{o.ordered}</td>
                <td className="px-5 py-4 text-[#8A97AA] text-xs">{o.eta}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[o.status]}`}>
                    {o.status}
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
