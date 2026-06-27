import { notFound } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, type Part } from '@/lib/api'
import { PageHeader } from '@/components/brand/PageHeader'
import { PartDetailView } from '@/components/parts/PartDetailView'
import { DealerPartActions } from './DealerPartActions'

export default async function DealerPartDetailPage({
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
    <div className="space-y-6">
      <PageHeader title={part.name} subtitle="Listing detail — view and manage" />
      <PartDetailView
        part={part}
        mode="owner"
        editHref={`/dealer/parts/${id}/edit`}
        backHref="/dealer/parts"
        backLabel="My catalogue"
      />
      <DealerPartActions partId={part.id} />
    </div>
  )
}
