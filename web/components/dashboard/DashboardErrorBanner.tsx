'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function friendlyMessage(raw: string): string {
  if (raw.includes('API 500') || raw.includes('Internal server error')) {
    return 'We couldn’t load your dashboard right now. This is usually temporary — try again in a moment.'
  }
  if (raw.includes('API 401') || raw.includes('Unauthorized')) {
    return 'Your session expired. Sign out and sign back in, then try again.'
  }
  if (raw.includes('fetch failed') || raw.includes('ECONNREFUSED')) {
    return 'We can’t reach the server. Check that the API is running and try again.'
  }
  return 'Something went wrong while loading your dashboard. Please try again.'
}

export function DashboardErrorBanner({
  errors,
  partial,
}: {
  errors: string[]
  partial?: boolean
}) {
  const router = useRouter()
  const primary = errors[0] ?? 'Unknown error'

  return (
    <Card className={partial ? 'border-amber-500/40 bg-amber-500/5' : 'border-destructive/40 bg-destructive/5'}>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle
            className={`mt-0.5 h-5 w-5 shrink-0 ${partial ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'}`}
          />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">
              {partial ? 'Some dashboard data couldn’t be loaded' : 'Dashboard unavailable'}
            </p>
            <p className="text-sm text-muted-foreground">{friendlyMessage(primary)}</p>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none hover:text-foreground">Technical details</summary>
              <ul className="mt-2 list-inside list-disc space-y-1 font-mono">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 self-start"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
