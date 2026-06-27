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
  outcome: string | null
  status: string
  createdAt: string
  updatedAt: string
  parts: Array<{ name: string; invoicePrice: string; benchmarkPrice: string | null }> | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

const FLAG_BADGE: Record<string, string> = {
  flagged: 'bg-red-500/15 text-red-400 border border-red-500/30',
  review:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ok:      'bg-green-500/15 text-green-400 border border-green-500/30',
}

function downloadJson(claim: Claim) {
  const blob = new Blob([JSON.stringify(claim, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `claim-${claim.claimReference}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPdf(claim: Claim) {
  const parts = claim.parts ?? []
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Claim ${claim.claimReference} — VelopX Report</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; padding: 32px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-bottom: 24px; }
  .label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.08em; margin-bottom: 2px; }
  .value { font-size: 14px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
  th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px 4px; font-size: 11px; text-transform: uppercase; color: #888; }
  td { padding: 8px 4px; border-bottom: 1px solid #eee; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .flagged { background: #fee; color: #c00; }
  .ok { background: #efe; color: #060; }
  .review { background: #fff3cd; color: #664d03; }
  .footer { font-size: 11px; color: #aaa; text-align: center; margin-top: 32px; }
  @media print { body { padding: 0 } }
</style>
</head>
<body>
<h1>VelopX Claim Report</h1>
<p class="sub">Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
<div class="grid">
  <div><div class="label">Claim Reference</div><div class="value">${claim.claimReference}</div></div>
  <div><div class="label">Status</div><div class="value">${claim.status}</div></div>
  <div><div class="label">Flag</div><div class="value"><span class="badge ${claim.flag}">${claim.flag}</span></div></div>
  <div><div class="label">Outcome</div><div class="value">${claim.outcome ?? '—'}</div></div>
  <div><div class="label">Invoice Amount</div><div class="value">${claim.currency} ${Number(claim.invoiceAmount).toLocaleString()}</div></div>
  <div><div class="label">Benchmark Amount</div><div class="value">${claim.benchmarkAmount ? `${claim.currency} ${Number(claim.benchmarkAmount).toLocaleString()}` : '—'}</div></div>
  <div><div class="label">Garage</div><div class="value">${claim.garageName ?? '—'}</div></div>
  <div><div class="label">Created</div><div class="value">${new Date(claim.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
</div>
${parts.length > 0 ? `
<table>
<thead><tr><th>Part</th><th>Invoice</th><th>Benchmark</th><th>Diff</th></tr></thead>
<tbody>
${parts.map((p) => {
  const inv = Number(p.invoicePrice)
  const bench = p.benchmarkPrice != null ? Number(p.benchmarkPrice) : null
  const diff = bench != null ? inv - bench : null
  return `<tr>
    <td>${p.name}</td>
    <td>${claim.currency} ${inv.toLocaleString()}</td>
    <td>${bench != null ? `${claim.currency} ${bench.toLocaleString()}` : '—'}</td>
    <td style="color:${diff != null && diff > 0 ? '#c00' : '#060'}">${diff != null ? (diff > 0 ? '+' : '') + diff.toLocaleString() : '—'}</td>
  </tr>`
}).join('')}
</tbody>
</table>` : ''}
<p class="footer">VelopX — Auto Parts Intelligence Platform | Confidential</p>
<script>window.onload = function(){ window.print(); }</script>
</body></html>`
  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

export default function AssessReports() {
  const { getToken }          = useAuth()
  const [claims, setClaims]   = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClaims = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/claims?limit=50`, {
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
  const totalSavings = claims.reduce((sum, c) => {
    const diff = Number(c.invoiceAmount) - Number(c.benchmarkAmount ?? c.invoiceAmount)
    return sum + Math.max(0, diff)
  }, 0)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Reports</h1>
          <p className="text-sm text-[#8A97AA] mt-1">
            Assessment records — export any claim as a PDF audit report
          </p>
        </div>
        {!loading && claims.length > 0 && (
          <div className="flex items-center gap-6 text-center">
            <div>
              <p className="text-white font-semibold">{claims.length}</p>
              <p className="text-xs text-[#8A97AA]">Total Claims</p>
            </div>
            <div>
              <p className="text-red-400 font-semibold">{flaggedCount}</p>
              <p className="text-xs text-[#8A97AA]">Flagged</p>
            </div>
            <div>
              <p className="text-green-400 font-semibold">
                {claims[0]?.currency ?? 'GHS'} {Math.round(totalSavings).toLocaleString()}
              </p>
              <p className="text-xs text-[#8A97AA]">Total Savings</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#0D1E35] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && claims.length === 0 && (
        <div className="text-center py-16 text-[#8A97AA] text-sm">
          No assessment records yet. Claims you assess will appear here.
        </div>
      )}

      {/* Claims list */}
      {!loading && claims.length > 0 && (
        <div className="space-y-3">
          {claims.map((c) => (
            <div
              key={c.id}
              className="bg-[#0D1E35] border border-[#1E2E48] rounded-xl p-5 flex items-center gap-6 hover:border-[#2a3e5c] transition-colors"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#1E2E48] flex items-center justify-center shrink-0">
                <svg className="text-[#F5A623]" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium text-sm">{c.claimReference}</p>
                  {c.garageName && (
                    <span className="text-xs text-[#8A97AA]">— {c.garageName}</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${FLAG_BADGE[c.flag] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}>
                    {c.flag}
                  </span>
                </div>
                <p className="text-xs text-[#8A97AA] mt-1">
                  {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {c.outcome && <span className="ml-2 capitalize">· Outcome: {c.outcome}</span>}
                </p>
              </div>

              {/* Amounts */}
              <div className="hidden lg:flex items-center gap-8 text-center shrink-0">
                <div>
                  <p className="text-white font-semibold font-mono">
                    {c.currency} {Number(c.invoiceAmount).toLocaleString()}
                  </p>
                  <p className="text-xs text-[#8A97AA]">Invoice</p>
                </div>
                {c.benchmarkAmount && (
                  <div>
                    <p className="text-green-400 font-semibold font-mono">
                      {c.currency} {Number(c.benchmarkAmount).toLocaleString()}
                    </p>
                    <p className="text-xs text-[#8A97AA]">Benchmark</p>
                  </div>
                )}
              </div>

              {/* Download */}
              <div className="shrink-0 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => exportPdf(c)}
                  className="text-xs bg-[#1E2E48] hover:bg-[#2a3e5c] text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadJson(c)}
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

