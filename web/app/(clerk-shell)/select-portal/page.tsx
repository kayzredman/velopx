import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { getAccessiblePortals } from '@/lib/portals'
import { safeAuth } from '@/lib/safeAuth'
import { primaryRoleForClerkUser, rolesForClerkUser } from '@/lib/sessionMetadata'
import { NoAccessView } from './NoAccessView'
import { SelectPortalView } from './SelectPortalView'

export default async function SelectPortalPage() {
  const { userId, sessionClaims } = await safeAuth()
  if (!userId) redirect('/sign-in')

  const clerkUser = await currentUser()
  const claims = sessionClaims as Record<string, unknown> | undefined
  const role = primaryRoleForClerkUser(clerkUser, claims)
  const roles = rolesForClerkUser(clerkUser, claims)
  const portals = getAccessiblePortals(role, roles)

  const userName =
    clerkUser?.firstName ??
    clerkUser?.fullName ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    null

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <header className="relative shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <BrandLogo href="/catalogue" />
          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:flex" />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-4 lg:py-5">
        {portals.length === 0 ? (
          <NoAccessView />
        ) : (
          <SelectPortalView portals={portals} userName={userName} />
        )}
      </main>
    </div>
  )
}
