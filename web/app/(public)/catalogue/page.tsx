import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { PartCard } from '@/components/parts/PartCard'
import { publicFetch, type Part } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q ? `&q=${encodeURIComponent(q)}` : ''
  const res = await publicFetch<{ data: Part[]; meta: { total: number } }>(`/v1/parts?limit=24${query}`)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandLogo />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">Parts Catalogue</h1>
        <p className="mt-2 text-muted-foreground">
          {res.meta.total} parts available · OEM, aftermarket, and used
        </p>

        <form className="mt-6 flex gap-3" action="/catalogue" method="get">
          <Input name="q" defaultValue={q} placeholder="Search by name or OEM number…" className="max-w-md" />
          <Button type="submit">Search</Button>
        </form>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {res.data.map((part) => (
            <PartCard key={part.id} part={part} href={`/catalogue/${part.id}`} />
          ))}
        </div>
      </main>
    </div>
  )
}
