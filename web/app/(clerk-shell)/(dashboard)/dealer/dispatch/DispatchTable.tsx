'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { useCallback, useState } from 'react'
import { StatusBadge } from '@/components/brand/Badges'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Delivery } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface Driver {
  id: string
  name: string | null
  email: string
}

function AssignDriverCell({ deliveryId }: { deliveryId: string }) {
  const { getToken } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadDrivers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Failed to load drivers (${res.status})`)
      const json = await res.json()
      setDrivers(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  async function assignDriver() {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'assigned', driverId: selectedId }),
      })
      if (!res.ok) throw new Error(`Assign failed (${res.status})`)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign driver')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setOpen(true)
          loadDrivers()
        }}
      >
        Assign Driver
      </Button>
    )
  }

  return (
    <div className="space-y-2 min-w-[220px]">
      {loading && drivers.length === 0 ? (
        <p className="text-xs text-muted-foreground">Loading drivers…</p>
      ) : drivers.length === 0 ? (
        <p className="text-xs text-muted-foreground">No drivers available.</p>
      ) : (
        <select
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Select driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name ?? d.email}
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={!selectedId || loading} onClick={assignDriver}>
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function DispatchTable({ deliveries }: { deliveries: Delivery[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Delivery</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deliveries.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-mono text-xs">{d.id.slice(0, 10)}</TableCell>
            <TableCell>{d.order.buyer?.name ?? d.order.buyer?.email ?? '—'}</TableCell>
            <TableCell>{d.driver?.name ?? d.driver?.email ?? '—'}</TableCell>
            <TableCell>
              <StatusBadge status={d.status} />
            </TableCell>
            <TableCell className="space-y-2">
              {d.status === 'pending' && <AssignDriverCell deliveryId={d.id} />}
              {d.order?.id && (
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/dealer/orders/${d.order.id}`}>View order</Link>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PendingOrdersTable({
  orders,
}: {
  orders: Array<{ id: string; status: string; buyer?: { name: string | null } }>
}) {
  const router = useRouter()

  async function createDelivery(orderId: string) {
    await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    router.refresh()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-mono text-xs">{o.id.slice(0, 10)}</TableCell>
            <TableCell>{o.buyer?.name ?? '—'}</TableCell>
            <TableCell>
              <StatusBadge status={o.status} />
            </TableCell>
            <TableCell>
              <Button size="sm" onClick={() => createDelivery(o.id)}>
                Create Delivery
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
