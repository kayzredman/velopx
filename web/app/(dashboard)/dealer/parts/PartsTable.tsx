'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { PartRow } from './PartRow'
import { AddPartForm } from './AddPartForm'

interface Part {
  id: string
  name: string
  oemNumber: string | null
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited'
  images: string[]
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export function PartsTable() {
  const { getToken } = useAuth()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')

  const fetchParts = useCallback(async (q: string, pg: number, append: boolean) => {
    const params = new URLSearchParams({ mine: 'true', limit: '20', page: String(pg) })
    if (q.trim()) params.set('q', q.trim())
    const token = await getToken()
    const res = await fetch(`${API_URL}/v1/parts?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const json = await res.json() as { data: Part[]; meta: { total: number; page: number; pages: number } }
    setTotal(json.meta.total)
    setHasMore(json.meta.page < json.meta.pages)
    setPage(json.meta.page)
    if (append) {
      setParts((prev) => [...prev, ...json.data])
    } else {
      setParts(json.data)
    }
  }, [getToken])

  useEffect(() => {
    fetchParts('', 1, false).finally(() => setLoading(false))
  }, [fetchParts])

  function handleSearch(q: string) {
    setQuery(q)
    setLoading(true)
    fetchParts(q, 1, false).finally(() => setLoading(false))
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    await fetchParts(query, page + 1, true)
    setLoadingMore(false)
  }

  function handleDeleted(id: string) {
    setParts((prev) => prev.filter((p) => p.id !== id))
    setTotal((t) => t - 1)
  }

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or OEM number…"
          className="flex-1 bg-[#0C1526] border border-[#1E2E48] rounded-lg px-4 py-2 text-[#E8ECF1] text-sm placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
        />
        <AddPartForm onCreated={() => fetchParts(query, 1, false)} />
      </div>

      <p className="text-[#8A97AA] text-sm">
        {loading ? '…' : `${total} listing${total !== 1 ? 's' : ''}`}
      </p>

      {loading ? (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-12 text-center">
          <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : parts.length === 0 ? (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-12 text-center">
          <p className="text-[#8A97AA]">
            {query ? `No parts matching "${query}".` : 'No parts listed yet. Add your first part to get started.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['Part', 'Condition', 'Price', 'Stock', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#8A97AA] font-medium uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <PartRow key={part.id} part={part} onDeleted={handleDeleted} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loadingMore && hasMore && (
        <button
          onClick={loadMore}
          className="w-full py-2.5 rounded-xl border border-[#1E2E48] text-[#8A97AA] hover:text-[#E8ECF1] hover:border-[#2D4163] text-sm font-medium transition-colors"
        >
          Load More
        </button>
      )}
    </div>
  )
}
