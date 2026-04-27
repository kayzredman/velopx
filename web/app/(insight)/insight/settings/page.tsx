export default function InsightSettings() {
  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Manage your insurance company account and preferences</p>
      </div>

      {/* Company profile */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Company Profile</h2>
        {[
          { label: "Company Name", id: "insight-company", value: "Enterprise Assurance Ltd", type: "text" },
          { label: "Contact Name", id: "insight-contact", value: "Abena Osei", type: "text" },
          { label: "Contact Email", id: "insight-email", value: "abena.osei@enterprise.gh", type: "email" },
          { label: "Phone", id: "insight-phone", value: "+233 30 000 5678", type: "tel" },
          { label: "Policy Prefix", id: "insight-prefix", value: "EA", type: "text" },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-xs font-medium text-[#8A97AA] mb-1.5">{f.label}</label>
            <input id={f.id} type={f.type} defaultValue={f.value} className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]" />
          </div>
        ))}
        <button type="button" className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
          Save Profile
        </button>
      </section>

      {/* Thresholds */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Alert Thresholds</h2>
        <div>
          <label htmlFor="insight-flag-threshold" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Auto-escalate when overcharge exceeds (%)</label>
          <input id="insight-flag-threshold" type="number" defaultValue={30} min={5} max={100} className="w-32 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]" />
          <p className="text-xs text-[#8A97AA] mt-1.5">Claims exceeding this threshold are automatically escalated to your fraud team.</p>
        </div>
        <div>
          <label htmlFor="insight-anomaly-min" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Anomaly pattern minimum occurrences</label>
          <input id="insight-anomaly-min" type="number" defaultValue={2} min={1} max={20} className="w-32 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]" />
          <p className="text-xs text-[#8A97AA] mt-1.5">Minimum occurrences before a pricing deviation appears in the Anomalies list.</p>
        </div>
        <button type="button" className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
          Save Thresholds
        </button>
      </section>

      {/* Notifications */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {[
          { label: "Critical anomaly detected", on: true },
          { label: "Weekly claims digest", on: true },
          { label: "New assessor activity", on: false },
          { label: "Monthly report ready", on: true },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-1">
            <span className="text-sm text-[#8A97AA]">{n.label}</span>
            <div className={`w-10 h-5 rounded-full relative cursor-pointer ${n.on ? "bg-[#F5A623]" : "bg-[#1E2E48]"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.on ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
