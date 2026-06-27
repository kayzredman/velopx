'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PartCard } from '@/components/parts/PartCard'
import type { Part } from '@/lib/api'

export function MarketplaceCatalogue() {
  const [q, setQ] = useState('')
  const [parts, setParts] = useState<Part[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (search: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '48' })
      if (search) params.set('q', search)
      const res = await fetch(`/api/parts/marketplace?${params}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setParts(json.data)
      setTotal(json.meta?.total ?? json.data.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load('')
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          All listings from every dealer on the platform — {total} parts
        </p>
        <form
          className="mt-4 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            load(q)
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, OEM, or description…"
            className="max-w-md"
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading marketplace…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {parts.map((part) => (
          <PartCard key={part.id} part={part} href={`/catalogue/${part.id}`} />
        ))}
      </div>

      {!loading && parts.length === 0 && (
        <p className="text-center text-muted-foreground">No parts match your search.</p>
      )}
    </div>
  )
}
