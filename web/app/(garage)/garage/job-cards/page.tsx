'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface DeliveryStatus { status: string }

interface OrderItem { part: { id: string; name: string; oemNumber: string | null } }

interface Order {
  id: string
  status: string
  totalAmount: string
  currency: string
  items: OrderItem[]
  delivery: DeliveryStatus | null
}

interface JobCard {
  id: string
  customerName: string
  vehicleReg: string | null
  vehicleProfile: Record<string, string> | null
  description: string
  mechanic: string | null
  claimReference: string | null
  status: string
  createdAt: string
  orders: Order[]
}

const STATUS_BADGE: Record<string, string> = {
  waiting_for_parts: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  in_progress:       'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  complete:          'bg-green-500/15 text-green-400 border border-green-500/30',
  cancelled:         'bg-red-500/15 text-red-400 border border-red-500/30',
}

const STATUS_LABEL: Record<string, string> = {
  waiting_for_parts: 'WAITING FOR PARTS',
  in_progress:       'IN PROGRESS',
  complete:          'COMPLETE',
  cancelled:         'CANCELLED',
}

type NewCardForm = {
  customerName: string
  vehicleReg: string
  description: string
  mechanic: string
  claimReference: string
}

const LIMIT = 20

export default function GarageJobCards() {
  const { getToken } = useAuth()
  const [cards, setCards]           = useState<JobCard[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]       = useState(false)
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [query, setQuery]           = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [form, setForm] = useState<NewCardForm>({
    customerName: '', vehicleReg: '', description: '', mechanic: '', claimReference: '',
  })

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchCards = useCallback(async (q: string, pg: number, append: boolean) => {
    if (pg === 1 && !append) setLoading(true)
    else setLoadingMore(true)
    try {
      const token = await getToken()
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(pg) })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`${API_URL}/v1/job-cards?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: JobCard[]; meta: { total: number; pages: number } }
      setCards((prev) => append ? [...prev, ...json.data] : json.data)
      setTotal(json.meta.total)
      setHasMore(pg < json.meta.pages)
      setPage(pg)
    } catch { /* keep */ } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getToken, API_URL])

  useEffect(() => {
    fetchCards('', 1, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(q: string) {
    setQuery(q)
    fetchCards(q, 1, false)
  }

  function loadMore() {
    fetchCards(query, page + 1, true)
  }

  async function handleCreate() {
    if (!form.customerName.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/job-cards`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:   form.customerName.trim(),
          vehicleReg:     form.vehicleReg.trim() || undefined,
          description:    form.description.trim(),
          mechanic:       form.mechanic.trim() || undefined,
          claimReference: form.claimReference.trim() || undefined,
        }),
      })
      if (!res.ok) return
      setShowModal(false)
      setForm({ customerName: '', vehicleReg: '', description: '', mechanic: '', claimReference: '' })
      await fetchCards(query, 1, false)
    } finally {
      setSaving(false)
    }
  }

  async function handleStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const token = await getToken()
      await fetch(`${API_URL}/v1/job-cards/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    } finally {
      setUpdatingId(null)
    }
  }

  const openCount    = cards.filter((c) => c.status !== 'complete' && c.status !== 'cancelled').length
  const waitingCount = cards.filter((c) => c.status === 'waiting_for_parts').length
  const completeCount = cards.filter((c) => c.status === 'complete').length

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold text-white">Job Cards</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Active and completed workshop jobs</p>
      </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-[#F5A623] hover:bg-[#e09520] text-[#060F1E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Job Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open Jobs',          value: openCount.toString(),    highlight: 'blue' },
          { label: 'Waiting for Parts',  value: waitingCount.toString(), highlight: 'amber' },
          { label: 'Completed',          value: completeCount.toString(), highlight: 'green' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.highlight === 'blue' ? 'text-blue-400' : s.highlight === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by customer, vehicle reg or claim…"
          className="flex-1 bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-[#E8ECF1] text-sm placeholder-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
        />
        <span className="text-[#8A97AA] text-xs shrink-0">{loading ? '…' : `${total} total`}</span>
      </div>

      {/* Cards list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 text-[#8A97AA] text-sm">No job cards yet. Create one above.</div>
      ) : (
        <div className="space-y-3">
          {cards.map((j) => {
            const badge = STATUS_BADGE[j.status] ?? STATUS_BADGE.waiting_for_parts
            const label = STATUS_LABEL[j.status] ?? j.status.replace(/_/g, ' ').toUpperCase()
            const isDone = j.status === 'complete' || j.status === 'cancelled'
            const vehicle = [j.vehicleProfile?.make, j.vehicleProfile?.model, j.vehicleProfile?.year].filter(Boolean).join(' ')
            const partsReady = j.orders.every((o) => ['delivered', 'confirmed'].includes(o.delivery?.status ?? ''))

            return (
              <div
                key={j.id}
                className={`bg-[#0D1E35] border rounded-xl p-5 transition-colors ${
                  isDone ? 'border-[#1E2E48] opacity-60' : 'border-[#1E2E48] hover:border-[#2a3e5c]'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[#F5A623] font-mono text-xs font-semibold">{j.id.slice(0, 8).toUpperCase()}</span>
                      {j.claimReference && (
                        <span className="text-xs text-[#8A97AA]">{j.claimReference}</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                    </div>
                    <p className="text-white font-medium mt-2">{j.customerName}</p>
                    {(j.vehicleReg || vehicle) && (
                      <p className="text-xs text-[#8A97AA] mt-0.5">{vehicle}{j.vehicleReg ? ` · ${j.vehicleReg}` : ''}</p>
                    )}
                    <p className="text-sm text-[#8A97AA] mt-2">{j.description}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {j.mechanic && (
                      <>
                        <p className="text-xs text-[#8A97AA]">Mechanic</p>
                        <p className="text-white text-sm font-medium">{j.mechanic}</p>
                      </>
                    )}
                    <p className="text-xs text-[#8A97AA]">
                      {new Date(j.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Parts row */}
                {j.orders.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#1E2E48]">
                    <p className="text-xs font-medium text-[#8A97AA] mb-2">Linked Parts</p>
                    <div className="flex flex-wrap gap-2">
                      {j.orders.flatMap((o) =>
                        o.items.map((i) => (
                          <span
                            key={i.part.id}
                            className={`text-xs px-2.5 py-1 rounded-lg border ${
                              partsReady
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {i.part.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!isDone && (
                  <div className="mt-4 pt-4 border-t border-[#1E2E48] flex gap-2 flex-wrap">
                    {j.status === 'waiting_for_parts' && (
                      <button
                        type="button"
                        disabled={updatingId === j.id}
                        onClick={() => handleStatus(j.id, 'in_progress')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-50 transition-colors"
                      >
                        {updatingId === j.id ? 'Updating…' : 'Start Job'}
                      </button>
                    )}
                    {j.status === 'in_progress' && (
                      <button
                        type="button"
                        disabled={updatingId === j.id}
                        onClick={() => handleStatus(j.id, 'complete')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 disabled:opacity-50 transition-colors"
                      >
                        {updatingId === j.id ? 'Updating…' : 'Mark Complete'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={updatingId === j.id}
                      onClick={() => handleStatus(j.id, 'cancelled')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
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

      {/* New Job Card modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-white">New Job Card</h2>
            {([
              { key: 'customerName',   label: 'Customer Name *', placeholder: 'e.g. Kwame Owusu' },
              { key: 'vehicleReg',     label: 'Vehicle Reg',     placeholder: 'e.g. GR-1234-21' },
              { key: 'description',    label: 'Description *',   placeholder: 'e.g. Front-end collision repair' },
              { key: 'mechanic',       label: 'Mechanic',        placeholder: 'e.g. Kojo Mensah' },
              { key: 'claimReference', label: 'Claim Reference', placeholder: 'e.g. CLM-2024-0012' },
            ] as { key: keyof NewCardForm; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#8A97AA] mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-[#060F1E] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#F5A623]"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:border-[#2a3e5c] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !form.customerName.trim() || !form.description.trim()}
                className="flex-1 py-2.5 rounded-lg bg-[#F5A623] hover:bg-[#e09520] disabled:opacity-50 text-[#060F1E] text-sm font-bold transition-colors"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
