'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface OrderItem {
  id: string
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
}

interface QuoteItem {
  id: string
  price: string
  currency: string
  part: { id: string; name: string; oemNumber: string | null }
}

interface Quote {
  id: string
  status: string
  claimReference: string | null
  createdAt: string
  items: QuoteItem[]
}

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  confirmed:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  dispatched: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  delivered:  'bg-green-500/15 text-green-400 border border-green-500/30',
  completed:  'bg-green-500/15 text-green-400 border border-green-500/30',
  disputed:   'bg-red-500/15 text-red-400 border border-red-500/30',
  cancelled:  'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]',
}

const QUOTE_STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  responded: 'bg-green-500/15 text-green-400 border border-green-500/30',
  accepted:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  declined:  'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]',
  expired:   'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]',
}

const QUOTE_STATUS_LABEL: Record<string, string> = {
  pending:   'AWAITING',
  responded: 'QUOTES IN',
  accepted:  'ORDERED',
  declined:  'DECLINED',
  expired:   'EXPIRED',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GarageDashboardPage() {
  const { getToken } = useAuth()

  const [recentOrders, setRecentOrders]           = useState<Order[]>([])
  const [openRfqs, setOpenRfqs]                   = useState<Quote[]>([])
  const [activeOrdersTotal, setActiveOrdersTotal] = useState(0)
  const [rfqsTotal, setRfqsTotal]                 = useState(0)
  const [jobCardsTotal, setJobCardsTotal]         = useState(0)
  const [deliveredTotal, setDeliveredTotal]       = useState(0)
  const [loading, setLoading]                     = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [ordersRes, activeRes, deliveredRes, quotesRes, jobCardsRes] = await Promise.all([
        fetch(`${API_URL}/v1/orders?limit=5`, { headers }),
        fetch(`${API_URL}/v1/orders?tab=active&limit=1`, { headers }),
        fetch(`${API_URL}/v1/orders?tab=delivered&limit=1`, { headers }),
        fetch(`${API_URL}/v1/quotes?limit=4`, { headers }),
        fetch(`${API_URL}/v1/job-cards?limit=1`, { headers }),
      ])
      if (ordersRes.ok)   { const j = await ordersRes.json();   setRecentOrders(j.data ?? []) }
      if (activeRes.ok)   { const j = await activeRes.json();   setActiveOrdersTotal(j.meta?.total ?? 0) }
      if (deliveredRes.ok){ const j = await deliveredRes.json(); setDeliveredTotal(j.meta?.total ?? 0) }
      if (quotesRes.ok)   { const j = await quotesRes.json();   setOpenRfqs(j.data ?? []); setRfqsTotal(j.meta?.total ?? 0) }
      if (jobCardsRes.ok) { const j = await jobCardsRes.json(); setJobCardsTotal(j.meta?.total ?? 0) }
    } catch { /* degrade gracefully */ }
    finally { setLoading(false) }
  }, [getToken, API_URL])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const kpis = [
    { label: 'Open RFQs',      val: rfqsTotal,         note: 'Awaiting quotes',  highlight: true },
    { label: 'Active Orders',  val: activeOrdersTotal, note: 'Parts inbound',    highlight: false },
    { label: 'Parts Received', val: deliveredTotal,    note: 'Delivered orders', highlight: false },
    { label: 'Open Job Cards', val: jobCardsTotal,     note: 'In progress',      highlight: false },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workshop Dashboard</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Overview of your workshop activity</p>
        </div>
        <a
          href="/garage/search"
          className="px-4 py-2.5 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find Parts
        </a>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5 animate-pulse">
                <div className="h-3 bg-[#1E2E48] rounded w-20 mb-3" />
                <div className="h-7 bg-[#1E2E48] rounded w-10 mb-2" />
                <div className="h-3 bg-[#1E2E48] rounded w-24" />
              </div>
            ))
          : kpis.map((k) => (
              <div
                key={k.label}
                className={`rounded-xl border p-5 ${k.highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#1E2E48] bg-[#0D1E35]'}`}
              >
                <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{k.label}</p>
                <p className={`text-2xl font-bold ${k.highlight ? 'text-amber-400' : 'text-white'}`}>{k.val}</p>
                <p className="text-[#8A97AA] text-xs mt-1">{k.note}</p>
              </div>
            ))}
      </div>

      {/* Open RFQs */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden mb-6">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Open RFQs</h2>
          <a href="/garage/rfqs" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</a>
        </div>
        {loading ? (
          <div className="divide-y divide-[#1E2E48]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-[#1E2E48] rounded w-40 mb-2" />
                  <div className="h-3 bg-[#1E2E48] rounded w-24" />
                </div>
                <div className="h-4 bg-[#1E2E48] rounded w-20" />
              </div>
            ))}
          </div>
        ) : openRfqs.length === 0 ? (
          <p className="px-6 py-8 text-[#8A97AA] text-sm text-center">
            No RFQs yet.{' '}
            <a href="/garage/search" className="text-amber-400 hover:underline">Search for parts</a>{' '}
            to request quotes.
          </p>
        ) : (
          <div className="divide-y divide-[#1E2E48]">
            {openRfqs.map((rfq) => {
              const partName = rfq.items[0]?.part.name ?? '—'
              const badge = QUOTE_STATUS_BADGE[rfq.status] ?? 'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]'
              const label = QUOTE_STATUS_LABEL[rfq.status] ?? rfq.status.toUpperCase()
              return (
                <div key={rfq.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#0F2240] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{partName}</span>
                      {rfq.items.length > 1 && (
                        <span className="text-[#8A97AA] text-xs">+{rfq.items.length - 1} more</span>
                      )}
                    </div>
                    <p className="text-[#8A97AA] text-xs mt-0.5 font-mono">
                      {rfq.claimReference ?? rfq.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${badge}`}>{label}</span>
                    <a
                      href="/garage/rfqs"
                      className="px-4 py-2 rounded-lg bg-[#F5A623] text-black text-xs font-bold hover:bg-[#d4911f] transition-colors"
                    >
                      View Quotes
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Recent Orders</h2>
          <a href="/garage/orders" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</a>
        </div>
        {loading ? (
          <div className="divide-y divide-[#1E2E48]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-[#1E2E48] rounded w-32 mb-2" />
                  <div className="h-3 bg-[#1E2E48] rounded w-20" />
                </div>
                <div className="h-4 bg-[#1E2E48] rounded w-16" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="px-6 py-8 text-[#8A97AA] text-sm text-center">No orders yet.</p>
        ) : (
          <div className="divide-y divide-[#1E2E48]">
            {recentOrders.map((order) => {
              const partName = order.items[0]?.part.name ?? '—'
              const badge = ORDER_STATUS_BADGE[order.status] ?? 'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]'
              const deliveryStatus = order.delivery?.status
              return (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#0F2240] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{partName}</span>
                      {order.items.length > 1 && (
                        <span className="text-[#8A97AA] text-xs">+{order.items.length - 1} more</span>
                      )}
                    </div>
                    <p className="text-[#8A97AA] text-xs mt-0.5 font-mono">
                      {order.claimReference ?? order.id.slice(0, 8)}
                      {deliveryStatus && (
                        <span className="ml-2">· {deliveryStatus.replace('_', ' ')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[#8A97AA] text-sm">
                      {order.currency} {order.totalAmount}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${badge}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
