import { apiFetch, type Order } from '@/lib/api'
import { PageHeader } from '@/components/brand/PageHeader'
import { EmptyState } from '@/components/brand/States'
import { OrdersTable } from './OrdersTable'

export default async function DealerOrdersPage() {
  const res = await apiFetch<{ data: Order[] }>('/v1/orders/for-dealer')

  return (
    <div className="space-y-6">
      <PageHeader title="Incoming Orders" subtitle="Orders containing your parts" />
      {res.data.length === 0 ? (
        <EmptyState title="No orders yet" description="Orders from garages will appear here once they purchase your parts." />
      ) : (
        <OrdersTable orders={res.data} />
      )}
    </div>
  )
}
