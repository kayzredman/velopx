'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeToggleProps = {
  className?: string
  /** Always show Auto / Light / Dark text (recommended in narrow sidebars) */
  showLabels?: boolean
  /** Use on navy sidebar — lighter controls */
  variant?: 'default' | 'sidebar'
}

export function ThemeToggle({ className, showLabels = true, variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const shellClass =
    variant === 'sidebar'
      ? 'border-sidebar-border bg-black/25'
      : 'border-border bg-muted/60'

  if (!mounted) {
    return (
      <div className={cn('flex gap-1 rounded-lg border p-1', shellClass, className)}>
        <Button variant="ghost" size="sm" className="h-9 min-w-[2.5rem] flex-1 px-2" disabled aria-label="Loading theme">
          <Sun className="h-4 w-4 opacity-40" />
        </Button>
      </div>
    )
  }

  const options = [
    { value: 'system', label: 'Auto', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ] as const

  return (
    <div className={cn('flex gap-1 rounded-lg border p-1', shellClass, className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant={theme === value ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-9 flex-1 px-2 text-xs',
            showLabels ? 'gap-1.5' : 'min-w-[2.5rem]',
            variant === 'sidebar' && theme !== value && 'text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground',
          )}
          onClick={() => setTheme(value)}
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {showLabels ? <span>{label}</span> : null}
        </Button>
      ))}
    </div>
  )
}
