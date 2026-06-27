'use client'

import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/brand/Badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Quote } from '@/lib/api'

export function RfqList({ quotes }: { quotes: Quote[] }) {
  const router = useRouter()

  async function respond(id: string, status: 'responded' | 'declined') {
    await fetch(`/api/quotes/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.id} className="bg-navy-900">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{quote.requester?.name ?? 'Garage'}</p>
                <p className="text-xs text-muted-foreground">
                  {quote.claimReference ? `Claim: ${quote.claimReference}` : 'No claim ref'} ·{' '}
                  {new Date(quote.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-3 space-y-1">
                  {quote.items.map((item) => (
                    <p key={item.id} className="text-sm">
                      {item.part.name}{' '}
                      <span className="text-muted-foreground">({item.part.oemNumber ?? 'no OEM'})</span> —{' '}
                      {formatCurrency(item.price, item.currency)}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={quote.status} />
                {quote.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respond(quote.id, 'responded')}>
                      Respond
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond(quote.id, 'declined')}>
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
