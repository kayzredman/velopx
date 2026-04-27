import Link from 'next/link'

const portals = [
  {
    href: '/dealer',
    label: 'Dealer',
    product: 'VelopX Dealer',
    description:
      'Manage your parts catalogue, respond to RFQs, and track dispatches.',
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    accent: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    iconColor: 'text-amber-400',
    badge: 'Parts Dealer',
  },
  {
    href: '/assess',
    label: 'Assess',
    product: 'VelopX Assess',
    description:
      'Validate insurance invoices against live market benchmarks and flag overcharging.',
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    accent: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    iconColor: 'text-blue-400',
    badge: 'Insurance Assessor',
  },
  {
    href: '/insight',
    label: 'Insight',
    product: 'VelopX Insight',
    description:
      'Analytics and fraud intelligence for insurance companies — anomalies, assessor performance, savings.',
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        aria-hidden="true"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    accent: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    iconColor: 'text-purple-400',
    badge: 'Insurance Company',
  },
  {
    href: '/garage',
    label: 'Garage',
    product: 'VelopX Garage',
    description:
      'Find parts, send RFQs to dealers, track deliveries, and manage workshop job cards.',
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        aria-hidden="true"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    accent: 'from-green-500/20 to-green-500/5 border-green-500/30',
    iconColor: 'text-green-400',
    badge: 'Mechanic Workshop',
  },
]

export default function SelectPortal() {
  return (
    <div className="min-h-screen bg-[#060F1E] flex flex-col items-center justify-center px-6 py-16">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#F5A623] text-2xl">⚡</span>
        <span className="text-white font-bold text-xl tracking-tight">velopX</span>
      </div>
      <h1 className="text-2xl font-bold text-white mt-4">Choose your portal</h1>
      <p className="text-[#8A97AA] text-sm mt-2 text-center max-w-sm">
        You&apos;re signed in. Select which VelopX product you want to access.
      </p>

      {/* Portal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 w-full max-w-2xl">
        {portals.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`relative bg-gradient-to-br ${p.accent} border rounded-2xl p-6 hover:scale-[1.02] transition-transform group`}
          >
            {/* Badge */}
            <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-[#8A97AA]">
              {p.badge}
            </span>

            {/* Icon */}
            <div className={`${p.iconColor} mb-4`}>{p.icon}</div>

            {/* Text */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A97AA] mb-1">
              {p.product}
            </p>
            <h2 className="text-white font-bold text-lg">{p.label}</h2>
            <p className="text-[#8A97AA] text-xs mt-2 leading-relaxed">
              {p.description}
            </p>

            {/* Arrow */}
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#F5A623] group-hover:gap-2.5 transition-all">
              Open portal
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-[#8A97AA]/60 mt-10 text-center">
        Access is controlled by your account role. Contact your administrator if you need access to a different portal.
      </p>
    </div>
  )
}
