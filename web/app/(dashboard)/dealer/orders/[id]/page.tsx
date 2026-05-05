'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface OrderItem {
  id: string
  quantity: number
  price: string
  currency: string
  part: { id: string; name: string; oemNumber: string | null; condition: string }
}

interface Order {
  id: string
  status: string
  totalAmount: string
  currency: string
  claimReference: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  deliveryLat:     number | null
  deliveryLng:     number | null
  deliveryAddress: string | null
  delivery: {
    id: string
    status: string
    driverId: string | null
    destLat:     number | null
    destLng:     number | null
    destAddress: string | null
  } | null
}

interface Driver {
  id: string
  name: string | null
  email: string
}

const STATUS_COLOURS: Record<string, string> = {
  pending:    'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
  confirmed:  'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
  dispatched: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30',
  delivered:  'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
  completed:  'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
  cancelled:  'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
  disputed:   'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
}

const DELIVERY_COLOURS: Record<string, string> = {
  pending:    'text-[#F59E0B]',
  assigned:   'text-[#3B82F6]',
  collected:  'text-[#8B5CF6]',
  in_transit: 'text-[#8B5CF6]',
  delivered:  'text-[#22C55E]',
  confirmed:  'text-[#22C55E]',
  disputed:   'text-[#EF4444]',
}

const CONDITION_LABEL: Record<string, string> = {
  oem: 'OEM',
  aftermarket: 'Aftermarket',
  used: 'Used',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getToken } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  // Delivery assignment state
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      setOrder(json.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [id, getToken])

  useEffect(() => {
    setLoading(true)
    fetchOrder().finally(() => setLoading(false))
  }, [fetchOrder])

  async function updateStatus(status: string) {
    if (!order) return
    setUpdating(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/orders/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      setOrder((prev) => prev ? { ...prev, status: json.data.status } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUpdating(false)
    }
  }

  async function createDelivery() {
    if (!order) return
    setUpdating(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      await fetchOrder()
      setShowAssign(true)
      void loadDrivers()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUpdating(false)
    }
  }

  async function loadDrivers() {
    setLoadingDrivers(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      setDrivers(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingDrivers(false)
    }
  }

  async function assignDriver() {
    if (!order?.delivery || !selectedDriverId) return
    setUpdating(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/${order.delivery.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'assigned', driverId: selectedDriverId }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      await fetchOrder()
      setShowAssign(false)
      setSelectedDriverId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8A97AA] text-sm">Loading…</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-[#8A97AA] text-sm hover:text-[#E8ECF1] flex items-center gap-1">
          ← Back
        </button>
        <p className="text-red-400 text-sm font-mono">{error ?? 'Order not found'}</p>
      </div>
    )
  }

  const canConfirm  = order.status === 'pending'
  const canDispatch = order.status === 'confirmed'
  const canCancel   = order.status === 'pending' || order.status === 'confirmed'
  const canCreateDelivery = order.status === 'confirmed' && !order.delivery
  const canAssignDriver   = !!order.delivery && order.delivery.status === 'pending'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-[#8A97AA] text-sm hover:text-[#E8ECF1] flex items-center gap-1 mb-4"
        >
          ← Orders
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#E8ECF1]">
              {order.currency} {Number(order.totalAmount).toLocaleString()}
            </h1>
            <p className="text-[#8A97AA] text-xs mt-1">
              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
              {order.claimReference && (
                <span className="ml-2 bg-[#111E34] px-2 py-0.5 rounded">
                  {order.claimReference}
                </span>
              )}
            </p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize border ${STATUS_COLOURS[order.status] ?? 'bg-[#1E2E48] text-[#8A97AA] border-[#1E2E48]'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

      {/* Items */}
      <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1E2E48]">
          <p className="text-xs font-semibold text-[#8A97AA] uppercase tracking-wider">Items</p>
        </div>
        <div className="divide-y divide-[#1E2E48]">
          {order.items.map((item) => (
            <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[#E8ECF1] text-sm font-medium">{item.part.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.part.oemNumber && (
                    <span className="text-xs text-[#8A97AA]">{item.part.oemNumber}</span>
                  )}
                  <span className="text-xs text-[#8A97AA] bg-[#111E34] px-1.5 py-0.5 rounded">
                    {CONDITION_LABEL[item.part.condition] ?? item.part.condition}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#E8ECF1] text-sm font-semibold">
                  {item.currency} {Number(item.price).toLocaleString()}
                </p>
                <p className="text-[#8A97AA] text-xs">×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[#1E2E48] flex justify-between items-center">
          <p className="text-xs text-[#8A97AA]">Total</p>
          <p className="text-[#E8ECF1] font-bold">
            {order.currency} {Number(order.totalAmount).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Delivery panel */}
      {order.delivery ? (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-[#8A97AA] uppercase tracking-wider">Delivery</p>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium capitalize ${DELIVERY_COLOURS[order.delivery.status] ?? 'text-[#8A97AA]'}`}>
              {order.delivery.status.replace(/_/g, ' ')}
            </p>
            <div className="flex items-center gap-3">
              {['assigned', 'collected', 'in_transit'].includes(order.delivery.status) && (
                <button
                  onClick={() => router.push(`/dealer/dispatch`)}
                  className="text-xs px-3 py-1 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 font-semibold hover:bg-[#3B82F6]/20 transition-colors"
                >
                  Track
                </button>
              )}
              <p className="text-xs text-[#8A97AA] font-mono">{order.delivery.id.slice(-8)}</p>
            </div>
          </div>

          {/* Destination address */}
          {(order.delivery.destAddress || order.delivery.destLat != null) && (
            <div className="flex items-start gap-2 bg-[#0A1628] rounded-lg px-3 py-2">
              <span className="text-[#3B82F6] text-xs mt-0.5">📍</span>
              <div className="min-w-0">
                <p className="text-[10px] text-[#8A97AA] uppercase tracking-wider font-semibold mb-0.5">Destination</p>
                {order.delivery.destAddress ? (
                  <p className="text-[#E8ECF1] text-xs">{order.delivery.destAddress}</p>
                ) : null}
                {order.delivery.destLat != null && (
                  <p className="text-[#8A97AA] text-[11px] font-mono mt-0.5">
                    {order.delivery.destLat.toFixed(5)}, {order.delivery.destLng?.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Assign driver panel — shown when delivery is pending */}
          {canAssignDriver && (
            <div className="pt-3 border-t border-[#1E2E48]">
              {!showAssign ? (
                <button
                  onClick={() => { setShowAssign(true); loadDrivers() }}
                  className="w-full py-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30 text-sm font-semibold hover:bg-[#8B5CF6]/20 transition-colors"
                >
                  Assign Driver →
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#8A97AA] font-semibold uppercase tracking-wider">Select a driver</p>
                  {loadingDrivers ? (
                    <p className="text-xs text-[#8A97AA]">Loading drivers…</p>
                  ) : drivers.length === 0 ? (
                    <p className="text-xs text-[#8A97AA]">No drivers found. Add drivers to your team first.</p>
                  ) : (
                    <div className="space-y-2">
                      {drivers.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDriverId(d.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                            selectedDriverId === d.id
                              ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#E8ECF1]'
                              : 'border-[#1E2E48] bg-[#0A1628] text-[#8A97AA] hover:border-[#8B5CF6]/40'
                          }`}
                        >
                          <span className="font-medium">{d.name ?? 'Unnamed'}</span>
                          <span className="ml-2 text-xs opacity-60">{d.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={assignDriver}
                      disabled={!selectedDriverId || updating}
                      className="flex-1 py-2 rounded-lg bg-[#8B5CF6] text-white text-sm font-bold hover:bg-[#7C3AED] disabled:opacity-40 transition-colors"
                    >
                      {updating ? 'Assigning…' : 'Confirm Assignment'}
                    </button>
                    <button
                      onClick={() => { setShowAssign(false); setSelectedDriverId('') }}
                      className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm hover:text-[#E8ECF1] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : canCreateDelivery ? (
        <div className="rounded-xl border border-dashed border-[#1E2E48] bg-[#0C1526] px-5 py-5 text-center space-y-3">
          <p className="text-[#8A97AA] text-sm">No delivery created yet</p>
          <button
            onClick={createDelivery}
            disabled={updating}
            className="px-6 py-2 rounded-lg bg-[#3B82F6] text-white text-sm font-bold hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
          >
            {updating ? 'Creating…' : '+ Create Delivery'}
          </button>
        </div>
      ) : null}

      {/* Order status actions */}
      {(canConfirm || canDispatch || canCancel) && (
        <div className="flex gap-3">
          {canConfirm && (
            <button
              onClick={() => updateStatus('confirmed')}
              disabled={updating}
              className="flex-1 py-2.5 rounded-lg bg-[#3B82F6] text-white text-sm font-bold hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
            >
              {updating ? 'Updating…' : 'Confirm Order'}
            </button>
          )}
          {canDispatch && (
            <button
              onClick={() => updateStatus('dispatched')}
              disabled={updating}
              className="flex-1 py-2.5 rounded-lg bg-[#8B5CF6] text-white text-sm font-bold hover:bg-[#7C3AED] disabled:opacity-50 transition-colors"
            >
              {updating ? 'Updating…' : 'Mark Dispatched'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => updateStatus('cancelled')}
              disabled={updating}
              className="flex-1 py-2.5 rounded-lg border border-[#EF4444]/40 text-[#EF4444] text-sm font-semibold hover:bg-[#EF4444]/10 disabled:opacity-50 transition-colors"
            >
              {updating ? 'Updating…' : 'Cancel'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

