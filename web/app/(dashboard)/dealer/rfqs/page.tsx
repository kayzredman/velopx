'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface QuoteItem {
  id: string
  price: string
  currency: string
  note: string | null
  part: { id: string; name: string; oemNumber: string | null; condition: string; price: string; currency: string }
}

interface Quote {
  id: string
  status: string
  claimReference: string | null
  expiresAt: string | null
  createdAt: string
  requester: { id: string; name: string | null; email: string }
  items: QuoteItem[]
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'NEW',       cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  responded: { label: 'RESPONDED', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  accepted:  { label: 'ACCEPTED',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  declined:  { label: 'DECLINED',  cls: 'bg-white/5 text-[#8A97AA] border border-white/10' },
  expired:   { label: 'EXPIRED',   cls: 'bg-white/5 text-[#8A97AA] border border-white/10' },
}

interface RespondFormItem {
  quoteItemId: string
  partName: string
  price: string
  currency: string
  note: string
}

export default function RFQsPage() {
  const { getToken } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [respondModal, setRespondModal] = useState<Quote | null>(null)
  const [formItems, setFormItems] = useState<RespondFormItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchQuotes = useCallback(async (q: string, pg: number, append: boolean) => {
    try {
      const token = await getToken()
      const params = new URLSearchParams({ limit: '20', page: String(pg) })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`${API_URL}/v1/quotes/for-dealer?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Quote[]; meta: { total: number; page: number; pages: number } }
      setTotal(json.meta.total)
      setHasMore(json.meta.page < json.meta.pages)
      setPage(json.meta.page)
      if (append) {
        setQuotes((prev) => [...prev, ...json.data])
      } else {
        setQuotes(json.data)
      }
    } catch { /* keep existing */ }
  }, [getToken, API_URL])

  useEffect(() => {
    fetchQuotes('', 1, false).finally(() => setLoading(false))
  }, [fetchQuotes])

  function handleSearch(q: string) {
    setQuery(q)
    setLoading(true)
    fetchQuotes(q, 1, false).finally(() => setLoading(false))
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    await fetchQuotes(query, page + 1, true)
    setLoadingMore(false)
  }

  function openRespondModal(quote: Quote) {
    setFormItems(
      quote.items.map((i) => ({
        quoteItemId: i.id,
        partName: i.part.name,
        price: i.part.price,
        currency: i.part.currency,
        note: '',
      })),
    )
    setRespondModal(quote)
  }

  async function handleRespond() {
    if (!respondModal) return
    setSubmitting(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/quotes/${respondModal.id}/respond`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: formItems.map((f) => ({
            quoteItemId: f.quoteItemId,
            price: Number(f.price),
            currency: f.currency,
            note: f.note.trim() || undefined,
          })),
        }),
      })
      if (!res.ok) return
      setRespondModal(null)
      await fetchQuotes(query, 1, false)
    } catch { /* show error ideally */ }
    finally { setSubmitting(false) }
  }

  const pending = quotes.filter((q) => q.status === 'pending')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Requests for Quote</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Respond to requests to win new orders</p>
        </div>
        {pending.length > 0 && (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-sm font-semibold">
            {pending.length} new request{pending.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {/* Pending alert banners */}
      {pending.map((q) => (
        <div
          key={q.id}
          className="mb-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-5 flex items-center gap-5"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              ⚡ {q.claimReference ?? `Quote #${q.id.slice(0, 8)}`} — {q.items.map((i) => i.part.name).join(', ')}
            </p>
            <p className="text-[#8A97AA] text-xs mt-0.5">
              {q.requester.name ?? q.requester.email} · {q.items.length} item{q.items.length > 1 ? 's' : ''}
              {q.expiresAt ? <> · Respond by <span className="text-amber-400 font-medium">{new Date(q.expiresAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></> : null}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => openRespondModal(q)}
              className="px-4 py-2 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors"
            >
              Send Quote
            </button>
          </div>
        </div>
      ))}

      {/* Table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center gap-4">
          <h2 className="text-white font-semibold text-sm shrink-0">All Requests</h2>
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
          <div className="text-center py-16 text-[#8A97AA] text-sm">No quote requests yet.</div>
        ) : (
          <div className="divide-y divide-[#1E2E48]">
            {quotes.map((q) => {
              const sc = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.pending
              return (
                <div key={q.id} className="px-5 py-4 bg-[#0D1E35] hover:bg-[#0F2240] transition-colors flex items-start gap-4 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">
                        {q.claimReference ?? `Quote #${q.id.slice(0, 8)}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${sc.cls}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-[#8A97AA] text-xs mt-1">
                      {q.items.map((i) => `${i.part.name} (${i.part.condition})`).join(' · ')}
                    </p>
                    <p className="text-[#8A97AA] text-xs mt-0.5">
                      From: {q.requester.name ?? q.requester.email} · Received {new Date(q.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {q.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => openRespondModal(q)}
                      className="text-xs font-semibold text-[#F5A623] hover:underline shrink-0"
                    >
                      Respond →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center py-4 border-t border-[#1E2E48]">
            <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loadingMore && hasMore && (
          <div className="border-t border-[#1E2E48] px-6 py-3">
            <button
              onClick={loadMore}
              className="w-full py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] hover:text-[#E8ECF1] hover:border-[#2D4163] text-xs font-medium transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Respond modal */}
      {respondModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Send Quote</h2>
              <button type="button" onClick={() => setRespondModal(null)} className="text-[#8A97AA] hover:text-white">✕</button>
            </div>

            <p className="text-[#8A97AA] text-sm">
              From: {respondModal.requester.name ?? respondModal.requester.email}
              {respondModal.claimReference ? ` · ${respondModal.claimReference}` : ''}
            </p>

            <div className="space-y-4">
              {formItems.map((item, idx) => (
                <div key={item.quoteItemId} className="rounded-xl border border-[#1E2E48] p-4 space-y-3">
                  <p className="text-white text-sm font-semibold">{item.partName}</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[#8A97AA] text-xs block mb-1">Your Price</label>
                      <input
                        type="number"
                        className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]"
                        value={item.price}
                        onChange={(e) => setFormItems((prev) => prev.map((f, i) => i === idx ? { ...f, price: e.target.value } : f))}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[#8A97AA] text-xs block mb-1">Currency</label>
                      <input
                        type="text"
                        maxLength={3}
                        className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623] uppercase"
                        value={item.currency}
                        onChange={(e) => setFormItems((prev) => prev.map((f, i) => i === idx ? { ...f, currency: e.target.value.toUpperCase() } : f))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[#8A97AA] text-xs block mb-1">Note (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. OEM part, 2-day lead time"
                      className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623] placeholder-[#8A97AA]"
                      value={item.note}
                      onChange={(e) => setFormItems((prev) => prev.map((f, i) => i === idx ? { ...f, note: e.target.value } : f))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRespondModal(null)}
                className="flex-1 py-3 rounded-xl border border-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRespond}
                disabled={submitting}
                className="flex-[2] py-3 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
