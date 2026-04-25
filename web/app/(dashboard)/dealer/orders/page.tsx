import { apiFetch } from '@/lib/api'

interface OrderItem {
  id: string
  quantity: number
  price: string
  part: { id: string; name: string }
}

interface Order {
  id: string
  status: string
  totalAmount: string
  currency: string
  claimReference: string | null
  createdAt: string
  items: OrderItem[]
  delivery: { id: string; status: string } | null
}

const STATUS_COLOURS: Record<string, string> = {
  pending:    'bg-[#F59E0B]/10 text-[#F59E0B]',
  confirmed:  'bg-[#3B82F6]/10 text-[#3B82F6]',
  dispatched: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  delivered:  'bg-[#22C55E]/10 text-[#22C55E]',
  completed:  'bg-[#22C55E]/10 text-[#22C55E]',
  cancelled:  'bg-[#EF4444]/10 text-[#EF4444]',
  disputed:   'bg-[#EF4444]/10 text-[#EF4444]',
}

async function getOrders(): Promise<Order[]> {
  try {
    const res = await apiFetch<{ data: Order[] }>('/v1/orders')
    return res.data
  } catch {
    return []
  }
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Orders</h1>
        <p className="text-[#8A97AA] mt-1">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-12 text-center">
          <p className="text-[#8A97AA]">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#E8ECF1] font-medium text-sm">
                      {order.currency} {Number(order.totalAmount).toLocaleString()}
                    </span>
                    {order.claimReference && (
                      <span className="text-xs text-[#8A97AA] bg-[#111E34] px-2 py-0.5 rounded">
                        {order.claimReference}
                      </span>
                    )}
                  </div>
                  <p className="text-[#8A97AA] text-xs mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' · '}
                    {order.items.map((i) => i.part.name).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {order.delivery && (
                    <span className="text-xs text-[#8A97AA] bg-[#111E34] px-2 py-0.5 rounded capitalize">
                      {order.delivery.status.replace('_', ' ')}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLOURS[order.status] ?? 'bg-[#1E2E48] text-[#8A97AA]'}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
