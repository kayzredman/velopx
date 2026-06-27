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
  items: OrderItem[]
  delivery: { id: string; status: string } | null
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

export default function GarageOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getToken } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingDelivery, setUpdatingDelivery] = useState(false)
  const [disputeNote, setDisputeNote] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)

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

  async function patchDeliveryStatus(status: string, note?: string) {
    if (!order?.delivery) return
    setUpdatingDelivery(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/${order.delivery.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(note && { note }) }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      setOrder((prev) =>
        prev ? { ...prev, delivery: prev.delivery ? { ...prev.delivery, status } : null } : prev,
      )
      setShowDisputeForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUpdatingDelivery(false)
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
                <span className="ml-2 bg-[#111E34] px-2 py-0.5 rounded">{order.claimReference}</span>
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

      {/* Delivery */}
      {order.delivery && (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#8A97AA] uppercase tracking-wider">Delivery</p>
            <p className={`text-sm font-medium capitalize ${DELIVERY_COLOURS[order.delivery.status] ?? 'text-[#8A97AA]'}`}>
              {order.delivery.status.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Confirm / Dispute when delivered */}
          {order.delivery.status === 'delivered' && !showDisputeForm && (
            <div className="flex gap-3 pt-2 border-t border-[#1E2E48]">
              <button
                onClick={() => patchDeliveryStatus('confirmed')}
                disabled={updatingDelivery}
                className="flex-1 py-2.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-semibold hover:bg-green-500/20 disabled:opacity-50 transition-colors"
              >
                {updatingDelivery ? 'Confirming…' : 'Confirm Receipt'}
              </button>
              <button
                onClick={() => setShowDisputeForm(true)}
                className="flex-1 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/20 transition-colors"
              >
                Dispute
              </button>
            </div>
          )}

          {/* Dispute form */}
          {showDisputeForm && (
            <div className="pt-2 border-t border-[#1E2E48] space-y-3">
              <label className="block text-[#8A97AA] text-xs uppercase tracking-widest">Dispute Reason</label>
              <textarea
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                placeholder="Describe the issue…"
                rows={2}
                className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisputeForm(false)}
                  className="flex-1 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:bg-[#1E2E48] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => patchDeliveryStatus('disputed', disputeNote)}
                  disabled={!disputeNote.trim() || updatingDelivery}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                >
                  {updatingDelivery ? 'Submitting…' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
