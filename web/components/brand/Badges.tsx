import { Badge } from '@/components/ui/badge'

const conditionMap = {
  oem: 'oem',
  aftermarket: 'aftermarket',
  used: 'used',
} as const

export function ConditionBadge({ condition }: { condition: string }) {
  const variant = conditionMap[condition as keyof typeof conditionMap] ?? 'default'
  const label = condition === 'oem' ? 'OEM' : condition === 'aftermarket' ? 'Aftermarket' : condition === 'used' ? 'Used' : condition
  return <Badge variant={variant}>{label}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  const danger = ['cancelled', 'disputed', 'declined', 'expired']
  const success = ['confirmed', 'completed', 'delivered', 'accepted', 'responded']
  const warning = ['pending', 'assigned', 'collected', 'in_transit']

  let variant: 'success' | 'warning' | 'danger' | 'default' = 'default'
  if (danger.includes(status)) variant = 'danger'
  else if (success.includes(status)) variant = 'success'
  else if (warning.includes(status)) variant = 'warning'

  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>
}
