'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Part {
  id: string
  name: string
  oemNumber: string | null
  condition: string
  price: string
  currency: string
  stockStatus: string
  dealer: { id: string; name: string }
}

const COND_BADGE: Record<string, string> = {
  oem:         'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  used:        'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  aftermarket: 'bg-white/5 text-[#8A97AA] border border-white/10',
}

const FILTERS = [
  { label: 'All',         value: '' },
  { label: 'OEM',         value: 'oem' },
  { label: 'Used',        value: 'used' },
  { label: 'Aftermarket', value: 'aftermarket' },
]

export default function GarageSearchPage() {
  const { getToken } = useAuth()
  const [query, setQuery]         = useState('')
  const [condition, setCondition] = useState('')
  const [parts, setParts]         = useState<Part[]>([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const [rfqPart, setRfqPart]     = useState<Part | null>(null)
  const [rfqNote, setRfqNote]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const search = useCallback(async (q: string, cond: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (cond)     params.set('condition', cond)
      const res = await fetch(`${API_URL}/v1/parts?${params}`)
      if (!res.ok) return
      const json = await res.json() as { data: Part[] }
      setParts(json.data)
      setSearched(true)
    } catch { /* keep existing */ }
    finally { setLoading(false) }
  }, [API_URL])

  // Search when filter changes (if already searched)
  useEffect(() => {
    if (searched) search(query, condition)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition])

  async function handleRFQ() {
    if (!rfqPart) return
    setSubmitting(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/quotes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ partId: rfqPart.id, price: Number(rfqPart.price), currency: rfqPart.currency, note: rfqNote.trim() || undefined }],
        }),
      })
      if (res.ok) {
        setRfqPart(null)
        setRfqNote('')
      }
    } catch { /* noop */ }
    finally { setSubmitting(false) }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Find Parts</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Search the VelopX catalogue or send an RFQ to multiple dealers</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5068]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(query, condition)}
            placeholder="Search by part name, OEM number..."
            className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 transition-colors placeholder:text-[#3D5068]"
          />
        </div>
        <button
          type="button"
          onClick={() => search(query, condition)}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors disabled:opacity-50"
        >
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#8A97AA] text-xs">Condition:</span>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setCondition(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              condition === f.value
                ? 'bg-[#F5A623]/10 text-amber-400 border border-amber-500/30'
                : 'border border-[#1E2E48] text-[#8A97AA] hover:border-white/20 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
        {searched && <span className="ml-auto text-[#8A97AA] text-xs">{parts.length} result{parts.length !== 1 ? 's' : ''}</span>}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && parts.length === 0 && (
        <div className="text-center py-16 text-[#8A97AA] text-sm">No parts found. Try a different search term.</div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16 text-[#8A97AA] text-sm">Search for a part name or OEM number above.</div>
      )}

      {!loading && parts.length > 0 && (
        <div className="flex flex-col gap-3">
          {parts.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] hover:bg-[#0F2240] transition-colors p-5 flex items-center gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-white text-sm font-semibold">{p.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide ${COND_BADGE[p.condition] ?? COND_BADGE.aftermarket}`}>
                    {p.condition.toUpperCase()}
                  </span>
                  {p.stockStatus === 'out_of_stock' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-red-500/10 text-red-400 border border-red-500/20">
                      OUT OF STOCK
                    </span>
                  )}
                </div>
                {p.oemNumber && <p className="text-[#8A97AA] text-xs font-mono">{p.oemNumber}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#8A97AA] text-xs">{p.dealer.name}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-amber-400 text-lg font-bold">{p.currency} {Number(p.price).toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setRfqPart(p); setRfqNote('') }}
                  className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-xs font-medium hover:border-white/20 hover:text-white transition-colors"
                >
                  Request Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RFQ modal */}
      {rfqPart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Request Quote</h2>
              <button type="button" onClick={() => setRfqPart(null)} className="text-[#8A97AA] hover:text-white">✕</button>
            </div>
            <div className="rounded-xl border border-[#1E2E48] bg-[#0A1628] p-4">
              <p className="text-white font-semibold text-sm">{rfqPart.name}</p>
              {rfqPart.oemNumber && <p className="text-[#8A97AA] text-xs font-mono mt-0.5">{rfqPart.oemNumber}</p>}
              <p className="text-[#8A97AA] text-xs mt-0.5">{rfqPart.dealer.name} · Listed at {rfqPart.currency} {Number(rfqPart.price).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-[#8A97AA] text-xs block mb-1">Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. Need urgent delivery, specific fitment..."
                className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623] placeholder-[#8A97AA]"
                value={rfqNote}
                onChange={(e) => setRfqNote(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRfqPart(null)} className="flex-1 py-3 rounded-xl border border-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:border-white/20 transition-colors">Cancel</button>
              <button type="button" onClick={handleRFQ} disabled={submitting} className="flex-[2] py-3 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors disabled:opacity-50">
                {submitting ? 'Sending…' : 'Send RFQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
