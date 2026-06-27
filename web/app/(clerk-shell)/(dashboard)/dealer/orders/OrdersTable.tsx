'use client'

import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/brand/Badges'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@/lib/api'

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-xs">{order.id.slice(0, 10)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {order.items.map((i) => i.part.name).join(', ')}
            </TableCell>
            <TableCell>
              <StatusBadge status={order.status} />
            </TableCell>
            <TableCell>{formatCurrency(order.totalAmount, order.currency)}</TableCell>
            <TableCell className="space-x-2">
              {order.status === 'pending' && (
                <Button size="sm" onClick={() => updateStatus(order.id, 'confirmed')}>
                  Confirm
                </Button>
              )}
              {order.status === 'confirmed' && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'dispatched')}>
                  Dispatch
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
