import { apiFetch, type Delivery, type Order } from '@/lib/api'
import { PageHeader } from '@/components/brand/PageHeader'
import { EmptyState } from '@/components/brand/States'
import { DispatchTable, PendingOrdersTable } from './DispatchTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DealerDispatchPage() {
  const [deliveriesRes, ordersRes] = await Promise.all([
    apiFetch<{ data: Delivery[] }>('/v1/deliveries'),
    apiFetch<{ data: Order[] }>('/v1/orders/for-dealer'),
  ])

  const confirmedWithoutDelivery = ordersRes.data.filter(
    (o) => o.status === 'confirmed' && !o.delivery
  )

  return (
    <div className="space-y-8">
      <PageHeader title="Dispatch Manager" subtitle="Track and assign deliveries for confirmed orders" />

      {confirmedWithoutDelivery.length > 0 && (
        <Card className="bg-navy-900">
          <CardHeader>
            <CardTitle>Ready to Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingOrdersTable orders={confirmedWithoutDelivery} />
          </CardContent>
        </Card>
      )}

      {deliveriesRes.data.length === 0 && confirmedWithoutDelivery.length === 0 ? (
        <EmptyState title="No active deliveries" description="Confirm orders first, then create delivery records here." />
      ) : (
        <Card className="bg-navy-900">
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <DispatchTable deliveries={deliveriesRes.data} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
