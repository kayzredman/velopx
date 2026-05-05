'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface DeliveryOrder {
  id: string
  claimReference: string | null
  currency: string
  totalAmount: string
  items: { part: { id: string; name: string; oemNumber: string | null } }[]
}

interface Delivery {
  id: string
  status: string
  driverLat: number | null
  driverLng: number | null
  collectedAt: string | null
  deliveredAt: string | null
  createdAt: string
  driver: { id: string; name: string | null; email: string } | null
  order: DeliveryOrder
}

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  assigned:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  collected:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  in_transit: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  delivered:  'bg-green-500/15 text-green-400 border border-green-500/30',
  confirmed:  'bg-green-500/15 text-green-400 border border-green-500/30',
  disputed:   'bg-red-500/15 text-red-400 border border-red-500/30',
}

const STATUS_LABEL: Record<string, string> = {
  pending:    'PENDING',
  assigned:   'PENDING PICKUP',
  collected:  'COLLECTED',
  in_transit: 'IN TRANSIT',
  delivered:  'DELIVERED',
  confirmed:  'CONFIRMED',
  disputed:   'DISPUTED',
}

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'En Route' },
  { key: 'waiting',   label: 'Waiting' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'disputed',  label: 'Disputed' },
] as const
type FilterKey = typeof FILTER_TABS[number]['key']

export default function GarageDeliveries() {
  const { getToken } = useAuth()
  const [deliveries, setDeliveries]         = useState<Delivery[]>([])
  const [loading, setLoading]               = useState(true)
  const [updatingId, setUpdatingId]         = useState<string | null>(null)
  const [disputeModal, setDisputeModal]     = useState<string | null>(null)
  const [disputeNote, setDisputeNote]       = useState('')
  const [search, setSearch]                 = useState('')
  const [filter, setFilter]                 = useState<FilterKey>('all')

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchDeliveries = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Delivery[] }
      setDeliveries(json.data)
    } catch { /* keep existing */ }
  }, [getToken, API_URL])

  useEffect(() => {
    fetchDeliveries().finally(() => setLoading(false))
  }, [fetchDeliveries])

  async function handleConfirm(id: string) {
    setUpdatingId(id)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      if (!res.ok) return
      setDeliveries((prev) => prev.map((d) => d.id === id ? { ...d, status: 'confirmed' } : d))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDispute(id: string, note: string) {
    setUpdatingId(id)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disputed', note }),
      })
      if (!res.ok) return
      setDeliveries((prev) => prev.map((d) => d.id === id ? { ...d, status: 'disputed' } : d))
      setDisputeModal(null)
      setDisputeNote('')
    } finally {
      setUpdatingId(null)
    }
  }

  const inTransit     = deliveries.filter((d) => ['in_transit', 'collected'].includes(d.status)).length
  const awaitDispatch = deliveries.filter((d) => ['assigned', 'pending'].includes(d.status)).length
  const deliveredCnt  = deliveries.filter((d) => ['delivered', 'confirmed'].includes(d.status)).length

  const filtered = useMemo(() => {
    let list = deliveries
    if (filter === 'active')    list = list.filter((d) => ['in_transit', 'collected'].includes(d.status))
    if (filter === 'waiting')   list = list.filter((d) => ['assigned', 'pending'].includes(d.status))
    if (filter === 'delivered') list = list.filter((d) => ['delivered', 'confirmed'].includes(d.status))
    if (filter === 'disputed')  list = list.filter((d) => d.status === 'disputed')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((d) =>
        d.order.claimReference?.toLowerCase().includes(q) ||
        d.order.id.toLowerCase().includes(q) ||
        (d.driver?.name ?? d.driver?.email ?? '').toLowerCase().includes(q) ||
        d.order.items.some((i) => i.part.name.toLowerCase().includes(q) || i.part.oemNumber?.toLowerCase().includes(q)),
      )
    }
    return list
  }, [deliveries, filter, search])

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Deliveries</h1>
          <p className="text-sm text-[#8A97AA] mt-1">Inbound parts deliveries to your workshop</p>
        </div>
        <button
          type="button"
          onClick={fetchDeliveries}
          className="px-4 py-2 rounded-lg bg-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:bg-[#243655] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En Route',          value: inTransit.toString(),     highlight: 'blue' },
          { label: 'Awaiting Dispatch', value: awaitDispatch.toString(), highlight: 'amber' },
          { label: 'Delivered',         value: deliveredCnt.toString(),  highlight: 'green' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === 'blue' ? 'text-blue-400' : s.highlight === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + filter toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A97AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by part name, OEM number, driver, ref…"
            className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]/50"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A97AA] hover:text-white text-xs">✕</button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === tab.key
                    ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                    : 'text-[#8A97AA] hover:text-white hover:bg-[#1E2E48]'
                }`}
              >
                {tab.label}
                {tab.key === 'active' && inTransit > 0 && (
                  <span className="ml-1.5 bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">{inTransit}</span>
                )}
                {tab.key === 'waiting' && awaitDispatch > 0 && (
                  <span className="ml-1.5 bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full">{awaitDispatch}</span>
                )}
              </button>
            ))}
          </div>
          <span className="text-[#8A97AA] text-xs">{filtered.length} shown</span>
        </div>
      </div>

      {/* Delivery cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8A97AA] text-sm">
          {deliveries.length === 0 ? 'No deliveries yet.' : 'No deliveries match your search.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.pending
            const label = STATUS_LABEL[d.status] ?? d.status.replace('_', ' ').toUpperCase()
            const isActive = !['delivered', 'confirmed', 'disputed'].includes(d.status)
            const partNames = d.order.items.map((i) => i.part.name).join(', ')
            return (
              <div
                key={d.id}
                className={`bg-[#0D1E35] border rounded-xl p-5 transition-colors ${
                  isActive ? 'border-[#1E2E48] hover:border-[#2a3e5c]' : 'border-[#1E2E48] opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: part info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[#F5A623] font-mono text-xs font-semibold">
                        {d.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[#8A97AA] text-xs">·</span>
                      <span className="text-[#8A97AA] text-xs font-mono">{d.order.id.slice(0, 8).toUpperCase()}</span>
                      {d.order.claimReference && (
                        <span className="text-[#8A97AA] text-xs">{d.order.claimReference}</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                    </div>
                    <p className="text-white font-medium mt-2">{partNames}</p>
                    {d.order.items[0]?.part.oemNumber && (
                      <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{d.order.items[0].part.oemNumber}</p>
                    )}
                    <p className="text-xs text-[#8A97AA] mt-0.5">
                      {d.order.currency} {Number(d.order.totalAmount).toLocaleString()}
                    </p>
                  </div>

                  {/* Right: driver + dates */}
                  <div className="text-right shrink-0">
                    {d.driver ? (
                      <>
                        <p className="text-white text-sm font-medium">{d.driver.name ?? d.driver.email}</p>
                        <p className="text-xs text-[#8A97AA]">Driver</p>
                      </>
                    ) : (
                      <p className="text-[#8A97AA] text-xs">No driver assigned</p>
                    )}
                    {d.deliveredAt && (
                      <p className="text-xs text-[#8A97AA] mt-2">
                        Delivered: <span className="text-white">{new Date(d.deliveredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </p>
                    )}
                    {!d.deliveredAt && d.collectedAt && (
                      <p className="text-xs text-[#8A97AA] mt-2">
                        Picked up: <span className="text-white">{new Date(d.collectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* GPS row for active deliveries */}
                {isActive && (
                  <div className="mt-4 pt-4 border-t border-[#1E2E48] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#8A97AA]">
                      <svg className="text-blue-400 w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <circle cx="12" cy="10" r="3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
                      </svg>
                      {d.driverLat && d.driverLng
                        ? <span className="text-blue-300">{d.driverLat.toFixed(4)}, {d.driverLng.toFixed(4)}</span>
                        : 'Location not yet available'}
                    </div>
                    <p className="text-xs text-[#8A97AA]">
                      {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {/* Confirm / Dispute row — only when driver has delivered */}
                {d.status === 'delivered' && (
                  <div className="mt-4 pt-4 border-t border-[#1E2E48] flex gap-3">
                    <button
                      onClick={() => handleConfirm(d.id)}
                      disabled={updatingId === d.id}
                      className="flex-1 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-semibold hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                    >
                      {updatingId === d.id ? 'Confirming…' : 'Confirm Receipt'}
                    </button>
                    <button
                      onClick={() => { setDisputeModal(d.id); setDisputeNote('') }}
                      disabled={updatingId === d.id}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      Dispute
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dispute modal */}
      {disputeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setDisputeModal(null)}
        >
          <div
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-lg mb-4">Raise Dispute</h2>
            <label className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Reason</label>
            <textarea
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              placeholder="Describe the issue with this delivery…"
              rows={3}
              className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setDisputeModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:bg-[#1E2E48] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDispute(disputeModal, disputeNote)}
                disabled={!disputeNote.trim() || updatingId === disputeModal}
                className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
              >
                {updatingId === disputeModal ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

