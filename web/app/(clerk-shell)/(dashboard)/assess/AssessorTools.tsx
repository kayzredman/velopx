'use client'

import { useState } from 'react'
import { FileJson, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Invoice Validation</CardTitle>
              <CardDescription className="mt-1">
                Compare a quoted or invoiced amount against regional OEM benchmarks.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="oem">OEM part number</Label>
              <Input id="oem" value={oem} onChange={(e) => setOem(e.target.value)} placeholder="e.g. 53711-42200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice">Invoice amount</Label>
              <Input
                id="invoice"
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
                placeholder="Amount to validate"
                type="number"
              />
            </div>
          </div>
          <Button onClick={runBenchmark} className="min-h-11">
            Compare to Benchmark
          </Button>
          {benchmark && (
            <div className="surface-inset space-y-3 p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Floor</p>
                  <p className="mt-1 font-semibold">{formatCurrency(benchmark.floor, benchmark.currency)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Average</p>
                  <p className="mt-1 font-semibold text-primary">{formatCurrency(benchmark.average, benchmark.currency)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ceiling</p>
                  <p className="mt-1 font-semibold">{formatCurrency(benchmark.ceiling, benchmark.currency)}</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                Source: {benchmark.source} · Confidence: {benchmark.confidence}
              </p>
              {flag && (
                <Badge variant={flag === 'CRITICAL' || flag === 'HIGH' ? 'danger' : flag === 'OK' ? 'success' : 'warning'}>
                  {flag} {deviation !== null && `(${deviation.toFixed(1)}%)`}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Audit Export</CardTitle>
              <CardDescription className="mt-1">
                Generate a structured JSON audit trail for a claim reference.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="claimRef">Claim reference</Label>
            <Input
              id="claimRef"
              value={claimRef}
              onChange={(e) => setClaimRef(e.target.value)}
              placeholder="e.g. CLM-2026-00123"
            />
          </div>
          <Button variant="outline" onClick={exportAudit} className="min-h-11">
            Export Claim Audit Report
          </Button>
          {exportData && (
            <pre className="surface-inset max-h-64 overflow-auto p-4 font-mono text-xs leading-relaxed">
              {exportData}
            </pre>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
