export default function SettingsPage() {
  const sections = [
    {
      title: 'Business Profile',
      fields: [
        { label: 'Business Name', value: 'Accra Auto Parts Ltd', type: 'text' },
        { label: 'Contact Email', value: 'kwame@accrautoparts.gh', type: 'email' },
        { label: 'Phone Number', value: '+233 30 277 1234', type: 'tel' },
        { label: 'Location', value: 'Accra, Ghana', type: 'text' },
      ],
    },
    {
      title: 'Listing Defaults',
      fields: [
        { label: 'Default Currency', value: 'GHS — Ghanaian Cedi', type: 'text' },
        { label: 'Default Warranty Period', value: '30 days', type: 'text' },
        { label: 'Lead Time (days)', value: '1–2 business days', type: 'text' },
      ],
    },
  ]

  const notifications = [
    { label: 'New RFQ received', description: 'Get notified when a buyer sends a new request for quote', enabled: true },
    { label: 'Order confirmed', description: 'When a buyer accepts your quote and places an order', enabled: true },
    { label: 'Delivery status updates', description: 'Driver pick-up and delivery confirmations', enabled: true },
    { label: 'Weekly performance digest', description: 'Summary of your revenue, orders and views every Monday', enabled: false },
    { label: 'Price benchmark alerts', description: 'When your listing price deviates significantly from market average', enabled: false },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Manage your account and notification preferences</p>
      </div>

      {/* Profile + listing sections */}
      {sections.map((section) => (
        <div key={section.title} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2E48]">
            <h2 className="text-white font-semibold text-sm">{section.title}</h2>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {section.fields.map((f) => {
              const fieldId = `field-${f.label.replace(/\s+/g, '-').toLowerCase()}`
              return (
                <div key={f.label}>
                  <label htmlFor={fieldId} className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{f.label}</label>
                  <input
                    id={fieldId}
                    type={f.type}
                    defaultValue={f.value}
                    className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                </div>
              )
            })}
            <div className="flex justify-end pt-2">
              <button type="button" className="px-5 py-2 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Notifications */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2E48]">
          <h2 className="text-white font-semibold text-sm">Notifications</h2>
        </div>
        <div className="divide-y divide-[#1E2E48]">
          {notifications.map((n) => (
            <div key={n.label} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium">{n.label}</p>
                <p className="text-[#8A97AA] text-xs mt-0.5">{n.description}</p>
              </div>
              {/* Visual-only toggle — no state change needed for static mock */}
              <div
                className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${n.enabled ? 'bg-[#F5A623]' : 'bg-[#1E2E48]'}`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 mt-6">
        <h2 className="text-red-400 font-semibold text-sm mb-1">Danger Zone</h2>
        <p className="text-[#8A97AA] text-xs mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button type="button" className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}
