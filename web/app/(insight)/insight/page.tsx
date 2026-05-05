'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Claim {
  id: string
  invoiceAmount: string
  benchmarkAmount: string | null
  flag: string
  status: string
  createdAt: string
  garageName: string | null
  lineItems?: { id: string; partName: string; invoicePrice: string; benchmarkLow: string | null; deviation: number | null; currency: string }[]
  assessor: { id: string; name: string | null; email: string }
}

const anomalyConfig = {
  CRITICAL: { cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  HIGH:     { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  MEDIUM:   { cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
}

function computeAssessorsFromClaims(claims: Claim[]) {
  const map = new Map<string, { name: string; claims: number; flagged: number; savings: number; lastActive: string }>()
  for (const c of claims) {
    const key  = c.assessor.email
    const name = c.assessor.name ?? c.assessor.email
    if (!map.has(key)) map.set(key, { name, claims: 0, flagged: 0, savings: 0, lastActive: c.createdAt })
    const s = map.get(key)!
    s.claims++
    if (c.flag === 'flagged') s.flagged++
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    if (diff > 0) s.savings += diff
    if (c.createdAt > s.lastActive) s.lastActive = c.createdAt
  }
  return Array.from(map.values()).sort((a, b) => b.claims - a.claims).slice(0, 5)
}

function computeTopAnomalies(claims: Claim[]) {
  const map = new Map<string, { garage: string; deviations: number[]; occ: number }>()
  for (const c of claims) {
    for (const li of c.lineItems ?? []) {
      const dev = li.deviation ?? 0
      if (dev <= 10) continue
      const key = li.partName.toLowerCase()
      if (!map.has(key)) map.set(key, { garage: c.garageName ?? 'Unknown', deviations: [], occ: 0 })
      const e = map.get(key)!
      e.deviations.push(dev)
      e.occ++
    }
  }
  return Array.from(map.entries())
    .map(([part, e]) => {
      const avg = e.deviations.reduce((s, d) => s + d, 0) / e.deviations.length
      const flag: 'CRITICAL' | 'HIGH' | 'MEDIUM' = avg > 50 ? 'CRITICAL' : avg > 30 ? 'HIGH' : 'MEDIUM'
      return { part: part.charAt(0).toUpperCase() + part.slice(1), garage: e.garage, avgDeviation: `+${avg.toFixed(1)}%`, occurrences: e.occ, flag }
    })
    .sort((a, b) => parseFloat(b.avgDeviation) - parseFloat(a.avgDeviation))
    .slice(0, 5)
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function computeMonthlyFromClaims(claims: Claim[]) {
  const now = new Date()
  const slots: { key: string; month: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    slots.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTH_LABELS[d.getMonth()] })
  }
  const map = new Map<string, { claims: number; savings: number }>()
  for (const s of slots) map.set(s.key, { claims: 0, savings: 0 })
  for (const c of claims) {
    const d = new Date(c.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const slot = map.get(key)
    if (!slot) continue
    slot.claims++
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    if (diff > 0) slot.savings += diff
  }
  return slots.map(({ key, month }) => ({ month, ...map.get(key)! }))
}

function computeOutcomesFromClaims(claims: Claim[]) {
  const total = claims.length
  if (total === 0) return null
  const ok      = claims.filter((c) => c.flag === 'ok').length
  const review  = claims.filter((c) => c.flag === 'review').length
  const flagged = claims.filter((c) => c.flag === 'flagged').length
  return [
    { label: 'Approved as-submitted',    pct: Math.round((ok      / total) * 100), color: 'bg-green-500' },
    { label: 'Approved with adjustment', pct: Math.round((review  / total) * 100), color: 'bg-amber-500' },
    { label: 'Flagged — awaiting action', pct: Math.round((flagged / total) * 100), color: 'bg-red-500' },
  ]
}

export default function InsightPage() {
  const { getToken } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  const fetchClaims = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json() as { data: Claim[] }
      setClaims(json.data)
    } catch { /* keep */ }
  }, [getToken, API_URL])

  useEffect(() => { fetchClaims() }, [fetchClaims])

  const assessors  = computeAssessorsFromClaims(claims)
  const anomalies  = computeTopAnomalies(claims)
  const monthly    = computeMonthlyFromClaims(claims)
  const maxClaims  = Math.max(...monthly.map((m) => m.claims), 1)
  const outcomes   = computeOutcomesFromClaims(claims)
  const lastMonth  = monthly.length > 0 ? monthly[monthly.length - 1].month : '—'

  const flagged       = claims.filter((c) => c.flag === 'flagged').length
  const totalSavings  = claims.reduce((s, c) => {
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    return s + Math.max(0, diff)
  }, 0)
  const partsCount = claims.reduce((s, c) => s + (c.lineItems?.length ?? 0), 0)
  const savingsStr = totalSavings >= 1000
    ? `GHS ${(totalSavings / 1000).toFixed(1)}k`
    : `GHS ${Math.round(totalSavings).toLocaleString()}`

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Insurance Intelligence</h1>
          <p className="text-[#8A97AA] text-sm mt-1">Enterprise Assurance Ltd · April 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="px-4 py-2 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm font-medium hover:border-white/20 hover:text-white transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Claims Processed',   val: claims.length > 0 ? claims.length.toString() : '—', sub: 'All time', color: 'text-white' },
          { label: 'Parts Validated',    val: partsCount > 0 ? partsCount.toString() : '—', sub: 'Across all claims', color: 'text-white' },
          { label: 'Flags Raised',       val: claims.length > 0 ? flagged.toString() : '—', sub: claims.length > 0 ? `${((flagged / claims.length) * 100).toFixed(1)}% of claims` : '', color: 'text-red-400' },
          { label: 'Savings Identified', val: claims.length > 0 ? savingsStr : '—', sub: 'vs submitted invoices', color: 'text-green-400' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-5">
            <p className="text-[#8A97AA] text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
            <p className="text-[#8A97AA] text-xs mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bar chart */}
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6">
          <h2 className="text-white font-semibold text-sm mb-6">Monthly Claims Volume</h2>
          <div className="flex items-end gap-3 h-36">
            {monthly.map((m) => {
              const h = Math.round((m.claims / maxClaims) * 100)
              const isCurrent = m.month === lastMonth
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[#8A97AA] text-[10px]">{m.claims}</span>
                  <div
                    className={`w-full rounded-t-md ${isCurrent ? 'bg-[#F5A623]' : 'bg-[#1E2E48]'}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className={`text-[10px] font-medium ${isCurrent ? 'text-amber-400' : 'text-[#8A97AA]'}`}>{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Savings vs Flags breakdown */}
        <div className="rounded-xl border border-[#1E2E48] bg-[#0D1E35] p-6">
          <h2 className="text-white font-semibold text-sm mb-6">Claim Outcomes — {lastMonth}</h2>
          <div className="flex flex-col gap-5">
            {(outcomes ?? [
              { label: 'Approved as-submitted',    pct: 0, color: 'bg-green-500' },
              { label: 'Approved with adjustment', pct: 0, color: 'bg-amber-500' },
              { label: 'Flagged — awaiting action', pct: 0, color: 'bg-red-500' },
            ]).map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#8A97AA] text-xs">{row.label}</span>
                  <span className="text-white text-xs font-bold">{row.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1E2E48] overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assessor activity table */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden mb-6">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Assessor Activity</h2>
          <Link href="/insight/assessors" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</Link>
        </div>
        <div className="grid grid-cols-[1.5fr_80px_80px_1fr_80px_1fr] gap-0">
          {['ASSESSOR', 'CLAIMS', 'FLAGGED', 'SAVINGS', 'ACCURACY', 'LAST ACTIVE'].map((h) => (
            <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}
          {assessors.map((a, i) => {
            const isLast = i === assessors.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={a.name} className="contents group">
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center gap-3`}>
                  <div className="w-7 h-7 rounded-full bg-[#1E2E48] flex items-center justify-center text-[#8A97AA] text-xs font-bold flex-shrink-0">
                    {a.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="text-white text-sm">{a.name}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-medium">{a.claims}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm font-medium ${a.flagged > 3 ? 'text-red-400' : a.flagged > 0 ? 'text-amber-400' : 'text-[#8A97AA]'}`}>
                    {a.flagged}
                  </span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-green-400 text-sm font-medium">{a.savings}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm">{a.accuracy}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{a.lastActive}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top anomalies */}
      <div className="rounded-xl border border-[#1E2E48] overflow-hidden">
        <div className="px-6 py-4 bg-[#0A1628] border-b border-[#1E2E48] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Top Pricing Anomalies</h2>
          <Link href="/insight/anomalies" className="text-amber-400 text-xs hover:underline underline-offset-2">View all</Link>
        </div>
        <div className="grid grid-cols-[2fr_1.5fr_1fr_80px_90px] gap-0">
          {['PART', 'GARAGE', 'AVG DEVIATION', 'OCCURRENCES', 'SEVERITY'].map((h) => (
            <div key={h} className="px-5 py-3 bg-[#0A1628] text-[#8A97AA] text-[10px] font-semibold tracking-widest uppercase border-b border-[#1E2E48]">
              {h}
            </div>
          ))}
          {anomalies.map((a, i) => {
            const ac = anomalyConfig[a.flag]
            const isLast = i === anomalies.length - 1
            const border = isLast ? '' : 'border-b border-[#1E2E48]'
            return (
              <div key={a.part + a.garage} className="contents group">
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm">{a.part}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-[#8A97AA] text-sm">{a.garage}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`text-sm font-bold ${a.flag === 'CRITICAL' ? 'text-red-400' : a.flag === 'HIGH' ? 'text-amber-400' : 'text-orange-400'}`}>
                    {a.avgDeviation}
                  </span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className="text-white text-sm font-medium">{a.occurrences}</span>
                </div>
                <div className={`px-5 py-4 ${border} bg-[#0D1E35] group-hover:bg-[#0F2240] transition-colors flex items-center`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${ac.cls}`}>{a.flag}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
