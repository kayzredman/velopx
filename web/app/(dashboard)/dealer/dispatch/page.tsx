'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@clerk/nextjs'

const DeliveryMap = dynamic(() => import('./DeliveryMap'), {
  ssr: false,
  loading: () => <div className="h-full bg-[#0A1628] rounded-xl flex items-center justify-center text-[#8A97AA] text-sm">Loading map…</div>,
})

interface OrderItem {
  id: string
  quantity: number
  part: { id: string; name: string }
}

interface Delivery {
  id: string
  status: string
  createdAt: string
  driverLocation: { lat: number; lng: number } | null
  destination: { lat: number; lng: number; address?: string | null } | null
  source: { lat: number; lng: number; address?: string | null } | null
  driver: { id: string; name: string | null; email: string } | null
  order: {
    id: string
    claimReference: string | null
    totalAmount: string
    currency: string
    buyer: { id: string; name: string | null; email: string }
    items: OrderItem[]
  }
}

interface Driver {
  id: string
  name: string | null
  email: string
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'PENDING',    cls: 'bg-white/5 text-[#8A97AA] border border-white/10' },
  assigned:   { label: 'ASSIGNED',   cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  collected:  { label: 'COLLECTED',  cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  in_transit: { label: 'IN TRANSIT', cls: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  delivered:  { label: 'DELIVERED',  cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  confirmed:  { label: 'CONFIRMED',  cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  disputed:   { label: 'DISPUTED',   cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
}

const ACTIVE_STATUSES = ['assigned', 'collected', 'in_transit']

const FILTER_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'active',     label: 'Active' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'disputed',   label: 'Disputed' },
] as const
type FilterKey = typeof FILTER_TABS[number]['key']

export default function DispatchPage() {
  const { getToken } = useAuth()
  const [deliveries, setDeliveries]     = useState<Delivery[]>([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState<Delivery | null>(null)
  const [pollingId, setPollingId]       = useState<ReturnType<typeof setInterval> | null>(null)
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState<FilterKey>('all')

  // Assign driver modal state
  const [assignTarget, setAssignTarget]     = useState<Delivery | null>(null)
  const [drivers, setDrivers]               = useState<Driver[]>([])
  const [driversLoading, setDriversLoading] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<string>('')
  const [assigning, setAssigning]           = useState(false)
  const [assignError, setAssignError]       = useState<string | null>(null)

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

  const fetchSelected = useCallback(async (id: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Delivery }
      setSelected(json.data)
    } catch { /* keep existing */ }
  }, [getToken, API_URL])

  const openAssignModal = useCallback(async (delivery: Delivery) => {
    setAssignTarget(delivery)
    setSelectedDriver('')
    setAssignError(null)
    setDriversLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json() as { data: Driver[] }
        setDrivers(json.data)
      }
    } catch { /* ignore */ } finally {
      setDriversLoading(false)
    }
  }, [getToken, API_URL])

  const handleAssignDriver = useCallback(async () => {
    if (!assignTarget || !selectedDriver) return
    setAssigning(true)
    setAssignError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/${assignTarget.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'assigned', driverId: selectedDriver }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setAssignError(err.error ?? 'Failed to assign driver')
        return
      }
      const driver = drivers.find((d) => d.id === selectedDriver) ?? null
      setDeliveries((prev) => prev.map((d) =>
        d.id === assignTarget.id ? { ...d, status: 'assigned', driver: driver } : d,
      ))
      if (selected?.id === assignTarget.id) {
        setSelected((prev) => prev ? { ...prev, status: 'assigned', driver: driver } : prev)
      }
      setAssignTarget(null)
    } catch {
      setAssignError('Network error — please try again')
    } finally {
      setAssigning(false)
    }
  }, [assignTarget, selectedDriver, drivers, selected, getToken, API_URL])

  useEffect(() => {
    fetchDeliveries().finally(() => setLoading(false))
  }, [fetchDeliveries])

  // Poll selected delivery's GPS every 5s if it's active
  useEffect(() => {
    if (pollingId) clearInterval(pollingId)
    if (selected && ACTIVE_STATUSES.includes(selected.status)) {
      const id = setInterval(() => fetchSelected(selected.id), 5000)
      setPollingId(id)
      return () => clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.status])

  const filtered = useMemo(() => {
    let list = deliveries
    // Status filter
    if (filter === 'pending')   list = list.filter((d) => d.status === 'pending')
    if (filter === 'active')    list = list.filter((d) => ACTIVE_STATUSES.includes(d.status))
    if (filter === 'delivered') list = list.filter((d) => ['delivered', 'confirmed'].includes(d.status))
    if (filter === 'disputed')  list = list.filter((d) => d.status === 'disputed')
    // Search: claim ref, buyer, driver, part names
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((d) =>
        d.order.claimReference?.toLowerCase().includes(q) ||
        d.order.id.toLowerCase().includes(q) ||
        (d.order.buyer.name ?? d.order.buyer.email).toLowerCase().includes(q) ||
        (d.driver?.name ?? d.driver?.email ?? '').toLowerCase().includes(q) ||
        d.order.items.some((i) => i.part.name.toLowerCase().includes(q)),
      )
    }
    return list
  }, [deliveries, filter, search])

  const active    = deliveries.filter((d) => ACTIVE_STATUSES.includes(d.status))
  const delivered = deliveries.filter((d) => d.status === 'delivered' || d.status === 'confirmed')
  const pending   = deliveries.filter((d) => d.status === 'pending')

  const stats = [
    { label: 'Active Runs',    val: String(active.length),    note: 'In transit now' },
    { label: 'Delivered',      val: String(delivered.length), note: 'Completed deliveries' },
    { label: 'Pending Pickup', val: String(pending.length),   note: 'Awaiting driver' },
    { label: 'Total',          val: String(deliveries.length),note: 'All time' },
  ]

  return (
    <div className="p-8 flex gap-6 h-full">
      {/* Left panel */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dispatch</h1>
            <p className="text-[#8A97AA] text-sm mt-1">Track all active and completed deliveries</p>
          </div>
          <button
            type="button"
            onClick={fetchDeliveries}
            className="px-4 py-2.5 rounded-lg bg-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:bg-[#243655] transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
              <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.val}</p>
              <p className="text-[#8A97AA] text-xs mt-1">{s.note}</p>
            </div>
          ))}
        </div>

        {/* Delivery table */}
        <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
          {/* Toolbar: search + filter tabs */}
          <div className="px-4 py-3 bg-[#0A1628] border-b border-[#1E2E48] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A97AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ref, buyer, driver, part…"
                  className="w-full bg-[#0D1E35] border border-[#1E2E48] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]/50"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A97AA] hover:text-white text-xs">✕</button>
                )}
              </div>
              <span className="text-[#8A97AA] text-xs shrink-0">{filtered.length} shown</span>
            </div>
            {/* Filter tabs */}
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
                  {tab.key === 'pending' && pending.length > 0 && (
                    <span className="ml-1.5 bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full">{pending.length}</span>
                  )}
                  {tab.key === 'active' && active.length > 0 && (
                    <span className="ml-1.5 bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded-full">{active.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#8A97AA] text-sm">
              {deliveries.length === 0 ? 'No deliveries yet.' : 'No deliveries match your search.'}
            </div>
          ) : (
            <div className="divide-y divide-[#1E2E48]">
              {filtered.map((d) => {
                const sc = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pending
                const isActive = ACTIVE_STATUSES.includes(d.status)
                const isSelected = selected?.id === d.id
                const isPending = d.status === 'pending'
                return (
                  <div key={d.id} className={`transition-colors ${isSelected ? 'bg-[#0F2240]' : 'bg-[#0D1E35] hover:bg-[#0F2240]'}`}>
                    <button
                      type="button"
                      onClick={() => setSelected(isSelected ? null : d)}
                      className="w-full text-left px-5 py-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium font-mono">
                              {d.order.claimReference ?? `Order #${d.order.id.slice(0, 8)}`}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${sc.cls}`}>
                              {sc.label}
                            </span>
                            {isActive && (
                              <span className="flex items-center gap-1 text-[10px] text-green-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                Live
                              </span>
                            )}
                          </div>
                          <p className="text-[#8A97AA] text-xs mt-1">
                            {d.order.items.map((i) => `${i.part.name} ×${i.quantity}`).join(' · ')}
                          </p>
                          <div className="flex gap-4 mt-1.5 text-xs text-[#8A97AA]">
                            <span>Buyer: {d.order.buyer.name ?? d.order.buyer.email}</span>
                            {d.driver
                              ? <span>Driver: {d.driver.name ?? d.driver.email}</span>
                              : <span className="text-amber-400">No driver assigned</span>
                            }
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white text-sm font-semibold">
                            {d.order.currency} {Number(d.order.totalAmount).toLocaleString()}
                          </p>
                          <p className="text-[#8A97AA] text-xs mt-1">
                            {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Assign driver CTA — only for pending deliveries */}
                    {isPending && (
                      <div className="px-5 pb-4 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void openAssignModal(d) }}
                          className="px-4 py-1.5 rounded-lg bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30 text-xs font-semibold hover:bg-[#F5A623]/20 transition-colors"
                        >
                          Assign Driver →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — map */}
      <div className="w-[440px] shrink-0 flex flex-col gap-4">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-4 h-[420px]">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-semibold">
                  {selected.order.claimReference ?? `Order #${selected.order.id.slice(0, 8)}`}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-[#8A97AA] hover:text-white text-xs"
                >
                  ✕ Close
                </button>
              </div>
              <div style={{ height: 'calc(100% - 32px)' }}>
                <DeliveryMap
                  deliveryId={selected.id}
                  driverLocation={selected.driverLocation}
                  destination={selected.destination}
                  source={selected.source}
                  driverName={selected.driver?.name ?? null}
                  buyerName={selected.order.buyer.name ?? null}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <svg className="w-10 h-10 text-[#1E2E48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-[#8A97AA] text-sm">Select a delivery to see the map</p>
            </div>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-semibold">Delivery Detail</p>
              {selected.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => void openAssignModal(selected)}
                  className="px-3 py-1 rounded-lg bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30 text-xs font-semibold hover:bg-[#F5A623]/20 transition-colors"
                >
                  Assign Driver
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <span className="text-[#8A97AA]">Status</span>
              <span className={`font-semibold ${STATUS_CONFIG[selected.status]?.cls?.split(' ').find(c => c.startsWith('text-')) ?? 'text-white'}`}>
                {(STATUS_CONFIG[selected.status]?.label ?? selected.status).toLowerCase()}
              </span>
              <span className="text-[#8A97AA]">Buyer</span>
              <span className="text-white truncate">{selected.order.buyer.name ?? selected.order.buyer.email}</span>
              {selected.driver ? (
                <>
                  <span className="text-[#8A97AA]">Driver</span>
                  <span className="text-white truncate">{selected.driver.name ?? selected.driver.email}</span>
                </>
              ) : (
                <>
                  <span className="text-[#8A97AA]">Driver</span>
                  <span className="text-amber-400">Not assigned</span>
                </>
              )}
              <span className="text-[#8A97AA]">Amount</span>
              <span className="text-white">{selected.order.currency} {Number(selected.order.totalAmount).toLocaleString()}</span>
              <span className="text-[#8A97AA]">Pickup</span>
              <span className="text-white truncate">
                {selected.source?.address
                  ? selected.source.address.split(',').slice(0, 2).join(',')
                  : selected.source
                  ? `${selected.source.lat.toFixed(4)}, ${selected.source.lng.toFixed(4)}`
                  : <span className="text-amber-400">Not set — add in Settings</span>}
              </span>
              <span className="text-[#8A97AA]">Drop-off</span>
              <span className="text-white truncate">
                {selected.destination?.address
                  ? selected.destination.address.split(',').slice(0, 2).join(',')
                  : selected.destination
                  ? `${selected.destination.lat.toFixed(4)}, ${selected.destination.lng.toFixed(4)}`
                  : <span className="text-amber-400">Not set — buyer must add in Settings</span>}
              </span>
              <span className="text-[#8A97AA]">Driver GPS</span>
              <span className="text-white">
                {selected.driverLocation
                  ? `${selected.driverLocation.lat.toFixed(4)}, ${selected.driverLocation.lng.toFixed(4)}`
                  : 'No location yet'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Assign Driver Modal ── */}
      {assignTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setAssignTarget(null)}
        >
          <div
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-lg mb-1">Assign Driver</h2>
            <p className="text-[#8A97AA] text-xs mb-5">
              {assignTarget.order.claimReference ?? `Order #${assignTarget.order.id.slice(0, 8)}`}
              {' · '}
              {assignTarget.order.items.map((i) => `${i.part.name} ×${i.quantity}`).join(', ')}
            </p>

            {driversLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : drivers.length === 0 ? (
              <p className="text-[#8A97AA] text-sm text-center py-6">No drivers available. Add driver accounts first.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
                {drivers.map((driver) => (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedDriver(driver.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      selectedDriver === driver.id
                        ? 'bg-[#F5A623]/10 border-[#F5A623]/40 text-white'
                        : 'bg-[#0A1628] border-[#1E2E48] text-[#8A97AA] hover:border-[#2a3e5c] hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-sm">{driver.name ?? '(no name)'}</p>
                    <p className="text-xs opacity-60 mt-0.5">{driver.email}</p>
                  </button>
                ))}
              </div>
            )}

            {assignError && (
              <p className="text-red-400 text-xs mb-3">{assignError}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setAssignTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:bg-[#1E2E48] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAssignDriver()}
                disabled={!selectedDriver || assigning}
                className="flex-1 py-2.5 rounded-lg bg-[#F5A623] text-[#0A1628] text-sm font-bold hover:bg-[#f0a020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {assigning ? 'Assigning…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
