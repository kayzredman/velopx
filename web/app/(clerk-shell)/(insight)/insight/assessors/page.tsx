'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface LineItem { invoicePrice: string; benchmarkLow: string | null }
interface Claim {
  id: string
  flag: string
  invoiceAmount: string
  benchmarkAmount: string | null
  createdAt: string
  lineItems: LineItem[]
  assessor: { id: string; name: string | null; email: string }
}

interface AssessorStat {
  id: string
  name: string
  email: string
  claims: number
  flagged: number
  savings: number
  lastActive: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

function initials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function computeAssessors(claims: Claim[]): AssessorStat[] {
  const map = new Map<string, AssessorStat>()
  for (const c of claims) {
    const a = c.assessor
    if (!map.has(a.id)) {
      map.set(a.id, {
        id: a.id,
        name: a.name ?? a.email,
        email: a.email,
        claims: 0,
        flagged: 0,
        savings: 0,
        lastActive: c.createdAt,
      })
    }
    const s = map.get(a.id)!
    s.claims++
    if (c.flag === 'flagged') s.flagged++
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    if (diff > 0) s.savings += diff
    if (c.createdAt > s.lastActive) s.lastActive = c.createdAt
  }
  return Array.from(map.values()).sort((a, b) => b.claims - a.claims)
}

export default function InsightAssessors() {
  const { getToken }              = useAuth()
  const [claims, setClaims]       = useState<Claim[]>([])
  const [loading, setLoading]     = useState(true)

  const fetchClaims = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims?limit=500`, {
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

  const assessors = computeAssessors(claims)
  const totalSavings = assessors.reduce((s, a) => s + a.savings, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Assessors</h1>
          <p className="text-sm text-[#8A97AA] mt-1">Performance overview derived from real claims data</p>
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Assessors', value: String(assessors.length), color: 'text-white' },
            { label: 'Total Claims',    value: String(claims.length),     color: 'text-white' },
            { label: 'Total Savings',   value: totalSavings >= 1000 ? `GHS ${(totalSavings/1000).toFixed(1)}k` : `GHS ${Math.round(totalSavings)}`, color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-4">
              <p className="text-xs text-[#8A97AA]">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-[#0D1E35] animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && assessors.length === 0 && (
        <div className="text-center py-16 text-[#8A97AA] text-sm">No assessor activity yet.</div>
      )}

      {/* Assessor rows */}
      {!loading && assessors.length > 0 && (
        <div className="space-y-3">
          {assessors.map((a) => (
            <div key={a.id} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-5 flex items-center gap-6 hover:border-[#2a3e5c] transition-colors">
              <div className="w-11 h-11 rounded-full bg-[#1E2E48] flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#F5A623]">{initials(a.name, a.email)}</span>
              </div>
              <div className="w-48 shrink-0 min-w-0">
                <p className="text-white font-medium text-sm truncate">{a.name}</p>
                <p className="text-xs text-[#8A97AA] truncate">{a.email}</p>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-white font-semibold">{a.claims}</p>
                  <p className="text-xs text-[#8A97AA]">Claims</p>
                </div>
                <div>
                  <p className="text-red-400 font-semibold">{a.flagged}</p>
                  <p className="text-xs text-[#8A97AA]">Flagged</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold">
                    {a.savings > 0 ? `GHS ${(a.savings/1000).toFixed(1)}k` : '—'}
                  </p>
                  <p className="text-xs text-[#8A97AA]">Savings</p>
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {a.claims > 0 ? `${Math.round((1 - a.flagged / a.claims) * 100)}%` : '—'}
                  </p>
                  <p className="text-xs text-[#8A97AA]">Clean rate</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-[#8A97AA]">
                  Last: {new Date(a.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
