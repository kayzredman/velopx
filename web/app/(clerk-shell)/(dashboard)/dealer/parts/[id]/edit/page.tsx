import { notFound } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, type Part } from '@/lib/api'
import { PageHeader } from '@/components/brand/PageHeader'
import { PartForm } from '@/components/parts/PartForm'
import { Button } from '@/components/ui/button'

export default async function DealerPartEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let part: Part
  try {
    const res = await apiFetch<{ data: Part }>(`/v1/parts/mine/${id}`)
    part = res.data
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Edit listing" subtitle={part.name} />
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dealer/parts/${id}`}>Cancel</Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-navy-900 p-6">
        <PartForm part={part} />
      </div>
    </div>
  )
}
