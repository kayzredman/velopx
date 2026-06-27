'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface OrderItem {
  id: string
  quantity: number
  price: string
  part: { id: string; name: string; oemNumber: string | null; condition: string }
}

interface Order {
  id: string
  status: string
  totalAmount: string
  currency: string
  claimReference: string | null
  createdAt: string
  items: OrderItem[]
  delivery: { id: string; status: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  confirmed:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  dispatched: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  delivered:  'bg-green-500/15 text-green-400 border border-green-500/30',
  completed:  'bg-green-500/15 text-green-400 border border-green-500/30',
  disputed:   'bg-red-500/15 text-red-400 border border-red-500/30',
  cancelled:  'bg-red-500/15 text-red-400 border border-red-500/30',
}

type TabFilter = 'all' | 'pending' | 'active' | 'delivered' | 'disputed'

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'active',    label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'disputed',  label: 'Disputed' },
]

const LIMIT = 20

export default function GarageOrders() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [orders, setOrders]         = useState<Order[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]       = useState(false)
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [query, setQuery]           = useState('')
  const [tab, setTab]               = useState<TabFilter>('all')

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchOrders = useCallback(async (t: TabFilter, q: string, pg: number, append: boolean) => {
    if (pg === 1 && !append) setLoading(true)
    else setLoadingMore(true)
    try {
      const token = await getToken()
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(pg) })
      if (q.trim()) params.set('q', q.trim())
      if (t !== 'all') params.set('tab', t)
      const res = await fetch(`${API_URL}/v1/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Order[]; meta: { total: number; pages: number } }
      setOrders((prev) => append ? [...prev, ...json.data] : json.data)
      setTotal(json.meta.total)
      setHasMore(pg < json.meta.pages)
      setPage(pg)
    } catch { /* keep existing */ } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getToken, API_URL])

  useEffect(() => {
    fetchOrders('all', '', 1, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(q: string) {
    setQuery(q)
    fetchOrders(tab, q, 1, false)
  }

  function handleTab(t: TabFilter) {
    setTab(t)
    fetchOrders(t, query, 1, false)
  }

  function loadMore() {
    fetchOrders(tab, query, page + 1, true)
  }

  const active    = orders.filter((o) => !['delivered', 'completed', 'cancelled'].includes(o.status)).length
  const delivered = orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length
  const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0)
  const currency = orders[0]?.currency ?? 'GHS'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Orders</h1>
          <p className="text-sm text-[#8A97AA] mt-1">Parts ordered by your workshop</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Orders',         value: active.toString(),                                              highlight: 'blue' },
          { label: 'Delivered',             value: delivered.toString(),                                           highlight: 'green' },
          { label: 'Total Spend',           value: `${currency} ${totalSpend.toLocaleString()}`,                   highlight: '' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === 'blue' ? 'text-blue-400' : s.highlight === 'green' ? 'text-green-400' : 'text-white'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
        {/* Tabs + search header */}
        <div className="px-5 py-2.5 bg-[#0A1628] border-b border-[#1E2E48] flex items-center gap-1 flex-wrap">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                tab === key
                  ? 'bg-[#F5A623] text-[#060F1E]'
                  : 'text-[#8A97AA] hover:text-[#E8ECF1]'
              }`}
            >
              {label}
              {tab === key && !loading && total > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  key === 'pending'   ? 'bg-amber-500 text-[#0A1628]' :
                  key === 'active'    ? 'bg-green-500 text-[#0A1628]' :
                  key === 'disputed'  ? 'bg-red-500 text-white' :
                  key === 'delivered' ? 'bg-green-500 text-[#0A1628]' :
                  'bg-white/25 text-inherit'
                }`}>{total}</span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by claim reference…"
            className="bg-[#0C1526] border border-[#1E2E48] rounded-lg px-3 py-1.5 text-[#E8ECF1] text-xs placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623] w-52"
          />
          <span className="text-[#8A97AA] text-xs shrink-0">{loading ? '…' : `${total} total`}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-[#8A97AA] text-sm">No orders yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['ORDER', 'PARTS', 'TOTAL', 'ORDERED', 'DELIVERY', 'STATUS'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const badge = STATUS_BADGE[o.status] ?? STATUS_BADGE.pending
                return (
                  <tr key={o.id} onClick={() => router.push(`/garage/orders/${o.id}`)} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors cursor-pointer">
                    <td className="px-5 py-4 text-[#F5A623] font-mono text-xs font-semibold whitespace-nowrap">
                      {o.id.slice(0, 8).toUpperCase()}
                      {o.claimReference && <p className="text-[#8A97AA] font-sans font-normal mt-0.5">{o.claimReference}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {o.items.map((i) => (
                        <p key={i.id} className="text-white text-xs">{i.part.name} ×{i.quantity}</p>
                      ))}
                      {o.items[0]?.part.oemNumber && (
                        <p className="text-[#8A97AA] font-mono text-xs mt-0.5">{o.items[0].part.oemNumber}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-white font-mono font-semibold whitespace-nowrap">
                      {o.currency} {Number(o.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs capitalize">
                      {o.delivery ? o.delivery.status.replace('_', ' ') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                        {o.status.toUpperCase()}
                      </span>
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
