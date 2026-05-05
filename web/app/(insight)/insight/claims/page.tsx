'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

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
  createdAt: string
  assessor?: { name: string | null; email: string }
}

const FLAG_BADGE: Record<string, string> = {
  flagged: 'bg-red-500/15 text-red-400 border border-red-500/30',
  review:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ok:      'bg-green-500/15 text-green-400 border border-green-500/30',
}

const STATUS_BADGE: Record<string, string> = {
  open:   'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  closed: 'bg-green-500/15 text-green-400 border border-green-500/30',
  under_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}

export default function InsightClaims() {
  const { getToken } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [flagFilter, setFlagFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const displayed = claims.filter((c) => {
    const flagOk   = flagFilter === 'all'   || c.flag === flagFilter
    const statusOk = statusFilter === 'all' || c.status === statusFilter
    return flagOk && statusOk
  })

  const flaggedCount  = claims.filter((c) => c.flag === 'flagged').length
  const openCount     = claims.filter((c) => c.status !== 'closed').length
  const totalSavings  = claims.reduce((s, c) => {
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    return s + Math.max(0, diff)
  }, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Claims</h1>
          <p className="text-sm text-[#8A97AA] mt-1">All claims submitted under your organisation</p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value)}
            className="bg-[#0D1E35] border border-[#1E2E48] rounded-lg px-3 py-2 text-sm text-[#8A97AA] focus:outline-none focus:border-[#F5A623]"
          >
            <option value="all">All Flags</option>
            <option value="flagged">Flagged</option>
            <option value="review">Review</option>
            <option value="ok">OK</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Claims',       value: claims.length.toString(),                          cls: 'text-white' },
          { label: 'Open / Under Review', value: openCount.toString(),                             cls: 'text-amber-400' },
          { label: 'Flagged',            value: flaggedCount.toString(),                           cls: 'text-red-400' },
          { label: 'Total Savings',      value: `GHS ${Math.round(totalSavings / 1000).toFixed(1)}k`, cls: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
            <p className="text-xs text-[#8A97AA]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-[#8A97AA] text-sm">No claims match current filters.</div>
      ) : (
        <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2E48]">
                  {['CLAIM', 'GARAGE / VEHICLE', 'ASSESSOR', 'INVOICE', 'OVERCHARGE', 'STATUS', 'SUBMITTED', 'FLAG'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((c) => {
                  const inv  = Number(c.invoiceAmount)
                  const diff = c.benchmarkAmount ? Math.max(0, inv - Number(c.benchmarkAmount)) : null
                  const pct  = c.benchmarkAmount && diff != null && diff > 0
                    ? ((diff / Number(c.benchmarkAmount)) * 100).toFixed(1)
                    : null
                  const vehicle = c.vehicleProfile
                    ? [c.vehicleProfile.make, c.vehicleProfile.model, c.vehicleProfile.year].filter(Boolean).join(' ')
                    : ''
                  return (
                    <tr key={c.id} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/assess/claims/${c.id}`} className="text-[#F5A623] font-mono text-xs font-semibold hover:underline">
                          {c.claimReference}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white">{c.garageName ?? '—'}</p>
                        {vehicle && <p className="text-xs text-[#8A97AA] mt-0.5">{vehicle}</p>}
                      </td>
                      <td className="px-5 py-4 text-[#8A97AA] text-xs">
                        {c.assessor?.name ?? c.assessor?.email ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-white font-mono">{inv.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {diff != null && diff > 0 ? (
                          <>
                            <p className="text-red-400 font-mono">+{Math.round(diff).toLocaleString()}</p>
                            {pct && <p className="text-xs text-[#8A97AA]">+{pct}%</p>}
                          </>
                        ) : <span className="text-green-400 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? STATUS_BADGE.open}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#8A97AA] text-xs">
                        {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FLAG_BADGE[c.flag] ?? FLAG_BADGE.ok}`}>
                          {c.flag.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
