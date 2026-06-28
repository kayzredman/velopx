import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PortalDefinition } from '@/lib/portals'
import { cn } from '@/lib/utils'

function gridLayout(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count === 3) return 'grid-cols-2 sm:grid-cols-3'
  return 'grid-cols-2 sm:grid-cols-4'
}

export function SelectPortalView({
  portals,
  userName,
}: {
  portals: PortalDefinition[]
  userName?: string | null
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col [@media(max-height:640px)]:gap-1">
      <div className="shrink-0 text-center">
        {userName ? (
          <p className="text-xs text-muted-foreground sm:text-sm">
            Welcome back,{' '}
            <span className="font-medium text-foreground">{userName}</span>
          </p>
        ) : null}
        <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground [@media(max-height:640px)]:text-lg sm:mt-2 sm:text-2xl lg:text-3xl">
          Choose your workspace
        </h1>
        <p className="mx-auto mt-1 max-w-2xl text-xs leading-snug text-muted-foreground sm:mt-2 sm:text-sm sm:leading-relaxed">
          {portals.length} products on your account — pick one to continue.
        </p>
      </div>

      <ul
        className={cn(
          'mt-3 grid min-h-0 flex-1 auto-rows-fr gap-2 sm:mt-4 sm:gap-3 lg:gap-4',
          gridLayout(portals.length),
        )}
      >
        {portals.map((portal) => {
          const Icon = portal.icon
          return (
            <li key={portal.id} className="min-h-0">
              <Link
                href={portal.href}
                className={cn(
                  'group relative flex h-full min-h-[6.5rem] flex-col overflow-hidden rounded-xl border border-border bg-navy-900/80 p-3 sm:min-h-[7.5rem] sm:rounded-2xl sm:p-4 lg:p-4',
                  'ring-1 ring-transparent transition-all duration-200',
                  'hover:border-border/80 hover:bg-navy-900 hover:shadow-lg hover:shadow-black/20',
                  'active:scale-[0.99]',
                  portal.ring,
                )}
              >
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
                    portal.accent,
                  )}
                />
                <div className="relative flex h-full min-h-0 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/40 sm:h-9 sm:w-9',
                        portal.iconColor,
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="rounded-full border border-border/60 bg-background/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                      {portal.badge}
                    </span>
                  </div>

                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                    {portal.product}
                  </p>
                  <h2 className="mt-0.5 font-display text-sm font-bold text-foreground sm:text-base lg:text-lg">
                    {portal.label}
                  </h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-snug text-muted-foreground sm:line-clamp-3 sm:text-xs lg:text-sm">
                    {portal.description}
                  </p>

                  <span className="mt-2 inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary sm:text-xs lg:text-sm sm:transition-all sm:group-hover:gap-2">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="mt-2 shrink-0 text-center text-[10px] text-muted-foreground/70 sm:mt-3 sm:text-xs">
        Switch workspaces anytime from the sidebar.
      </p>
    </div>
  )
}
