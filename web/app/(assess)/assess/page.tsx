'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface ClaimLineItem { invoicePrice: string; benchmarkLow: string | null; benchmarkHigh: string | null }
interface Claim {
  id: string
  claimReference: string
  garageName: string | null
  vehicleProfile: Record<string, string> | null
  invoiceAmount: string
  benchmarkAmount: string | null
  currency: string
  status: string
  flag: string
  outcome: string | null
  createdAt: string
  lineItems: ClaimLineItem[]
  assessor: { name: string | null; email: string }
}

const FLAG_BADGE: Record<string, string> = {
  flagged: 'bg-red-500/15 text-red-400 border border-red-500/30',
  review:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ok:      'bg-green-500/15 text-green-400 border border-green-500/30',
}

const STATUS_BADGE: Record<string, string> = {
  open:         'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  under_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  closed:       'bg-[#1E2E48] text-[#8A97AA] border border-[#1E2E48]',
}

interface NewLineItem { partName: string; invoicePrice: string }
interface CreateForm {
  claimReference: string
  garageName: string
  invoiceAmount: string
  currency: string
}

export default function AssessPage() {
  const { getToken } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFlag, setFilterFlag] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateForm>({ claimReference: '', garageName: '', invoiceAmount: '', currency: 'GHS' })
  const [lineItems, setLineItems] = useState<NewLineItem[]>([{ partName: '', invoicePrice: '' }])

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchClaims = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Claim[] }
      setClaims(json.data)
    } catch { /* keep */ }
  }, [getToken, API_URL])

  useEffect(() => {
    fetchClaims().finally(() => setLoading(false))
  }, [fetchClaims])

  async function handleCreate() {
    const validItems = lineItems.filter((li) => li.partName.trim() && li.invoicePrice)
    if (!createForm.claimReference.trim() || !createForm.invoiceAmount || validItems.length === 0) return
    setCreating(true)
    setCreateError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimReference: createForm.claimReference.trim(),
          garageName:     createForm.garageName.trim() || undefined,
          invoiceAmount:  Number(createForm.invoiceAmount),
          currency:       createForm.currency,
          lineItems: validItems.map((li) => ({
            partName:     li.partName.trim(),
            invoicePrice: Number(li.invoicePrice),
            currency:     createForm.currency,
          })),
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({} as { error?: string }))
        throw new Error((json as { error?: string }).error ?? `API ${res.status}`)
      }
      setShowCreate(false)
      setCreateForm({ claimReference: '', garageName: '', invoiceAmount: '', currency: 'GHS' })
      setLineItems([{ partName: '', invoicePrice: '' }])
      await fetchClaims()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const shown  = filterFlag ? claims.filter((c) => c.flag === filterFlag) : claims
  const flagged = claims.filter((c) => c.flag === 'flagged').length
  const review  = claims.filter((c) => c.flag === 'review').length
  const totalOvercharge = claims.reduce((sum, c) => {
    const inv = Number(c.invoiceAmount)
    const bench = Number(c.benchmarkAmount ?? c.invoiceAmount)
    return sum + Math.max(0, inv - bench)
  }, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Claims</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Review and validate parts invoices against market benchmarks</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] transition-colors"
          >
            + New Claim
          </button>
          <select
            value={filterFlag}
            onChange={(e) => setFilterFlag(e.target.value)}
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
          >
            <option value="">All Flags</option>
            <option value="flagged">Flagged</option>
            <option value="review">Review</option>
            <option value="ok">OK</option>
          </select>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Total Claims</p>
          <p className="text-2xl font-bold text-white">{claims.length}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Flagged</p>
          <p className="text-2xl font-bold text-red-400">{flagged}</p>
          <p className="text-[#8A97AA] text-xs mt-1">Overcharge detected</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Under Review</p>
          <p className="text-2xl font-bold text-amber-400">{review}</p>
        </div>
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
          <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">Total Overcharge</p>
          <p className="text-2xl font-bold text-white">GHS {Math.round(totalOvercharge).toLocaleString()}</p>
          <p className="text-[#8A97AA] text-xs mt-1">Across flagged claims</p>
        </div>
      </div>

      {/* Claims table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-[#8A97AA] text-sm">
          {claims.length === 0 ? 'No claims yet. Start by creating a claim from the Part Price Search page.' : 'No claims match the current filter.'}
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
          <div className="grid grid-cols-[110px_1.6fr_1fr_1fr_80px_90px] gap-0">
            {['CLAIM REF', 'GARAGE / VEHICLE', 'INVOICE', 'BENCHMARK / DIFF', 'STATUS', 'FLAG'].map((h) => (
              <div key={h} className="px-4 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
                {h}
              </div>
            ))}
            {shown.map((c, i) => {
              const flagCls  = FLAG_BADGE[c.flag] ?? FLAG_BADGE.ok
              const statusCls = STATUS_BADGE[c.status] ?? STATUS_BADGE.open
              const invoice = Number(c.invoiceAmount)
              const bench   = Number(c.benchmarkAmount ?? 0)
              const diff    = bench > 0 ? invoice - bench : null
              const isLast  = i === shown.length - 1
              const border  = isLast ? '' : 'border-b border-[#1E2E48]'
              const vehicle = c.vehicleProfile
                ? [c.vehicleProfile.make, c.vehicleProfile.model, c.vehicleProfile.year, c.vehicleProfile.reg].filter(Boolean).join(' · ')
                : ''
              return (
                <div key={c.id} className="contents group">
                  <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    <Link href={`/assess/claims/${c.id}`} className="text-amber-400 text-xs font-medium font-mono hover:underline">
                      {c.claimReference}
                    </Link>
                  </div>
                  <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors`}>
                    <p className="text-white text-sm font-medium">{c.garageName ?? '—'}</p>
                    {vehicle && <p className="text-[#8A97AA] text-xs mt-0.5">{vehicle}</p>}
                    <p className="text-[#8A97AA] text-xs mt-0.5">{c.lineItems.length} item{c.lineItems.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    <span className="text-white text-sm font-semibold">{c.currency} {invoice.toLocaleString()}</span>
                  </div>
                  <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    {bench > 0 ? (
                      <div>
                        <p className="text-[#8A97AA] text-sm">{c.currency} {bench.toLocaleString()}</p>
                        {diff !== null && (
                          <p className={`text-xs font-semibold mt-0.5 ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {diff > 0 ? '+' : ''}{c.currency} {Math.abs(diff).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#8A97AA] text-sm">—</span>
                    )}
                  </div>
                  <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${statusCls}`}>
                      {c.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className={`px-4 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${flagCls}`}>
                      {c.flag.toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create Claim Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-lg mb-5">New Claim</h2>

            <div className="space-y-4">
              {/* Claim reference */}
              <div>
                <label className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-1">Claim Reference *</label>
                <input
                  type="text"
                  value={createForm.claimReference}
                  onChange={(e) => setCreateForm((p) => ({ ...p, claimReference: e.target.value }))}
                  placeholder="e.g. CLM-2026-001"
                  className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
                />
              </div>

              {/* Garage + Invoice row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-1">Garage Name</label>
                  <input
                    type="text"
                    value={createForm.garageName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, garageName: e.target.value }))}
                    placeholder="e.g. Tema Motors"
                    className="w-full bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
                  />
                </div>
                <div>
                  <label className="block text-[#8A97AA] text-xs uppercase tracking-widest mb-1">Invoice Total *</label>
                  <div className="flex gap-2">
                    <select
                      value={createForm.currency}
                      onChange={(e) => setCreateForm((p) => ({ ...p, currency: e.target.value }))}
                      className="bg-[#0A1628] border border-[#1E2E48] rounded-lg px-2 py-2 text-white text-sm focus:outline-none"
                    >
                      <option>GHS</option>
                      <option>USD</option>
                      <option>NGN</option>
                    </select>
                    <input
                      type="number"
                      value={createForm.invoiceAmount}
                      onChange={(e) => setCreateForm((p) => ({ ...p, invoiceAmount: e.target.value }))}
                      placeholder="0.00"
                      className="flex-1 bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
                    />
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#8A97AA] text-xs uppercase tracking-widest">Line Items *</label>
                  <button
                    onClick={() => setLineItems((p) => [...p, { partName: '', invoicePrice: '' }])}
                    className="text-xs text-[#F5A623] hover:text-[#d4911f] font-semibold"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((li, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={li.partName}
                        onChange={(e) => { const u = [...lineItems]; u[idx] = { ...li, partName: e.target.value }; setLineItems(u) }}
                        placeholder="Part name"
                        className="flex-1 bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
                      />
                      <input
                        type="number"
                        value={li.invoicePrice}
                        onChange={(e) => { const u = [...lineItems]; u[idx] = { ...li, invoicePrice: e.target.value }; setLineItems(u) }}
                        placeholder="Price"
                        className="w-24 bg-[#0A1628] border border-[#1E2E48] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F5A623]/50"
                      />
                      {lineItems.length > 1 && (
                        <button
                          onClick={() => setLineItems((p) => p.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 text-lg leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {createError && <p className="mt-3 text-xs text-red-400 font-mono">{createError}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreate(false); setCreateError(null) }}
                className="flex-1 py-2.5 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-semibold hover:bg-[#1E2E48] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createForm.claimReference.trim() || !createForm.invoiceAmount}
                className="flex-1 py-2.5 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating…' : 'Create Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
