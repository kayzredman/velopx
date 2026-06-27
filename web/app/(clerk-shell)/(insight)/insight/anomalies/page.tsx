'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface LineItem {
  id: string
  partName: string
  oemNumber: string | null
  invoicePrice: string
  benchmarkLow: string | null
  deviation: number | null
  currency: string
}

interface Claim {
  id: string
  garageName: string | null
  claimReference: string
  createdAt: string
  lineItems: LineItem[]
}

interface Anomaly {
  partName: string
  oemNumber: string | null
  garages: string[]
  occurrences: number
  avgDeviation: number
  benchmarkAvg: number
  invoiceAvg: number
  currency: string
  lastSeen: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

function computeAnomalies(claims: Claim[]): Anomaly[] {
  // Collect all line items with a deviation > 10%
  const map = new Map<string, {
    oemNumber: string | null
    garages: Set<string>
    invoices: number[]
    benchmarks: number[]
    deviations: number[]
    currency: string
    lastSeen: string
  }>()

  for (const claim of claims) {
    for (const li of claim.lineItems) {
      const dev = li.deviation ?? 0
      if (dev <= 10) continue // only anomalous items
      const key = li.partName.toLowerCase()
      if (!map.has(key)) {
        map.set(key, {
          oemNumber: li.oemNumber,
          garages: new Set(),
          invoices: [],
          benchmarks: [],
          deviations: [],
          currency: li.currency,
          lastSeen: claim.createdAt,
        })
      }
      const e = map.get(key)!
      e.garages.add(claim.garageName ?? 'Unknown Garage')
      e.invoices.push(Number(li.invoicePrice))
      const bm = li.benchmarkLow ? Number(li.benchmarkLow) : Number(li.invoicePrice) / (1 + dev / 100)
      e.benchmarks.push(bm)
      e.deviations.push(dev)
      if (claim.createdAt > e.lastSeen) e.lastSeen = claim.createdAt
    }
  }

  const anomalies: Anomaly[] = []
  for (const [partName, e] of map.entries()) {
    if (e.deviations.length === 0) continue
    const avgDev = e.deviations.reduce((s, d) => s + d, 0) / e.deviations.length
    const invoiceAvg = e.invoices.reduce((s, v) => s + v, 0) / e.invoices.length
    const benchmarkAvg = e.benchmarks.reduce((s, v) => s + v, 0) / e.benchmarks.length
    const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = avgDev > 50 ? 'CRITICAL' : avgDev > 30 ? 'HIGH' : 'MEDIUM'
    anomalies.push({
      partName: partName.charAt(0).toUpperCase() + partName.slice(1),
      oemNumber: e.oemNumber,
      garages: Array.from(e.garages),
      occurrences: e.deviations.length,
      avgDeviation: Math.round(avgDev * 10) / 10,
      benchmarkAvg: Math.round(benchmarkAvg),
      invoiceAvg: Math.round(invoiceAvg),
      currency: e.currency,
      lastSeen: e.lastSeen,
      severity,
    })
  }

  return anomalies.sort((a, b) => b.avgDeviation - a.avgDeviation)
}

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400 border border-red-500/30',
  HIGH:     'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  MEDIUM:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}

export default function InsightAnomalies() {
  const { getToken }            = useAuth()
  const [claims, setClaims]     = useState<Claim[]>([])
  const [loading, setLoading]   = useState(true)

  const fetchClaims = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims?flag=flagged&limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Claim[] }
      setClaims(json.data)
    } catch { /* keep */ } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { void fetchClaims() }, [fetchClaims])

  const anomalies = computeAnomalies(claims)
  const critical  = anomalies.filter((a) => a.severity === 'CRITICAL').length
  const high      = anomalies.filter((a) => a.severity === 'HIGH').length
  const topAnomaly = anomalies[0]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Pricing Anomalies</h1>
        <p className="text-sm text-[#8A97AA] mt-1">Overcharging patterns detected from flagged claims</p>
      </div>

      {!loading && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Anomaly Patterns', value: String(anomalies.length), color: 'text-white' },
            { label: 'Critical',         value: String(critical),         color: 'text-red-400' },
            { label: 'High Severity',    value: String(high),             color: 'text-orange-400' },
            { label: 'Total Occurrences',value: String(anomalies.reduce((s,a) => s + a.occurrences, 0)), color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
              <p className="text-xs text-[#8A97AA]">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-[#0D1E35] animate-pulse" />)}</div>
      )}

      {!loading && topAnomaly && critical > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
          <svg className="text-red-400 mt-0.5 shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-300">
              {critical} critical anomaly pattern{critical !== 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              {topAnomaly.partName} is invoiced at +{topAnomaly.avgDeviation.toFixed(1)}% above benchmark across {topAnomaly.occurrences} claim{topAnomaly.occurrences !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      {!loading && anomalies.length === 0 && (
        <div className="text-center py-16 text-[#8A97AA] text-sm">No pricing anomalies detected yet.</div>
      )}

      {!loading && anomalies.length > 0 && (
        <div className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2E48]">
                  {['PART NAME', 'GARAGES', 'OCCURRENCES', 'AVG DEVIATION', 'BENCHMARK', 'INVOICE', 'LAST SEEN', 'SEVERITY'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[#8A97AA] px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, i) => (
                  <tr key={i} className="border-b border-[#1E2E48] last:border-0 hover:bg-[#1E2E48]/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{a.partName}</p>
                      {a.oemNumber && <p className="text-xs text-[#8A97AA] font-mono mt-0.5">{a.oemNumber}</p>}
                    </td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs">{a.garages.slice(0,2).join(', ')}{a.garages.length > 2 ? ` +${a.garages.length - 2}` : ''}</td>
                    <td className="px-5 py-4 text-white font-semibold">{a.occurrences}</td>
                    <td className="px-5 py-4 text-red-400 font-mono font-semibold">+{a.avgDeviation.toFixed(1)}%</td>
                    <td className="px-5 py-4 text-[#8A97AA] font-mono">{a.currency} {a.benchmarkAvg.toLocaleString()}</td>
                    <td className="px-5 py-4 text-white font-mono">{a.currency} {a.invoiceAvg.toLocaleString()}</td>
                    <td className="px-5 py-4 text-[#8A97AA] text-xs">{new Date(a.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_BADGE[a.severity]}`}>{a.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
