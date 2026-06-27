'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Garage {
  id: string
  name: string | null
  email: string
  role: string
  quoteCount: number
  orderCount: number
  createdAt: string
}

export function GarageDirectory() {
  const [q, setQ] = useState('')
  const [garages, setGarages] = useState<Garage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (search: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (search) params.set('q', search)
      const res = await fetch(`/api/directory/garages?${params}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setGarages(json.data)
      setTotal(json.meta?.total ?? json.data.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load garages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load('')
  }, [load])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{total} registered garages on velopX</p>
      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          load(q)
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="max-w-md"
        />
        <Button type="submit">Search</Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading garages…</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {garages.map((g) => (
          <Card key={g.id} className="bg-navy-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{g.name ?? 'Unnamed garage'}</p>
                <Badge variant="outline">{g.role.replace('_', ' ')}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{g.email}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {g.quoteCount} RFQs · {g.orderCount} orders
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
