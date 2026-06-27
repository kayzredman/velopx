import Link from 'next/link'
import { ConditionBadge, StatusBadge } from '@/components/brand/Badges'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Part } from '@/lib/api'
import { PartThumbnail } from './PartImageGallery'

interface PartCardProps {
  part: Part
  href: string
  showDealer?: boolean
}

export function PartCard({ part, href, showDealer = true }: PartCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full overflow-hidden bg-navy-900 transition-colors group-hover:border-primary/40">
        <PartThumbnail images={part.images} alt={part.name} className="rounded-none border-0 border-b border-border" />
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-medium leading-snug group-hover:text-primary">{part.name}</p>
            <ConditionBadge condition={part.condition} />
          </div>
          {part.oemNumber && (
            <p className="font-mono text-xs text-muted-foreground">OEM {part.oemNumber}</p>
          )}
          {showDealer && (
            <p className="mt-1 text-xs text-primary">{part.dealer?.name ?? 'Dealer'}</p>
          )}
          <p className="mt-2 font-display text-lg font-bold text-primary">
            {formatCurrency(part.price, part.currency)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={part.stockStatus} />
            <span className="text-xs text-muted-foreground">{part.country}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
