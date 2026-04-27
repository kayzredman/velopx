export default function AssessSettings() {
  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[#8A97AA] mt-1">
          Manage your assessor profile and preferences
        </p>
      </div>

      {/* Profile */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Assessor Profile</h2>
        {[
          { label: "Full Name", id: "assess-full-name", value: "Kofi Boateng", type: "text" },
          { label: "Email", id: "assess-email", value: "kofi.boateng@enterprise.gh", type: "email" },
          { label: "Phone", id: "assess-phone", value: "+233 24 000 1234", type: "tel" },
          { label: "Organisation", id: "assess-org", value: "Enterprise Assurance Ltd", type: "text" },
          { label: "Assessor ID", id: "assess-id", value: "EA-ASR-0042", type: "text" },
        ].map((f) => (
          <div key={f.id}>
            <label
              htmlFor={f.id}
              className="block text-xs font-medium text-[#8A97AA] mb-1.5"
            >
              {f.label}
            </label>
            <input
              id={f.id}
              type={f.type}
              defaultValue={f.value}
              className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
            />
          </div>
        ))}
        <button
          type="button"
          className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          Save Profile
        </button>
      </section>

      {/* Assessment defaults */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Assessment Defaults</h2>

        <div>
          <label
            htmlFor="assess-flag-threshold"
            className="block text-xs font-medium text-[#8A97AA] mb-1.5"
          >
            Auto-flag threshold (% overcharge)
          </label>
          <input
            id="assess-flag-threshold"
            type="number"
            defaultValue={25}
            min={5}
            max={100}
            className="w-32 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
          />
          <p className="text-xs text-[#8A97AA] mt-1.5">
            Line items exceeding this percentage above benchmark are automatically flagged.
          </p>
        </div>

        <div>
          <label
            htmlFor="assess-review-threshold"
            className="block text-xs font-medium text-[#8A97AA] mb-1.5"
          >
            Review threshold (% overcharge)
          </label>
          <input
            id="assess-review-threshold"
            type="number"
            defaultValue={10}
            min={1}
            max={50}
            className="w-32 bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
          />
        </div>

        <div>
          <label
            htmlFor="assess-default-insurer"
            className="block text-xs font-medium text-[#8A97AA] mb-1.5"
          >
            Default insurer
          </label>
          <select
            id="assess-default-insurer"
            className="bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
          >
            <option>Enterprise Assurance Ltd</option>
            <option>StarLife General</option>
            <option>Hollard Ghana</option>
          </select>
        </div>

        <button
          type="button"
          className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          Save Defaults
        </button>
      </section>

      {/* Notifications */}
      <section className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {[
          { label: "New claim assigned to me", on: true },
          { label: "Claim deadline reminders", on: true },
          { label: "Weekly performance digest", on: false },
          { label: "System alerts", on: true },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-1">
            <span className="text-sm text-[#8A97AA]">{n.label}</span>
            <div
              className={`w-10 h-5 rounded-full relative cursor-pointer ${n.on ? "bg-[#F5A623]" : "bg-[#1E2E48]"}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.on ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
