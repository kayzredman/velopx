export default function GarageSettings() {
  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Manage your workshop profile and preferences</p>
      </div>

      {/* Workshop profile */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Workshop Profile</h2>
        {[
          { label: "Workshop Name", id: "garage-name", value: "Kumasi AutoFix", type: "text" },
          { label: "Owner / Contact Name", id: "garage-owner", value: "Ama Owusu", type: "text" },
          { label: "Email", id: "garage-email", value: "ama.owusu@kumasi-autofix.gh", type: "email" },
          { label: "Phone", id: "garage-phone", value: "+233 51 000 7890", type: "tel" },
          { label: "Location", id: "garage-location", value: "Adum, Kumasi, Ashanti Region", type: "text" },
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

      {/* Preferences */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Order Preferences</h2>
        <div>
          <label htmlFor="garage-preferred-condition" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Preferred part condition</label>
          <select id="garage-preferred-condition" className="bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]">
            <option>OEM Only</option>
            <option>OEM or Used</option>
            <option>Any Condition</option>
          </select>
        </div>
        <div>
          <label htmlFor="garage-max-lead" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Max lead time (days)</label>
          <input id="garage-max-lead" type="number" defaultValue={3} min={1} max={14} className="w-32 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]" />
        </div>
        <div>
          <label htmlFor="garage-delivery-instructions" className="block text-xs font-medium text-[#8A97AA] mb-1.5">Delivery instructions</label>
          <textarea
            id="garage-delivery-instructions"
            rows={3}
            defaultValue="Deliver to the workshop gate — ask for Kojo."
            className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623] resize-none"
          />
        </div>
        <button type="button" className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
          Save Preferences
        </button>
      </section>

      {/* Notifications */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {[
          { label: "New quote received for RFQ", on: true },
          { label: "Part dispatched by dealer", on: true },
          { label: "Delivery arriving today", on: true },
          { label: "Job card status updates", on: false },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-1">
            <span className="text-sm text-[#8A97AA]">{n.label}</span>
            <div className={`w-10 h-5 rounded-full relative cursor-pointer ${n.on ? "bg-[#F5A623]" : "bg-[#1E2E48]"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.on ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
        ))}
      </section>

      {/* Danger zone */}
      <section className="bg-[#0D1E35] border border-red-500/20 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        <p className="text-xs text-[#8A97AA]">
          Deleting your workshop account is permanent. All job cards, RFQs, and order history will be lost.
        </p>
        <button type="button" className="text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors">
          Delete Workshop Account
        </button>
      </section>
    </div>
  );
}
