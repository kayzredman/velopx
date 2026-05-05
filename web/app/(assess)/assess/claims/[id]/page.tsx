'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams } from 'next/navigation'

interface LineItem {
  id: string
  partName: string
  oemNumber: string | null
  invoicePrice: string
  benchmarkLow: string | null
  benchmarkHigh: string | null
  deviation: number | null
  currency: string
}

interface ClaimDetail {
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
  lineItems: LineItem[]
  assessor: { name: string | null; email: string }
}

const FLAG_BADGE: Record<string, string> = {
  flagged: 'bg-red-500/15 text-red-400 border border-red-500/30',
  review:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ok:      'bg-green-500/15 text-green-400 border border-green-500/30',
}

function fmt(n: number, currency = 'GHS') {
  return `${currency} ${Math.round(n).toLocaleString()}`
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingFlag, setUpdatingFlag] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchClaim = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: ClaimDetail }
      setClaim(json.data)
    } catch { /* keep */ }
  }, [getToken, API_URL, id])

  useEffect(() => {
    fetchClaim().finally(() => setLoading(false))
  }, [fetchClaim])

  async function setFlag(flag: string) {
    if (!claim) return
    setUpdatingFlag(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag }),
      })
      if (!res.ok) return
      const json = await res.json() as { data: ClaimDetail }
      setClaim(json.data)
    } finally {
      setUpdatingFlag(false)
    }
  }

  async function closeWithOutcome(outcome: string) {
    if (!claim) return
    setUpdatingFlag(true)
    try {
      const token = await getToken()
      await fetch(`${API_URL}/v1/claims/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', outcome }),
      })
      await fetchClaim()
    } finally {
      setUpdatingFlag(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="p-8 text-[#8A97AA]">
        <Link href="/assess" className="text-[#F5A623] hover:underline text-sm">← Back to Claims</Link>
        <p className="mt-8 text-center">Claim not found or access denied.</p>
      </div>
    )
  }

  const invoice = Number(claim.invoiceAmount)
  const bench   = Number(claim.benchmarkAmount ?? 0)
  const diff    = bench > 0 ? invoice - bench : null
  const vehicle = claim.vehicleProfile
    ? [claim.vehicleProfile.make, claim.vehicleProfile.model, claim.vehicleProfile.year, claim.vehicleProfile.reg].filter(Boolean).join(' · ')
    : ''

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8A97AA] mb-6">
        <Link href="/assess" className="hover:text-white transition-colors">Claims</Link>
        <span>/</span>
        <span className="text-white font-medium font-mono">{claim.claimReference}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Validation</h1>
          <p className="text-[#8A97AA] text-sm mt-1">
            {[claim.garageName, vehicle].filter(Boolean).join(' · ')}
          </p>
        </div>
        {claim.status !== 'closed' && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              disabled={updatingFlag}
              onClick={() => setFlag('flagged')}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            >
              Flag
            </button>
            <button
              type="button"
              disabled={updatingFlag}
              onClick={() => closeWithOutcome('approved')}
              className="px-4 py-2.5 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d4911f] disabled:opacity-50 transition-colors"
            >
              {updatingFlag ? 'Saving…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={updatingFlag}
              onClick={() => closeWithOutcome('adjusted')}
              className="px-4 py-2.5 rounded-lg border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
            >
              Adjusted
            </button>
          </div>
        )}
      </div>

      {/* Metadata row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Claim Ref',   val: claim.claimReference },
          { label: 'Garage',      val: claim.garageName ?? '—' },
          { label: 'Submitted',   val: new Date(claim.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
          { label: 'Assessor',    val: claim.assessor.name ?? claim.assessor.email },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] px-5 py-4">
            <p className="text-[#8A97AA] text-[10px] uppercase tracking-widest mb-1">{m.label}</p>
            <p className="text-white text-sm font-medium">{m.val}</p>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden mb-8">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Parts Line Items</h2>
          <span className="text-[#8A97AA] text-xs">{claim.lineItems.length} item{claim.lineItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['PART / OEM NO.', 'INVOICE', 'BENCH LOW', 'BENCH HIGH', 'DEVIATION'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[#8A97AA] tracking-widest uppercase px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claim.lineItems.map((li) => {
                const inv  = Number(li.invoicePrice)
                const low  = Number(li.benchmarkLow ?? 0)
                const high = Number(li.benchmarkHigh ?? 0)
                const dev  = li.deviation
                const devCls = dev != null && dev > 30 ? 'text-red-400' : dev != null && dev > 10 ? 'text-amber-400' : 'text-green-400'
                return (
                  <tr key={li.id} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{li.partName}</p>
                      {li.oemNumber && <p className="text-[#8A97AA] text-xs font-mono mt-0.5">{li.oemNumber}</p>}
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">{fmt(inv, li.currency)}</td>
                    <td className="px-5 py-4 text-[#8A97AA]">{low > 0 ? fmt(low, li.currency) : '—'}</td>
                    <td className="px-5 py-4 text-[#8A97AA]">{high > 0 ? fmt(high, li.currency) : '—'}</td>
                    <td className="px-5 py-4">
                      {dev != null ? (
                        <span className={`font-bold ${devCls}`}>{dev > 0 ? '+' : ''}{dev.toFixed(1)}%</span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary + flag */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6 space-y-3">
          <h3 className="text-white font-semibold text-sm">Invoice Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-[#8A97AA]">Invoice Total</span>
            <span className="text-white font-semibold">{fmt(invoice, claim.currency)}</span>
          </div>
          {bench > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-[#8A97AA]">Benchmark Total</span>
                <span className="text-[#8A97AA]">{fmt(bench, claim.currency)}</span>
              </div>
              {diff !== null && (
                <div className="flex justify-between text-sm pt-2 border-t border-[#1E2E48]">
                  <span className="text-[#8A97AA]">Overcharge</span>
                  <span className={diff > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                    {diff > 0 ? '+' : ''}{fmt(diff, claim.currency)} ({bench > 0 ? ((diff / bench) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6 space-y-3">
          <h3 className="text-white font-semibold text-sm">Assessment Status</h3>
          <div className="flex items-center gap-3">
            <span className="text-[#8A97AA] text-sm">Flag</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${FLAG_BADGE[claim.flag] ?? FLAG_BADGE.ok}`}>
              {claim.flag.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#8A97AA] text-sm">Status</span>
            <span className="text-white text-sm font-medium">{claim.status.replace('_', ' ').toUpperCase()}</span>
          </div>
          {claim.outcome && (
            <div className="flex items-center gap-3">
              <span className="text-[#8A97AA] text-sm">Outcome</span>
              <span className="text-white text-sm font-medium">{claim.outcome.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
