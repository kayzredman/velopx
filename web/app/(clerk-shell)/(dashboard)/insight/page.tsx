import { PageHeader } from '@/components/brand/PageHeader'
import { AssessorTools } from '../assess/AssessorTools'
import { EmptyState } from '@/components/brand/States'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function InsightPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="VelopX Insight" subtitle="Insurer intelligence — marketplace, garages, and claims tools" />

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/insight/catalogue">Marketplace Catalogue</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/insight/garages">Garage Directory</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/insight/dealers">Dealer Directory</Link>
        </Button>
      </div>

      <AssessorTools />

      <EmptyState
        title="Phase 2 analytics"
        description="Claims benchmarking dashboards and delivery performance metrics will expand here."
      />
    </div>
  )
}
