import Link from 'next/link'
import { apiFetch, type Order } from '@/lib/api'
import { PageHeader } from '@/components/brand/PageHeader'
import { StatusBadge } from '@/components/brand/Badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Search, Package, ClipboardList } from 'lucide-react'

export default async function GaragePage() {
  const orders = await apiFetch<{ data: Order[] }>('/v1/orders')

  return (
    <div className="mx-auto max-w-lg space-y-6 md:max-w-2xl">
      <PageHeader
        title="Garage"
        subtitle="Find parts and track orders — optimised for mobile"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-auto flex-col gap-2 py-6" size="lg">
          <Link href="/catalogue">
            <Search className="h-6 w-6" />
            <span>Browse parts catalogue</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto flex-col gap-2 py-6" size="lg">
          <Link href="/catalogue">
            <Package className="h-6 w-6" />
            <span>Search by OEM</span>
          </Link>
        </Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex gap-3 p-4 text-sm">
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            RFQ and quote flows are fastest in the <strong className="text-foreground">mobile garage app</strong>.
            Use this web view to browse the market and track orders on any screen size.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Your orders</h2>
        {orders.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet — browse the catalogue to get started.</p>
        ) : (
          <ul className="space-y-3">
            {orders.data.map((o) => (
              <li key={o.id}>
                <Card className="bg-navy-900">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{o.id.slice(0, 10)}</p>
                      <p className="mt-1 font-semibold">{formatCurrency(o.totalAmount, o.currency)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
