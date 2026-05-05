export default function ReviewsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Reviews</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Buyer feedback on your parts and service</p>
      </div>

      <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1E2E48] flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">Reviews Coming Soon</h2>
        <p className="text-[#8A97AA] text-sm max-w-sm">
          Buyer reviews will appear here once the reviews module launches. Your rating and feedback history will be visible to garages and insurers on the platform.
        </p>
      </div>
    </div>
  )
}
