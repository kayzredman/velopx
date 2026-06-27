import { apiFetch, type Part } from '@/lib/api'
import { PageHeader } from '@/components/brand/PageHeader'
import { EmptyState } from '@/components/brand/States'
import { PartFormDialog } from '@/components/parts/PartForm'
import { PartsTable } from './PartsTable'

export default async function DealerPartsPage() {
  const res = await apiFetch<{ data: Part[]; meta: { total: number } }>('/v1/parts/mine?limit=100')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="My Catalogue" subtitle={`${res.meta.total} active listing(s)`} />
        <PartFormDialog />
      </div>
      {res.data.length === 0 ? (
        <EmptyState title="No parts listed yet" description="Add your first part to start receiving RFQs and orders." />
      ) : (
        <PartsTable parts={res.data} />
      )}
    </div>
  )
}
