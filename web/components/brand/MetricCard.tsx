import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MetricCard({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
  className?: string
}) {
  return (
    <Card className={cn('bg-navy-900', className)}>
      <CardContent className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={cn('mt-3 font-display text-3xl font-bold', accent && 'text-primary')}>{value}</p>
        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
