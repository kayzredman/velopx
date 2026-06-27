import Link from 'next/link'
import { apiFetch, type Order, type Quote } from '@/lib/api'
import { MetricCard } from '@/components/brand/MetricCard'
import { PageHeader } from '@/components/brand/PageHeader'
import { StatusBadge } from '@/components/brand/Badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

async function getDealerStats() {
  try {
    const [partsRes, ordersRes, quotesRes] = await Promise.all([
      apiFetch<{ data: unknown[]; meta: { total: number } }>('/v1/parts/mine?limit=1'),
      apiFetch<{ data: Order[] }>('/v1/orders/for-dealer'),
      apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer'),
    ])

    const openOrders = ordersRes.data.filter((o) =>
      ['pending', 'confirmed', 'dispatched'].includes(o.status)
    ).length
    const pendingQuotes = quotesRes.data.filter((q) => q.status === 'pending').length

    return {
      activeListings: partsRes.meta?.total ?? 0,
      openOrders,
      pendingQuotes,
      recentOrders: ordersRes.data.slice(0, 5),
      pendingQuoteList: quotesRes.data.filter((q) => q.status === 'pending').slice(0, 3),
      error: null as string | null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load dashboard'
    console.error('[DealerDashboard]', message)
    return {
      activeListings: 0,
      openOrders: 0,
      pendingQuotes: 0,
      recentOrders: [] as Order[],
      pendingQuoteList: [] as Quote[],
      error: message,
    }
  }
}

export default async function DealerDashboard() {
  const stats = await getDealerStats()

  return (
    <div className="space-y-8">
      <PageHeader title="Dealer Dashboard" subtitle="Manage your parts catalogue, orders, and dispatch" />

      {stats.error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">
            Could not load dashboard data: {stats.error}
          </CardContent>
        </Card>
      )}

      {stats.pendingQuotes > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold text-primary">{stats.pendingQuotes} pending RFQ(s)</p>
              <p className="text-sm text-muted-foreground">Garages are waiting for your quote response</p>
            </div>
            <Button asChild>
              <Link href="/dealer/rfqs">View RFQs</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active Listings" value={stats.activeListings} accent />
        <MetricCard label="Pending RFQs" value={stats.pendingQuotes} />
        <MetricCard label="Open Orders" value={stats.openOrders} />
        <MetricCard label="Avg Quote Time" value="< 2h" hint="Target SLA" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-navy-900">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount, order.currency)}</TableCell>
                  </TableRow>
                ))}
                {stats.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No orders yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-navy-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/dealer/parts">+ Add a Part</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dealer/orders">View All Orders</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dealer/dispatch">Manage Dispatch</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
