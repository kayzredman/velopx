'use client'

import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/brand/Badges'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Delivery } from '@/lib/api'

export function DispatchTable({ deliveries }: { deliveries: Delivery[] }) {
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
          <TableHead>Delivery</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deliveries.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-mono text-xs">{d.id.slice(0, 10)}</TableCell>
            <TableCell>{d.order.buyer?.name ?? d.order.buyer?.email ?? '—'}</TableCell>
            <TableCell>
              <StatusBadge status={d.status} />
            </TableCell>
            <TableCell>
              {d.status === 'pending' && (
                <Button size="sm" variant="outline" disabled>
                  Assign Driver
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
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-mono text-xs">{o.id.slice(0, 10)}</TableCell>
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
