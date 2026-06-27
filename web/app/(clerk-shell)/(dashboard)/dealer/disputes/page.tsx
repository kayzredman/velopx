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

const STATUS_BADGE: Record<string, string> = {
  open:         'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  under_review: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  resolved:     'bg-green-500/15 text-green-400 border border-green-500/30',
  escalated:    'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  closed:       'bg-[#1E2E48] text-[#506070] border border-[#1E2E48]',
}

const TYPE_LABEL: Record<string, string> = {
  wrong_part:         'Wrong Part',
  damaged_on_delivery: 'Damaged on Delivery',
  not_delivered:      'Not Delivered',
  incorrect_listing:  'Incorrect Listing',
  invoice_dispute:    'Invoice Dispute',
}

export default function DealerDisputesPage() {
  const { getToken } = useAuth()
  const [disputes, setDisputes]       = useState<Dispute[]>([])
  const [loading, setLoading]         = useState(true)
  const [respondId, setRespondId]     = useState<string | null>(null)
  const [response, setResponse]       = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [msg, setMsg]                 = useState<string | null>(null)

  async function load() {
    const token = await getToken()
    const res = await fetch(`${API_URL}/v1/disputes?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json() as { data: Dispute[] }
      setDisputes(json.data)
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [getToken]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRespond(id: string) {
    if (!response.trim()) return
    setSubmitting(true)
    setMsg(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/disputes/${id}/respond`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerResponse: response.trim() }),
      })
      if (!res.ok) throw new Error('Failed')
      setMsg('Response submitted.')
      setRespondId(null)
      setResponse('')
      await load()
    } catch {
      setMsg('Failed to submit response. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const open         = disputes.filter((d) => d.status === 'open').length
  const underReview  = disputes.filter((d) => d.status === 'under_review').length

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Disputes</h1>
        <p className="text-[#506070] text-sm mt-1">Disputes raised on your orders — respond to keep your seller rating</p>
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
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-3 flex items-center gap-3">
          <span className="text-blue-400/70 text-xs font-semibold uppercase tracking-wider">Under Review</span>
          <span className="text-blue-400 font-bold text-xl">{underReview}</span>
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.startsWith('Failed') ? 'text-rose-400' : 'text-green-400'}`}>{msg}</p>
      )}

      {/* Disputes table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2E48] bg-[#0C1526]">
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Order</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Raised By</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-[#506070] text-[11px] font-semibold uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-14 text-[#506070] text-sm">Loading…</td></tr>
            ) : disputes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-14 text-[#506070] text-sm">No disputes found</td></tr>
            ) : (
              disputes.map((d) => (
                <>
                  <tr key={d.id} className="border-b border-[#1E2E48]/60 last:border-0 hover:bg-[#0C1526]/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#E8ECF1] text-xs">
                      {d.order.claimReference ?? d.order.id.slice(0, 8).toUpperCase()}
                      <span className="block text-[#3D5068] text-[10px]">{d.order.currency} {Number(d.order.totalAmount).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-[#8A97AA] text-xs">{TYPE_LABEL[d.disputeType] ?? d.disputeType}</td>
                    <td className="px-4 py-3 text-[#8A97AA] text-xs">{d.raisedBy.name ?? d.raisedBy.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[d.status] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#506070] text-xs whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {(d.status === 'open' || d.status === 'under_review') && !d.dealerResponse ? (
                        <button
                          onClick={() => { setRespondId(d.id); setResponse('') }}
                          className="text-xs text-[#F5A623] hover:underline"
                        >
                          Respond
                        </button>
                      ) : d.dealerResponse ? (
                        <span className="text-xs text-green-400">Responded</span>
                      ) : (
                        <span className="text-xs text-[#3D5068]">—</span>
                      )}
                    </td>
                  </tr>
                  {respondId === d.id && (
                    <tr key={`${d.id}-respond`} className="border-b border-[#1E2E48]/60 bg-[#0C1526]/60">
                      <td colSpan={6} className="px-4 py-4">
                        <p className="text-xs text-[#8A97AA] mb-1.5">Your response to: &ldquo;{d.description.slice(0, 100)}{d.description.length > 100 ? '…' : ''}&rdquo;</p>
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          rows={3}
                          placeholder="Explain your position, attach tracking info, or offer a resolution…"
                          className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#3D5068] focus:outline-none focus:border-[#F5A623] resize-none"
                        />
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => void handleRespond(d.id)}
                            disabled={submitting || !response.trim()}
                            className="bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
                          >
                            {submitting ? 'Submitting…' : 'Submit Response'}
                          </button>
                          <button
                            onClick={() => setRespondId(null)}
                            className="text-xs text-[#506070] hover:text-[#8A97AA] px-3 py-2"
                          >
                            Cancel
                          </button>
                        </div>
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
