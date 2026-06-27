import type { Delivery, Order, OrderItem, Part, User } from '@prisma/client'

type DeliveryWithOrder = Delivery & {
  order: Order & {
    buyerId: string
    items: (OrderItem & { part: Pick<Part, 'dealerId'> })[]
  }
}

export function canAccessDelivery(delivery: DeliveryWithOrder, user: User, jwtRole?: string): boolean {
  if (user.role === 'platform_admin' || jwtRole === 'platform_admin') return true

  if (delivery.driverId === user.id) return true
  if (delivery.order.buyerId === user.id) return true

  const isDealerOnOrder = delivery.order.items.some((item) => item.part.dealerId === user.id)
  if (isDealerOnOrder && (user.role === 'dealer_owner' || user.role === 'dealer_staff')) {
    return true
  }

  return false
}

export function isDealerOnOrder(
  order: Order & { items: (OrderItem & { part: Pick<Part, 'dealerId'> })[] },
  userId: string
): boolean {
  return order.items.some((item) => item.part.dealerId === userId)
}
