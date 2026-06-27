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
  flag: string
  outcome: string | null
  updatedAt: string
}

const FLAG_BADGE: Record<string, string> = {
  flagged: 'bg-red-500/15 text-red-400 border border-red-500/30',
  review:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ok:      'bg-green-500/15 text-green-400 border border-green-500/30',
}

const OUTCOME_CLS: Record<string, string> = {
  approved: 'text-green-400',
  adjusted: 'text-amber-400',
  rejected: 'text-red-400',
}

export default function AssessHistory() {
  const { getToken } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchHistory = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Claim[] }
      // History = closed claims only
      setClaims(json.data.filter((c) => (c as unknown as { status: string }).status === 'closed'))
    } catch { /* keep */ }
  }, [getToken, API_URL])

  useEffect(() => {
    fetchHistory().finally(() => setLoading(false))
  }, [fetchHistory])

  const flaggedCount  = claims.filter((c) => c.flag === 'flagged').length
  const totalSavings  = claims.reduce((sum, c) => {
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    return sum + Math.max(0, diff)
  }, 0)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Assessment History</h1>
          <p className="text-sm text-[#8A97AA] mt-1">All closed claims assessed by your account</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Closed',   value: claims.length.toString(),                       cls: 'text-white' },
          { label: 'Flagged',        value: flaggedCount.toString(),                         cls: 'text-red-400' },
          { label: 'Total Savings',  value: `GHS ${Math.round(totalSavings).toLocaleString()}`, cls: 'text-green-400' },
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
      ) : claims.length === 0 ? (
        <div className="text-center py-16 text-[#8A97AA] text-sm">No closed claims yet.</div>
      ) : (
        <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2E48]">
                {['CLAIM REF', 'GARAGE / VEHICLE', 'INVOICE', 'BENCHMARK', 'OVERCHARGE', 'OUTCOME', 'CLOSED', 'FLAG'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const invoice = Number(c.invoiceAmount)
                const bench   = Number(c.benchmarkAmount ?? 0)
                const diff    = bench > 0 ? invoice - bench : null
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
                    <td className="px-5 py-4 text-white font-mono">{invoice.toLocaleString()}</td>
                    <td className="px-5 py-4 text-[#8A97AA] font-mono">{bench > 0 ? bench.toLocaleString() : '—'}</td>
                    <td className="px-5 py-4">
                      {diff !== null && diff > 0 ? (
                        <>
                          <p className="text-red-400 font-mono">+{Math.round(diff).toLocaleString()}</p>
                          <p className="text-[#8A97AA] text-xs">{((diff / bench) * 100).toFixed(1)}%</p>
                        </>
                      ) : <span className="text-green-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {c.outcome ? (
                        <span className={`text-sm font-medium ${OUTCOME_CLS[c.outcome] ?? 'text-[#8A97AA]'}`}>
                          {c.outcome.charAt(0).toUpperCase() + c.outcome.slice(1)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs">
                      {new Date(c.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${FLAG_BADGE[c.flag] ?? FLAG_BADGE.ok}`}>
                        {c.flag.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
