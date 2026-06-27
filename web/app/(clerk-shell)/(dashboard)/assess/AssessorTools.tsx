'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface Benchmark {
  floor: number
  average: number
  ceiling: number
  currency: string
  source: string
  confidence: string
}

export function AssessorTools() {
  const [oem, setOem] = useState('53711-42200')
  const [invoice, setInvoice] = useState('')
  const [claimRef, setClaimRef] = useState('')
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null)
  const [flag, setFlag] = useState<string | null>(null)
  const [deviation, setDeviation] = useState<number | null>(null)
  const [exportData, setExportData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runBenchmark() {
    setError(null)
    try {
      const res = await fetch(`/api/benchmark?oem=${encodeURIComponent(oem)}&condition=oem&country=GH`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setBenchmark(json.data)

      if (invoice) {
        const amount = parseFloat(invoice)
        const dev = ((amount - json.data.average) / json.data.average) * 100
        setDeviation(dev)
        if (amount > json.data.ceiling) setFlag('CRITICAL')
        else if (amount > json.data.average * 1.15) setFlag('HIGH')
        else if (amount < json.data.floor) setFlag('LOW')
        else setFlag('OK')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed')
    }
  }

  async function exportAudit() {
    if (!claimRef) return
    setError(null)
    try {
      const res = await fetch(`/api/audit/export?claimReference=${encodeURIComponent(claimRef)}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setExportData(JSON.stringify(json.data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="bg-navy-900">
        <CardHeader>
          <CardTitle>Invoice Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={oem} onChange={(e) => setOem(e.target.value)} placeholder="OEM part number" />
          <Input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="Invoice amount" type="number" />
          <Button onClick={runBenchmark}>Compare to Benchmark</Button>
          {benchmark && (
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <p>Floor: {formatCurrency(benchmark.floor, benchmark.currency)}</p>
              <p>Average: {formatCurrency(benchmark.average, benchmark.currency)}</p>
              <p>Ceiling: {formatCurrency(benchmark.ceiling, benchmark.currency)}</p>
              <p className="text-muted-foreground">Source: {benchmark.source} · Confidence: {benchmark.confidence}</p>
              {flag && (
                <Badge variant={flag === 'CRITICAL' || flag === 'HIGH' ? 'danger' : flag === 'OK' ? 'success' : 'warning'}>
                  {flag} {deviation !== null && `(${deviation.toFixed(1)}%)`}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-navy-900">
        <CardHeader>
          <CardTitle>Audit Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={claimRef} onChange={(e) => setClaimRef(e.target.value)} placeholder="Claim reference (e.g. CLM-2026-00123)" />
          <Button variant="outline" onClick={exportAudit}>
            Export Claim Audit Report
          </Button>
          {exportData && (
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-navy-950 p-4 text-xs">{exportData}</pre>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
