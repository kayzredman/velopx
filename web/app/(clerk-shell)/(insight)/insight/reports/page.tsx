'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Claim {
  id: string
  claimReference: string
  garageName: string | null
  invoiceAmount: string
  benchmarkAmount: string | null
  currency: string
  flag: string
  status: string
  outcome: string | null
  createdAt: string
  lineItems: unknown[]
  assessor: { name: string | null; email: string }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportPdf(filename: string, claims: Claim[], type: string, currency: string, flaggedCount: number, totalSavings: number) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${type} — VelopX Insight Report</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; padding: 32px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
  .summary { display: flex; gap: 32px; margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px; }
  .stat { text-align: center; }
  .stat-val { font-size: 20px; font-weight: 700; }
  .stat-lbl { font-size: 11px; color: #888; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px 4px; font-size: 10px; text-transform: uppercase; color: #888; }
  td { padding: 7px 4px; border-bottom: 1px solid #eee; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .flagged { background: #fee; color: #c00; }
  .ok { background: #efe; color: #060; }
  .review { background: #fff3cd; color: #664d03; }
  .footer { font-size: 11px; color: #aaa; text-align: center; margin-top: 32px; }
  @media print { body { padding: 0 } }
</style>
</head>
<body>
<h1>VelopX Insight Report — ${type}</h1>
<p class="sub">Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
<div class="summary">
  <div class="stat"><div class="stat-val">${claims.length}</div><div class="stat-lbl">Total Claims</div></div>
  <div class="stat"><div class="stat-val" style="color:#c00">${flaggedCount}</div><div class="stat-lbl">Flagged</div></div>
  <div class="stat"><div class="stat-val" style="color:#060">${currency} ${Math.round(totalSavings).toLocaleString()}</div><div class="stat-lbl">Total Savings</div></div>
</div>
<table>
<thead><tr><th>Ref</th><th>Garage</th><th>Assessor</th><th>Invoice</th><th>Benchmark</th><th>Flag</th><th>Status</th><th>Date</th></tr></thead>
<tbody>
${claims.map((c) => `<tr>
  <td>${c.claimReference}</td>
  <td>${c.garageName ?? '—'}</td>
  <td>${c.assessor?.name ?? c.assessor?.email ?? '—'}</td>
  <td>${c.currency} ${Number(c.invoiceAmount).toLocaleString()}</td>
  <td>${c.benchmarkAmount ? `${c.currency} ${Number(c.benchmarkAmount).toLocaleString()}` : '—'}</td>
  <td><span class="badge ${c.flag}">${c.flag}</span></td>
  <td>${c.status}</td>
  <td>${new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
</tr>`).join('')}
</tbody>
</table>
<p class="footer">VelopX — Auto Parts Intelligence Platform | Confidential | ${filename}</p>
<script>window.onload = function(){ window.print(); }</script>
</body></html>`
  const win = window.open('', '_blank', 'width=1000,height=720')
  if (win) { win.document.write(html); win.document.close() }
}

export default function InsightReports() {
  const { getToken }          = useAuth()
  const [claims, setClaims]   = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

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

  const flaggedCount = claims.filter((c) => c.flag === 'flagged').length
  const totalSavings = claims.reduce((s, c) => {
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    return s + Math.max(0, diff)
  }, 0)
  const currency = claims[0]?.currency ?? 'GHS'

  const reports = [
    {
      title: `All Claims Export (${claims.length} records)`,
      type: 'Full Dataset',
      claims: claims.length,
      flags: flaggedCount,
      savings: totalSavings,
      onExportPdf: () => exportPdf(`claims-all-${new Date().toISOString().slice(0,10)}.pdf`, claims, 'Full Dataset', currency, flaggedCount, totalSavings),
      onExportJson: () => downloadJson(`claims-all-${new Date().toISOString().slice(0,10)}.json`, { exportedAt: new Date().toISOString(), claims }),
    },
    {
      title: `Flagged Claims Export (${flaggedCount} records)`,
      type: 'Flagged Only',
      claims: flaggedCount,
      flags: flaggedCount,
      savings: totalSavings,
      onExportPdf: () => exportPdf(`claims-flagged-${new Date().toISOString().slice(0,10)}.pdf`, claims.filter((c) => c.flag === 'flagged'), 'Flagged Only', currency, flaggedCount, totalSavings),
      onExportJson: () => downloadJson(`claims-flagged-${new Date().toISOString().slice(0,10)}.json`, { exportedAt: new Date().toISOString(), claims: claims.filter((c) => c.flag === 'flagged') }),
    },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Reports</h1>
          <p className="text-sm text-[#8A97AA] mt-1">Export platform intelligence as PDF or JSON audit datasets</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-6 text-center">
            <div><p className="text-white font-semibold">{claims.length}</p><p className="text-xs text-[#8A97AA]">Total Claims</p></div>
            <div><p className="text-red-400 font-semibold">{flaggedCount}</p><p className="text-xs text-[#8A97AA]">Flagged</p></div>
            <div><p className="text-green-400 font-semibold">{currency} {Math.round(totalSavings).toLocaleString()}</p><p className="text-xs text-[#8A97AA]">Total Savings</p></div>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 rounded-xl bg-[#0D1E35] animate-pulse" />)}</div>
      )}

      {!loading && (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.title} className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-5 flex items-center gap-6 hover:border-[#2a3e5c] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#1E2E48] flex items-center justify-center shrink-0">
                <svg className="text-[#F5A623]" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{r.title}</p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1E2E48] text-[#8A97AA]">{r.type}</span>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-8 text-center shrink-0">
                <div><p className="text-white font-semibold">{r.claims}</p><p className="text-xs text-[#8A97AA]">Claims</p></div>
                <div><p className="text-red-400 font-semibold">{r.flags}</p><p className="text-xs text-[#8A97AA]">Flagged</p></div>
                <div><p className="text-green-400 font-semibold">{currency} {Math.round(r.savings).toLocaleString()}</p><p className="text-xs text-[#8A97AA]">Savings</p></div>
              </div>
              <div className="shrink-0 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={r.onExportPdf}
                  className="text-xs bg-[#1E2E48] hover:bg-[#2a3e5c] text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={r.onExportJson}
                  className="text-xs bg-[#1E2E48] hover:bg-[#2a3e5c] text-[#8A97AA] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Export JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
