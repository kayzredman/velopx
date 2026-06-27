import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/brand/PageHeader'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface DocsPayload {
  health: {
    status: string
    ts: string
    version: string
    checks: Record<string, string>
    counts: { apiEndpoints: number; webRoutes: number }
  }
  api: Array<{ method: string; path: string; auth: string; roles?: string; description: string }>
  web: Array<{ path: string; roles: string; description: string; status?: string }>
  links: Record<string, string>
}

async function getDocs(): Promise<DocsPayload | null> {
  try {
    const res = await fetch(`${API_URL}/docs.json`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<DocsPayload>
  } catch {
    return null
  }
}

function statusColor(status: string) {
  if (status === 'ok' || status === 'configured' || status === 'live') return 'text-green-400'
  if (status === 'degraded' || status === 'placeholder' || status === 'stub') return 'text-primary'
  return 'text-red-400'
}

export default async function DocsPage() {
  const docs = await getDocs()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandLogo />
          <div className="flex gap-3 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <a href={`${API_URL}/docs`} className="text-primary hover:underline" target="_blank" rel="noreferrer">
              API HTML docs ↗
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
        <PageHeader
          title="Platform Docs"
          subtitle="Live health, REST API reference, and web routes"
        />

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 text-sm">
            <p className="font-semibold text-primary">Insurance companies</p>
            <p className="mt-1 text-muted-foreground">
              Portal URL:{' '}
              <Link href="/insight" className="font-mono text-foreground underline">
                /insight
              </Link>{' '}
              (Phase 2 stub). Claims benchmark tools today:{' '}
              <Link href="/assess" className="text-primary underline">
                /assess
              </Link>
              . Clerk public metadata:{' '}
              <code className="rounded bg-navy-900 px-1">{`{ "role": "insurer_admin" }`}</code>
            </p>
          </CardContent>
        </Card>

        {!docs ? (
          <Card className="border-destructive/40">
            <CardContent className="p-5 text-destructive">
              Could not reach API at {API_URL}. Start the backend or check NEXT_PUBLIC_API_URL.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Overall', docs.health.status],
                ['Database', docs.health.checks.database],
                ['Kafka', docs.health.checks.kafka],
                ['Clerk', docs.health.checks.clerk],
              ].map(([label, val]) => (
                <Card key={label as string} className="bg-navy-900">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className={`font-display text-xl font-bold capitalize ${statusColor(String(val))}`}>
                      {val}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-navy-900">
              <CardHeader>
                <CardTitle>Web routes</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Path</th>
                      <th className="pb-2 pr-4">Roles</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.web.map((r) => (
                      <tr key={r.path} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono">
                          {r.path.startsWith('http') ? (
                            r.path
                          ) : (
                            <Link href={r.path} className="text-primary hover:underline">
                              {r.path}
                            </Link>
                          )}
                          {r.status === 'stub' && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Phase 2
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.roles}</td>
                        <td className="py-2">{r.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="bg-navy-900">
              <CardHeader>
                <CardTitle>REST API</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-3">Method</th>
                      <th className="pb-2 pr-3">Path</th>
                      <th className="pb-2 pr-3">Auth</th>
                      <th className="pb-2 pr-3">Roles</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.api.map((e) => (
                      <tr key={`${e.method}${e.path}`} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-mono text-primary">{e.method}</td>
                        <td className="py-2 pr-3 font-mono">{e.path}</td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline">{e.auth}</Badge>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{e.roles ?? '—'}</td>
                        <td className="py-2">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              API v{docs.health.version} · {docs.health.counts.apiEndpoints} endpoints · updated{' '}
              {new Date(docs.health.ts).toLocaleString()}
            </p>
          </>
        )}
      </main>
    </div>
  )
}
