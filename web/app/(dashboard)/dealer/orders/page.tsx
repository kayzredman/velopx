'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface OrderItem {
  id: string
  quantity: number
  price: string
  part: { id: string; name: string }
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
  buyer?: { id: string; name: string | null; email: string }
}

type ViewMode = 'buyer' | 'seller'
type TabFilter = 'all' | 'pending' | 'active' | 'delivered' | 'disputed'

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'active',    label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'disputed',  label: 'Disputed' },
]

const STATUS_COLOURS: Record<string, string> = {
  pending:    'bg-[#F59E0B]/10 text-[#F59E0B]',
  confirmed:  'bg-[#3B82F6]/10 text-[#3B82F6]',
  dispatched: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  delivered:  'bg-[#22C55E]/10 text-[#22C55E]',
  completed:  'bg-[#22C55E]/10 text-[#22C55E]',
  cancelled:  'bg-[#EF4444]/10 text-[#EF4444]',
  disputed:   'bg-[#EF4444]/10 text-[#EF4444]',
}

export default function OrdersPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('seller')
  const [tab, setTab]   = useState<TabFilter>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async (v: ViewMode, t: TabFilter, q: string, pg: number, append: boolean) => {
    try {
      const token = await getToken()
      const params = new URLSearchParams({ limit: '20', page: String(pg) })
      if (v === 'seller') params.set('view', 'seller')
      if (q.trim()) params.set('q', q.trim())
      if (t !== 'all') params.set('tab', t)
      const res = await fetch(`${API_URL}/v1/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json() as { data: Order[]; meta: { total: number; page: number; pages: number } }
      setTotal(json.meta.total)
      setHasMore(json.meta.page < json.meta.pages)
      setPage(json.meta.page)
      if (append) {
        setOrders((prev) => [...prev, ...json.data])
      } else {
        setOrders(json.data)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [getToken])

  useEffect(() => {
    setLoading(true)
    setQuery('')
    setTab('all')
    fetchOrders(view, 'all', '', 1, false).finally(() => setLoading(false))
  }, [fetchOrders, view])

  function handleSearch(q: string) {
    setQuery(q)
    setLoading(true)
    fetchOrders(view, tab, q, 1, false).finally(() => setLoading(false))
  }

  function handleTab(t: TabFilter) {
    setTab(t)
    setLoading(true)
    fetchOrders(view, t, query, 1, false).finally(() => setLoading(false))
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    await fetchOrders(view, tab, query, page + 1, true)
    setLoadingMore(false)
  }

  async function handleConfirm(id: string) {
    setUpdatingId(id)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/orders/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'confirmed' } : o)))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Orders</h1>
        {error && <p className="text-xs text-red-400 mt-1 font-mono">{error}</p>}
      </div>

      {/* Controls: toggle + search + count */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-[#0C1526] border border-[#1E2E48] rounded-xl">
          {(['seller', 'buyer'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                view === v
                  ? 'bg-[#F97316] text-[#0A1628]'
                  : 'text-[#8A97AA] hover:text-[#E8ECF1]'
              }`}
            >
              {v === 'buyer' ? 'My Orders' : 'Incoming'}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by claim reference…"
          className="flex-1 min-w-[180px] bg-[#0C1526] border border-[#1E2E48] rounded-lg px-4 py-2 text-[#E8ECF1] text-sm placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
        />
        <span className="text-[#8A97AA] text-sm shrink-0">{loading ? '…' : `${total} total`}</span>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 bg-[#0C1526] border border-[#1E2E48] rounded-xl w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              tab === key
                ? 'bg-[#F97316] text-[#0A1628]'
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
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-12 text-center">
          <p className="text-[#8A97AA] text-sm">Loading…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-12 text-center">
          <p className="text-[#8A97AA]">
            {view === 'seller' ? 'No incoming orders for your parts yet.' : 'No orders yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5 space-y-3 cursor-pointer hover:border-[#2D4163] transition-colors"
              onClick={() => router.push(`/dealer/orders/${order.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#E8ECF1] font-semibold text-base">
                      {order.currency} {Number(order.totalAmount).toLocaleString()}
                    </span>
                    {order.claimReference && (
                      <span className="text-xs text-[#8A97AA] bg-[#111E34] px-2 py-0.5 rounded">
                        {order.claimReference}
                      </span>
                    )}
                  </div>
                  {view === 'seller' && order.buyer && (
                    <p className="text-xs text-[#8A97AA] mt-0.5">
                      From: {order.buyer.name ?? order.buyer.email}
                    </p>
                  )}
                  <p className="text-[#8A97AA] text-xs mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {' · '}
                    {order.items.map((i) => `${i.part.name} ×${i.quantity}`).join('  ·  ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {order.delivery && (
                    <span className="text-xs text-[#8A97AA] bg-[#111E34] px-2 py-0.5 rounded capitalize">
                      {order.delivery.status.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLOURS[order.status] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {order.status === 'pending' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleConfirm(order.id) }}
                  disabled={updatingId === order.id}
                  className="w-full py-2 rounded-lg bg-[#F97316] text-[#0A1628] text-sm font-bold hover:bg-[#EA6C0A] disabled:opacity-50 transition-colors"
                >
                  {updatingId === order.id ? 'Confirming…' : 'Confirm Order'}
                </button>
              )}
            </div>
          ))}

          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
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
      )}
    </div>
  )
}
