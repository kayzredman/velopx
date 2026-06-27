import { apiFetch, type Quote } from '@/lib/api'
import { PageHeader } from '@/components/brand/PageHeader'
import { EmptyState } from '@/components/brand/States'
import { RfqList } from './RfqList'

export default async function DealerRfqsPage() {
  const res = await apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer')

  return (
    <div className="space-y-6">
      <PageHeader title="RFQ Inbox" subtitle="Quote requests from garages and assessors" />
      {res.data.length === 0 ? (
        <EmptyState title="No RFQs" description="When garages request quotes on your parts, they will appear here." />
      ) : (
        <RfqList quotes={res.data} />
      )}
    </div>
  )
}
