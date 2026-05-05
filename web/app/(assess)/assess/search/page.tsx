'use client'

import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Part {
  id: string
  name: string
  oemNumber: string | null
  condition: string
  price: string
  currency: string
  stockStatus: string
  attributes: Record<string, unknown>
  dealer: { id: string; name: string | null; email: string }
}

interface Group {
  key: string      // oemNumber or name
  name: string
  oemNumber: string | null
  condition: string
  currency: string
  low: number
  avg: number
  high: number
  sources: number
  vehicle: string
}

const COND_BADGE: Record<string, string> = {
  oem:         'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  used:        'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  aftermarket: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
}

const COND_LABEL: Record<string, string> = {
  oem: 'OEM', used: 'Used', aftermarket: 'Aftermarket',
}

const FILTERS = [
  { label: 'All Conditions', value: '' },
  { label: 'OEM Only',       value: 'oem' },
  { label: 'Used Only',      value: 'used' },
  { label: 'Aftermarket',    value: 'aftermarket' },
]

function groupParts(parts: Part[]): Group[] {
  const map = new Map<string, Part[]>()
  for (const p of parts) {
    const key = p.oemNumber ?? p.name
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  const groups: Group[] = []
  for (const [key, list] of map) {
    const prices = list.map((p) => Number(p.price))
    const low  = Math.min(...prices)
    const high = Math.max(...prices)
    const avg  = prices.reduce((a, b) => a + b, 0) / prices.length
    const ref  = list[0]
    const attrs = ref.attributes as Record<string, string>
    const vehicle = [attrs.make, attrs.model, attrs.year].filter(Boolean).join(' ')
    groups.push({
      key,
      name:      ref.name,
      oemNumber: ref.oemNumber,
      condition: ref.condition,
      currency:  ref.currency,
      low, avg, high,
      sources:   list.length,
      vehicle,
    })
  }
  return groups
}

export default function AssessPartSearch() {
  const { getToken } = useAuth()
  const [query, setQuery]       = useState('')
  const [condition, setCondition] = useState('')
  const [groups, setGroups]     = useState<Group[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const search = useCallback(async (q: string, cond: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const token = await getToken()
      const params = new URLSearchParams({ q: q.trim() })
      if (cond) params.set('condition', cond)
      const res = await fetch(`${API_URL}/v1/parts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Part[] }
      setGroups(groupParts(json.data))
      setSearched(true)
    } catch { /* keep */ } finally {
      setLoading(false)
    }
  }, [getToken, API_URL])

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Part Price Search</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Benchmark any part against live dealer market data</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A97AA]" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') search(query, condition) }}
            placeholder="e.g. Toyota Corolla 2019 front bumper"
            className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
          />
        </div>
        <select
          value={condition}
          onChange={(e) => { setCondition(e.target.value); if (query) search(query, e.target.value) }}
          className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
        >
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button
          type="button"
          onClick={() => search(query, condition)}
          disabled={loading}
          className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Results table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : searched && groups.length === 0 ? (
        <div className="text-center py-16 text-[#8A97AA] text-sm">No parts found for your search.</div>
      ) : groups.length > 0 ? (
        <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2E48] flex items-center justify-between">
            <span className="text-sm font-medium text-white">{groups.length} result{groups.length !== 1 ? 's' : ''}</span>
            <span className="text-xs text-[#8A97AA]">Prices in GHS · Live market data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2E48]">
                  {['PART / OEM NO.', 'VEHICLE', 'COND.', 'SOURCES', 'DEALER LOW', 'DEALER AVG', 'DEALER HIGH', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.key} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{g.name}</p>
                      {g.oemNumber && <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{g.oemNumber}</p>}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA]">{g.vehicle || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COND_BADGE[g.condition] ?? ''}`}>
                        {COND_LABEL[g.condition] ?? g.condition}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA]">{g.sources}</td>
                    <td className="px-5 py-4 text-green-400 font-mono">{Math.round(g.low).toLocaleString()}</td>
                    <td className="px-5 py-4 text-white font-mono font-semibold">{Math.round(g.avg).toLocaleString()}</td>
                    <td className="px-5 py-4 text-red-400 font-mono">{Math.round(g.high).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <button type="button" className="text-xs text-[#F5A623] hover:text-[#e09520] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Use as benchmark →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl flex items-center justify-center py-16 text-[#8A97AA] text-sm">
          Enter a part name or OEM number above and press Search.
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <svg className="text-blue-400 mt-0.5 shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <p className="text-xs text-blue-300 leading-relaxed">
          Benchmark prices are aggregated from verified dealer listings across the VelopX marketplace.
          Low / Avg / High represent the min, mean and max of active listings for this part.
        </p>
      </div>
    </div>
  )
}
