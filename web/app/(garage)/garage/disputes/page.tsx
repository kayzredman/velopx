'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface Dispute {
  id: string
  status: string
  disputeType: string
  description: string
  dealerResponse: string | null
  createdAt: string
  raisedBy: { id: string; name: string | null; email: string }
  order: { id: string; claimReference: string | null; totalAmount: string; currency: string }
}

interface Order {
  id: string
  claimReference: string | null
  totalAmount: string
  currency: string
  status: string
}

const DISPUTE_TYPES = [
  { value: 'wrong_part',          label: 'Wrong Part' },
  { value: 'damaged_on_delivery', label: 'Damaged on Delivery' },
  { value: 'not_delivered',       label: 'Not Delivered' },
  { value: 'incorrect_listing',   label: 'Incorrect Listing' },
  { value: 'invoice_dispute',     label: 'Invoice Dispute' },
]

const STATUS_BADGE: Record<string, string> = {
  open:         'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  under_review: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  resolved:     'bg-green-500/15 text-green-400 border border-green-500/30',
  escalated:    'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  closed:       'bg-[#1E2E48] text-[#506070] border border-[#1E2E48]',
}

export default function GarageDisputesPage() {
  const { getToken } = useAuth()
  const [disputes, setDisputes]       = useState<Dispute[]>([])
  const [orders, setOrders]           = useState<Order[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [orderId, setOrderId]         = useState('')
  const [disputeType, setDisputeType] = useState('wrong_part')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [msg, setMsg]                 = useState<string | null>(null)
  const [expandId, setExpandId]       = useState<string | null>(null)

  async function loadAll() {
    const token = await getToken()
    const [dRes, oRes] = await Promise.all([
      fetch(`${API_URL}/v1/disputes?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/v1/orders?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
    if (dRes.ok) {
      const json = await dRes.json() as { data: Dispute[] }
      setDisputes(json.data)
    }
    if (oRes.ok) {
      const json = await oRes.json() as { data: Order[] }
      setOrders(json.data)
    }
    setLoading(false)
  }

  useEffect(() => { void loadAll() }, [getToken]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRaise() {
    if (!orderId || !description.trim()) return
    setSubmitting(true)
    setMsg(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/disputes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, disputeType, description: description.trim() }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Failed')
      }
      setMsg('Dispute raised successfully.')
      setShowForm(false)
      setOrderId('')
      setDescription('')
      setDisputeType('wrong_part')
      await loadAll()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to raise dispute. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const open = disputes.filter((d) => d.status === 'open').length

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E8ECF1]">Disputes</h1>
          <p className="text-[#506070] text-sm mt-1">Raise and track disputes on your parts orders</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setMsg(null) }}
          className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + Raise Dispute
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] px-5 py-3 flex items-center gap-3">
          <span className="text-[#506070] text-xs font-semibold uppercase tracking-wider">Total</span>
          <span className="text-[#E8ECF1] font-bold text-xl">{disputes.length}</span>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 flex items-center gap-3">
          <span className="text-amber-400/70 text-xs font-semibold uppercase tracking-wider">Open</span>
          <span className="text-amber-400 font-bold text-xl">{open}</span>
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.startsWith('Failed') || msg.startsWith('An open') ? 'text-rose-400' : 'text-green-400'}`}>{msg}</p>
      )}

      {/* Raise dispute form */}
      {showForm && (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Raise a New Dispute</h2>

          <div>
            <label className="block text-xs font-medium text-[#8A97AA] mb-1.5">Order</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
            >
              <option value="">Select an order…</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.claimReference ?? o.id.slice(0, 10).toUpperCase()} — {o.currency} {Number(o.totalAmount).toLocaleString()} ({o.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8A97AA] mb-1.5">Dispute Type</label>
            <select
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value)}
              className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5A623]"
            >
              {DISPUTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8A97AA] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue in detail (min. 10 characters)…"
              className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#3D5068] focus:outline-none focus:border-[#F5A623] resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => void handleRaise()}
              disabled={submitting || !orderId || description.trim().length < 10}
              className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Dispute'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-[#506070] hover:text-[#8A97AA] px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Disputes list */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2E48] bg-[#0C1526]">
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Order</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Response</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-14 text-[#506070] text-sm">Loading…</td></tr>
            ) : disputes.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-14 text-[#506070] text-sm">No disputes yet</td></tr>
            ) : (
              disputes.map((d) => (
                <>
                  <tr key={d.id} className="border-b border-[#1E2E48]/60 last:border-0 hover:bg-[#0C1526]/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#E8ECF1] text-xs">
                      {d.order.claimReference ?? d.order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-[#8A97AA] text-xs">
                      {DISPUTE_TYPES.find((t) => t.value === d.disputeType)?.label ?? d.disputeType}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[d.status] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#506070] text-xs whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {d.dealerResponse ? (
                        <button
                          onClick={() => setExpandId(expandId === d.id ? null : d.id)}
                          className="text-xs text-[#F5A623] hover:underline"
                        >
                          {expandId === d.id ? 'Hide' : 'View'}
                        </button>
                      ) : (
                        <span className="text-xs text-[#3D5068]">Awaiting</span>
                      )}
                    </td>
                  </tr>
                  {expandId === d.id && d.dealerResponse && (
                    <tr key={`${d.id}-resp`} className="border-b border-[#1E2E48]/60 bg-[#0C1526]/60">
                      <td colSpan={5} className="px-4 py-3">
                        <p className="text-xs text-[#8A97AA] mb-1">Dealer response:</p>
                        <p className="text-sm text-[#E8ECF1]">{d.dealerResponse}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
