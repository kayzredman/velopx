import Link from 'next/link'
import { ConditionBadge, StatusBadge } from '@/components/brand/Badges'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Part } from '@/lib/api'
import { PartImageGallery } from './PartImageGallery'

interface PartDetailViewProps {
  part: Part
  mode: 'public' | 'owner'
  editHref?: string
  backHref?: string
  backLabel?: string
}

export function PartDetailView({
  part,
  mode,
  editHref,
  backHref = '/catalogue',
  backLabel = 'Back to catalogue',
}: PartDetailViewProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>← {backLabel}</Link>
        </Button>
        {mode === 'owner' && editHref && (
          <Button size="sm" asChild>
            <Link href={editHref}>Edit listing</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <PartImageGallery images={part.images ?? []} alt={part.name} />

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="font-display text-2xl font-bold md:text-3xl">{part.name}</h1>
              <ConditionBadge condition={part.condition} />
            </div>
            {part.oemNumber && (
              <p className="mt-2 font-mono text-sm text-muted-foreground">OEM {part.oemNumber}</p>
            )}
          </div>

          <p className="font-display text-3xl font-bold text-primary">
            {formatCurrency(part.price, part.currency)}
          </p>

          <div className="flex flex-wrap gap-3">
            <StatusBadge status={part.stockStatus} />
            <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
              {part.country}
            </span>
          </div>

          {part.description && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground">Description</h2>
              <p className="mt-2 text-sm leading-relaxed">{part.description}</p>
            </div>
          )}

          {part.dealer && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sold by</p>
                <p className="mt-1 font-semibold">{part.dealer.name ?? 'Verified dealer'}</p>
                {mode === 'public' && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Sign in as a garage to request a quote on this part.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {mode === 'public' && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href="/sign-in">Sign in to request quote</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/catalogue">Browse more parts</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
