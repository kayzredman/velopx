'use client'

import { useState, useCallback } from 'react'

interface Part {
  id: string
  name: string
  oemNumber: string | null
  price: string
  currency: string
  condition: string
  dealer?: { name: string } | null
  vehicleCompatibility: string[] | null
}

interface BenchmarkResult {
  partName:   string
  oemNumber:  string
  condition:  string
  makes:      string
  low:        number
  avg:        number
  high:       number
  count:      number
  currency:   string
  listings:   Part[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

function computeBenchmarks(parts: Part[]): BenchmarkResult[] {
  // Group by name + condition
  const groups = new Map<string, Part[]>()
  for (const p of parts) {
    const key = `${p.name.toLowerCase()}||${p.condition}`
    const g = groups.get(key) ?? []
    g.push(p)
    groups.set(key, g)
  }

  return Array.from(groups.entries()).map(([, listings]) => {
    const prices = listings.map((p) => Number(p.price)).filter((n) => !isNaN(n))
    const low    = Math.min(...prices)
    const high   = Math.max(...prices)
    const avg    = prices.reduce((s, n) => s + n, 0) / (prices.length || 1)
    const makes  = [...new Set(listings.flatMap((p) => p.vehicleCompatibility ?? []))].slice(0, 4).join(' / ') || '—'

    return {
      partName:  listings[0].name,
      oemNumber: listings[0].oemNumber ?? '—',
      condition: listings[0].condition,
      makes,
      low:   Math.round(low),
      avg:   Math.round(avg),
      high:  Math.round(high),
      count: listings.length,
      currency: listings[0].currency,
      listings,
    }
  })
}

const CONDITION_BADGE: Record<string, string> = {
  oem:        'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  aftermarket:'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  used:       'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}

export default function AssessBenchmarks() {
  const [query, setQuery]         = useState('')
  const [condition, setCondition] = useState('')
  const [results, setResults]     = useState<BenchmarkResult[]>([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)

  const search = useCallback(async (q: string, cond: string) => {
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (q)    params.set('q', q)
      if (cond) params.set('condition', cond)
      const res = await fetch(`${API_URL}/v1/parts?${params}`)
      if (!res.ok) return
      const json = await res.json() as { data: Part[] }
      setResults(computeBenchmarks(json.data))
    } catch { /* keep */ } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    void search(query, condition)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Benchmarks</h1>
        <p className="text-sm text-[#8A97AA] mt-1">
          Search live parts listings to benchmark invoice prices against market rates
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A97AA]" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. front bumper, alternator, brake pad…"
            className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]/50"
          />
        </div>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]/50"
        >
          <option value="">All Conditions</option>
          <option value="oem">OEM</option>
          <option value="aftermarket">Aftermarket</option>
          <option value="used">Used</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Results */}
      {!searched && (
        <div className="text-center py-16 text-[#8A97AA] text-sm">
          Enter a part name or OEM number to see live market benchmarks
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 text-[#8A97AA] text-sm">
          No listings found. Try a broader search term.
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#0D1E35] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1E2E48] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {results.length} part{results.length !== 1 ? 's' : ''} found
            </h2>
            <p className="text-xs text-[#8A97AA]">Prices from verified dealer listings</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['PART / OEM NO.', 'CONDITION', 'COMPATIBLE MAKES', 'MARKET LOW', 'MARKET AVG', 'MARKET HIGH', 'LISTINGS'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium">{r.partName}</p>
                    <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{r.oemNumber}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CONDITION_BADGE[r.condition] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                      {r.condition}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#8A97AA] text-xs max-w-[200px]">{r.makes}</td>
                  <td className="px-5 py-4 text-green-400 font-mono font-semibold">{r.currency} {r.low.toLocaleString()}</td>
                  <td className="px-5 py-4 text-white font-mono font-semibold">{r.currency} {r.avg.toLocaleString()}</td>
                  <td className="px-5 py-4 text-red-400 font-mono font-semibold">{r.currency} {r.high.toLocaleString()}</td>
                  <td className="px-5 py-4 text-[#8A97AA]">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
