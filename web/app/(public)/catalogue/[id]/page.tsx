import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { PartDetailView } from '@/components/parts/PartDetailView'
import { Button } from '@/components/ui/button'
import { publicFetch, type Part } from '@/lib/api'

export default async function PublicPartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let part: Part
  try {
    const res = await publicFetch<{ data: Part }>(`/v1/parts/${id}`)
    part = res.data
  } catch {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandLogo href="/catalogue" />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/catalogue">Catalogue</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <PartDetailView part={part} mode="public" backHref="/catalogue" backLabel="Catalogue" />
      </main>
    </div>
  )
}
