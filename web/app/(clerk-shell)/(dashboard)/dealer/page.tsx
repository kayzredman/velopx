import Link from 'next/link'
import { Package, Plus, ShoppingCart, Truck } from 'lucide-react'
import { apiFetch, type Order, type Quote } from '@/lib/api'
import { MetricCard } from '@/components/brand/MetricCard'
import { PageHeader } from '@/components/brand/PageHeader'
import { StatusBadge } from '@/components/brand/Badges'
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

type DealerStats = {
  activeListings: number | null
  openOrders: number | null
  pendingQuotes: number | null
  recentOrders: Order[]
  errors: string[]
  partialFailure: boolean
  totalFailure: boolean
}

async function getDealerStats(): Promise<DealerStats> {
  const [partsRes, ordersRes, quotesRes] = await Promise.allSettled([
    apiFetch<{ data: unknown[]; meta: { total: number } }>('/v1/parts/mine?limit=1'),
    apiFetch<{ data: Order[] }>('/v1/orders/for-dealer'),
    apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer'),
  ])

  const errors: string[] = []
  if (partsRes.status === 'rejected') errors.push(partsRes.reason instanceof Error ? partsRes.reason.message : 'Parts failed')
  if (ordersRes.status === 'rejected') errors.push(ordersRes.reason instanceof Error ? ordersRes.reason.message : 'Orders failed')
  if (quotesRes.status === 'rejected') errors.push(quotesRes.reason instanceof Error ? quotesRes.reason.message : 'Quotes failed')

  const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : []
  const quotes = quotesRes.status === 'fulfilled' ? quotesRes.value.data : []
  const activeListings =
    partsRes.status === 'fulfilled' ? (partsRes.value.meta?.total ?? partsRes.value.data.length) : null

  const openOrders =
    ordersRes.status === 'fulfilled'
      ? orders.filter((o) => ['pending', 'confirmed', 'dispatched'].includes(o.status)).length
      : null

  const pendingQuotes =
    quotesRes.status === 'fulfilled' ? quotes.filter((q) => q.status === 'pending').length : null

  const totalFailure = partsRes.status === 'rejected' && ordersRes.status === 'rejected' && quotesRes.status === 'rejected'
  const partialFailure = errors.length > 0 && !totalFailure

  return {
    activeListings,
    openOrders,
    pendingQuotes,
    recentOrders: orders.slice(0, 5),
    errors,
    partialFailure,
    totalFailure,
  }
}


export default async function DealerDashboard() {
  const stats = await getDealerStats()

  return (
    <div className="space-y-8">
      <PageHeader title="Dealer Dashboard" subtitle="Manage your parts catalogue, orders, and dispatch" />

      {stats.errors.length > 0 && (
        <DashboardErrorBanner errors={stats.errors} partial={stats.partialFailure} />
      )}

      {!stats.totalFailure && stats.pendingQuotes != null && stats.pendingQuotes > 0 && (
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

      {!stats.totalFailure && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Active Listings"
              value={stats.activeListings ?? '—'}
              accent={stats.activeListings != null && stats.activeListings > 0}
            />
            <MetricCard label="Pending RFQs" value={stats.pendingQuotes ?? '—'} />
            <MetricCard label="Open Orders" value={stats.openOrders ?? '—'} />
            <MetricCard label="Quote response SLA" value="< 2h" hint="Target turnaround" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest purchases from your catalogue</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                    <ShoppingCart className="mb-3 h-9 w-9 text-muted-foreground" />
                    <p className="font-medium text-foreground">No orders yet</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Orders appear when garages buy parts from your catalogue. Add listings to get started.
                    </p>
                    <Button asChild className="mt-4 gap-2">
                      <Link href="/dealer/parts">
                        <Plus className="h-4 w-4" />
                        Add your first part
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(order.totalAmount, order.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for your dealership</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="min-h-11 w-full justify-start gap-2" asChild>
                  <Link href="/dealer/parts">
                    <Plus className="h-4 w-4" />
                    Add a Part
                  </Link>
                </Button>
                <Button variant="outline" className="min-h-11 w-full justify-start gap-2 bg-card" asChild>
                  <Link href="/dealer/orders">
                    <Package className="h-4 w-4" />
                    View All Orders
                  </Link>
                </Button>
                <Button variant="outline" className="min-h-11 w-full justify-start gap-2 bg-card" asChild>
                  <Link href="/dealer/dispatch">
                    <Truck className="h-4 w-4" />
                    Manage Dispatch
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
