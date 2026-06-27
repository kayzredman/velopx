import { Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function BrandLogo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5 font-display text-lg font-bold tracking-tight', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Zap className="h-4 w-4" />
      </span>
      <span>
        velop<span className="text-primary">X</span>
      </span>
    </Link>
  )
}
