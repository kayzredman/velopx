'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface QuoteItem {
  id: string
  price: string
  currency: string
  note: string | null
  part: { id: string; name: string; oemNumber: string | null }
}

interface Quote {
  id: string
  status: string
  claimReference: string | null
  expiresAt: string | null
  createdAt: string
  items: QuoteItem[]
}

// Map backend status → display label
const STATUS_LABEL: Record<string, string> = {
  pending:   'AWAITING',
  responded: 'QUOTES IN',
  accepted:  'ORDERED',
  declined:  'DECLINED',
  expired:   'EXPIRED',
}
const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  responded: 'bg-green-500/15 text-green-400 border border-green-500/30',
  accepted:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  declined:  'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]',
  expired:   'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]',
}

const LIMIT = 20

export default function GarageRFQs() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [quotes, setQuotes]           = useState<Quote[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(false)
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [query, setQuery]             = useState('')
  const [actingId, setActingId]       = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchQuotes = useCallback(async (q: string, pg: number, append: boolean) => {
    if (pg === 1 && !append) setLoading(true)
    else setLoadingMore(true)
    try {
      const token = await getToken()
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(pg) })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`${API_URL}/v1/quotes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Quote[]; meta: { total: number; pages: number } }
      setQuotes((prev) => append ? [...prev, ...json.data] : json.data)
      setTotal(json.meta.total)
      setHasMore(pg < json.meta.pages)
      setPage(pg)
    } catch { /* keep existing */ } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getToken, API_URL])

  useEffect(() => {
    fetchQuotes('', 1, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(q: string) {
    setQuery(q)
    fetchQuotes(q, 1, false)
  }

  function loadMore() {
    fetchQuotes(query, page + 1, true)
  }

  async function handleAction(id: string, action: 'accepted' | 'declined') {
    setActingId(id)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (res.ok) {
        const json = await res.json()
        setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: action } : q))
        // Navigate to the created order on accept
        if (action === 'accepted' && json.orderId) {
          router.push(`/garage/orders/${json.orderId}`)
        }
      }    } catch { /* noop */ }
    finally { setActingId(null) }
  }

  const responded = quotes.filter((q) => q.status === 'responded').length
  const pending   = quotes.filter((q) => q.status === 'pending').length
  const ordered   = quotes.filter((q) => q.status === 'accepted').length

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">My RFQs</h1>
          <p className="text-sm text-[#8A97AA] mt-1">Requests for quotation sent to dealers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Quotes Received', value: responded.toString(), highlight: 'green' },
          { label: 'Awaiting Response', value: pending.toString(), highlight: 'amber' },
          { label: 'Ordered', value: ordered.toString(), highlight: 'blue' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === 'green' ? 'text-green-400' : s.highlight === 'amber' ? 'text-amber-400' : 'text-blue-400'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quotes-in banner */}
      {responded > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <svg className="text-green-400 shrink-0 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-2.99" />
          </svg>
          <p className="text-sm text-green-300">
            You have <span className="font-semibold">{responded} RFQ{responded > 1 ? 's' : ''} with quotes ready</span> — review and confirm your orders.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        {/* Table header with search */}
        <div className="px-5 py-3 bg-[#0A1628] border-b border-[#1E2E48] flex items-center gap-4">
          <span className="text-white text-sm font-semibold shrink-0">All RFQs</span>
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by claim reference…"
            className="flex-1 bg-[#0C1526] border border-[#1E2E48] rounded-lg px-3 py-1.5 text-[#E8ECF1] text-xs placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
          />
          <span className="text-[#8A97AA] text-xs shrink-0">{loading ? '…' : `${total} total`}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-16 text-[#8A97AA] text-sm">No RFQs yet. Search for a part and request a quote.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['PART / OEM', 'SENT', 'EXPIRES', 'ITEMS', 'BEST PRICE', 'STATUS', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const badge = STATUS_BADGE[q.status] ?? STATUS_BADGE.expired
                const label = STATUS_LABEL[q.status] ?? q.status.toUpperCase()
                const bestItem = q.status === 'responded' || q.status === 'accepted'
                  ? q.items.reduce((best, i) => Number(i.price) < Number(best.price) ? i : best, q.items[0])
                  : null
                return (
                  <tr key={q.id} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{q.items[0]?.part.name ?? '—'}</p>
                      {q.items[0]?.part.oemNumber && (
                        <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{q.items[0].part.oemNumber}</p>
                      )}
                      {q.claimReference && (
                        <p className="text-xs text-[#8A97AA] mt-0.5">{q.claimReference}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs whitespace-nowrap">
                      {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">{q.items.length}</td>
                    <td className="px-5 py-4">
                      {bestItem ? (
                        <span className="text-green-400 font-mono font-semibold">
                          {bestItem.currency} {Number(bestItem.price).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[#8A97AA]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                    </td>
                    <td className="px-5 py-4">
                      {q.status === 'responded' && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={actingId === q.id}
                            onClick={() => handleAction(q.id, 'accepted')}
                            className="text-xs font-semibold text-green-400 hover:text-green-300 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <span className="text-[#3D5068]">·</span>
                          <button
                            type="button"
                            disabled={actingId === q.id}
                            onClick={() => handleAction(q.id, 'declined')}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {loadingMore && (
          <div className="flex justify-center py-4 border-t border-[#1E2E48]">
            <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loadingMore && hasMore && (
          <div className="border-t border-[#1E2E48] px-5 py-3">
            <button
              onClick={loadMore}
              className="w-full py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] hover:text-[#E8ECF1] hover:border-[#2D4163] text-xs font-medium transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
