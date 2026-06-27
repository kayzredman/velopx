import { AlertCircle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="border-dashed bg-navy-900/50">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
        <h3 className="font-display text-lg font-semibold">Something went wrong</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
