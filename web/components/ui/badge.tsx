import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        oem: 'bg-blue-500/15 text-blue-400',
        aftermarket: 'bg-purple-500/15 text-purple-400',
        used: 'bg-amber-500/15 text-amber-400',
        success: 'bg-green-500/15 text-green-400',
        warning: 'bg-orange-500/15 text-orange-400',
        danger: 'bg-red-500/15 text-red-400',
        outline: 'border border-border text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
