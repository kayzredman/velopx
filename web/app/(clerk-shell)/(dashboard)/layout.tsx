import { AppSidebar } from '@/components/layout/AppSidebar'
import { apiFetch } from '@/lib/api'
import { safeAuth } from '@/lib/safeAuth'
import { isDealerRole } from '@/lib/utils'

async function getSidebarBadges(role?: string | null, roles?: string[] | null): Promise<Record<string, number>> {
  if (!isDealerRole(role, roles)) return {}
  try {
    const quotes = await apiFetch<{ data: { status: string }[] }>('/v1/quotes/for-dealer')
    const pending = quotes.data.filter((q) => q.status === 'pending').length
    return pending > 0 ? { '/dealer/rfqs': pending } : {}
  } catch {
    return {}
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sessionClaims } = await safeAuth()
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined
  const role = metadata?.role as string | undefined
  const roles = Array.isArray(metadata?.roles)
    ? (metadata.roles as unknown[]).filter((r): r is string => typeof r === 'string')
    : undefined
  const badges = await getSidebarBadges(role, roles)

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar role={role} roles={roles} badges={badges} />
      <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8">{children}</main>
    </div>
  )
}
