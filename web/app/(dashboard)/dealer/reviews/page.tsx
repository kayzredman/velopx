export default function ReviewsPage() {
  const reviews = [
    {
      id: 'r1',
      buyer: 'Tema Motors',
      part: 'Front Bumper Assembly',
      rating: 5,
      comment: 'Part was exactly as described. OEM quality, fast dispatch. Will order again.',
      date: 'Apr 24, 2026',
      verified: true,
    },
    {
      id: 'r2',
      buyer: 'Kumasi AutoFix',
      part: 'Brake Disc Set (Front)',
      rating: 4,
      comment: 'Good condition, matched the listing. Delivery took slightly longer than expected but part is solid.',
      date: 'Apr 20, 2026',
      verified: true,
    },
    {
      id: 'r3',
      buyer: 'Accra Service Hub',
      part: 'LED Headlight Assembly',
      rating: 5,
      comment: 'Perfect fitment on the Tucson. Price was very competitive compared to other dealers on the platform.',
      date: 'Apr 18, 2026',
      verified: true,
    },
    {
      id: 'r4',
      buyer: 'Ridge Garage',
      part: 'Windscreen (OEM)',
      rating: 3,
      comment: 'Part was fine but packaging could be better. Minor scuff on the edge — usable though.',
      date: 'Apr 10, 2026',
      verified: false,
    },
  ]

  const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
  const fiveStars = reviews.filter((r) => r.rating === 5).length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Reviews</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Buyer feedback on your parts and service</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5 flex items-center gap-4">
          <span className="text-4xl font-bold text-amber-400">{avgRating}</span>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'text-amber-400' : 'text-[#1E2E48]'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-[#8A97AA] text-xs mt-1">{reviews.length} reviews total</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">5-Star Reviews</p>
          <p className="text-2xl font-bold text-white">{fiveStars}</p>
          <p className="text-[#8A97AA] text-xs mt-1">{Math.round((fiveStars / reviews.length) * 100)}% of all reviews</p>
        </div>
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Response Rate</p>
          <p className="text-2xl font-bold text-white">100%</p>
          <p className="text-[#8A97AA] text-xs mt-1">All RFQs responded to on time</p>
        </div>
      </div>

      {/* Review cards */}
      <div className="flex flex-col gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-semibold text-sm">{r.buyer}</span>
                  {r.verified && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-green-500/10 text-green-400 border border-green-500/20">
                      VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-[#8A97AA] text-xs">{r.part}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400' : 'text-[#1E2E48]'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[#8A97AA] text-xs">{r.date}</span>
              </div>
            </div>
            <p className="text-[#8A97AA] text-sm leading-relaxed">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
