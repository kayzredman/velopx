'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface TopPart {
  partId: string
  name: string
  oemNumber: string | null
  currency: string
  orderCount: number
  totalRevenue: number
}

interface AnalyticsData {
  revenueMtd: number
  revenueAllTime: number
  ordersMtd: number
  ordersToday: number
  avgOrderValue: number
  quoteWinRate: number
  ordersByStatus: Record<string, number>
  topParts: TopPart[]
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

function fmt(n: number, currency = 'GHS'): string {
  if (n >= 1000) return `${currency} ${(n / 1000).toFixed(1)}k`
  return `${currency} ${n.toLocaleString()}`
}

export default function AnalyticsPage() {
  const { getToken } = useAuth()
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/analytics/dealer`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch { /* degrade gracefully */ }
    finally { setLoading(false) }
  }, [getToken, API_URL])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const monthlyRevenue = data?.monthlyRevenue ?? []
  const maxVal = Math.max(...monthlyRevenue.map((m) => m.revenue), 1)
  const currentMonth = new Date().toLocaleString('default', { month: 'short' })

  const topParts = data?.topParts ?? []

  const kpis = data
    ? [
        { label: 'Revenue MTD',    val: fmt(data.revenueMtd),            delta: null },
        { label: 'Orders MTD',     val: String(data.ordersMtd),          delta: null },
        { label: 'Avg Order Value',val: fmt(data.avgOrderValue),         delta: null },
        { label: 'Quote Win Rate', val: `${data.quoteWinRate}%`,         delta: null },
      ]
    : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-[#8A97AA] text-sm mt-1">Performance overview — your parts business</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5 animate-pulse">
                <div className="h-3 bg-[#1E2E48] rounded w-24 mb-3" />
                <div className="h-7 bg-[#1E2E48] rounded w-16 mb-2" />
              </div>
            ))
          : kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
                <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{k.label}</p>
                <p className="text-2xl font-bold text-white">{k.val}</p>
              </div>
            ))}
      </div>

      {/* Revenue bar chart */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-6">Monthly Revenue (GHS)</h2>
        {loading ? (
          <div className="flex items-end gap-4 h-40 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-[#1E2E48] rounded-t-md" style={{ height: `${30 + i * 10}%` }} />
              </div>
            ))}
          </div>
        ) : monthlyRevenue.length === 0 ? (
          <p className="text-[#8A97AA] text-sm text-center py-10">No revenue data yet.</p>
        ) : (
          <div className="flex items-end gap-4 h-40">
            {monthlyRevenue.map((m) => {
              const height = Math.max(Math.round((m.revenue / maxVal) * 100), 2)
              const isCurrent = m.month === currentMonth
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[#8A97AA] text-xs">
                    {m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(1)}k` : m.revenue > 0 ? String(m.revenue) : '—'}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-[#F5A623]' : 'bg-[#1E2E48] hover:bg-[#2a3f5c]'}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className={`text-xs font-medium ${isCurrent ? 'text-amber-400' : 'text-[#8A97AA]'}`}>{m.month}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top parts table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48]">
          <h2 className="text-white font-semibold text-sm">Top Performing Parts</h2>
        </div>
        {loading ? (
          <div className="divide-y divide-[#1E2E48]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                <div className="h-4 bg-[#1E2E48] rounded flex-1" />
                <div className="h-4 bg-[#1E2E48] rounded w-10" />
                <div className="h-4 bg-[#1E2E48] rounded w-24" />
              </div>
            ))}
          </div>
        ) : topParts.length === 0 ? (
          <p className="px-6 py-8 text-[#8A97AA] text-sm text-center">No sales data yet.</p>
        ) : (
          <div className="grid grid-cols-[2fr_80px_1fr] gap-0">
            {['PART NAME', 'ORDERS', 'REVENUE'].map((h) => (
              <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
                {h}
              </div>
            ))}
            {topParts.map((p, i) => {
              const isLast = i === topParts.length - 1
              const border = isLast ? '' : 'border-b border-[#1E2E48]'
              return (
                <div key={p.partId} className="contents group">
                  <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    <span className="text-white text-sm">{p.name}</span>
                  </div>
                  <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    <span className="text-white text-sm font-medium">{p.orderCount}</span>
                  </div>
                  <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    <span className="text-amber-400 text-sm font-semibold">{fmt(p.totalRevenue, p.currency)}</span>
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
