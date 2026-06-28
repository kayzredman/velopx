import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function NoAccessView() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <Card className="w-full max-w-md border-dashed border-destructive/30 bg-navy-900/50">
        <CardContent className="flex flex-col items-center px-5 py-8 sm:px-6 sm:py-10">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:mb-4 sm:h-14 sm:w-14">
            <ShieldX className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <h1 className="font-display text-lg font-bold sm:text-xl">No portal access</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:mt-3 sm:text-sm">
            Your account is signed in but isn&apos;t assigned to a VelopX product yet. Ask your
            administrator to add a role (dealer, assessor, insurer, or garage) to your profile.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/catalogue">Browse public catalogue</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
