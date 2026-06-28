import { PageHeader } from '@/components/brand/PageHeader'
import { AssessorTools } from '../assess/AssessorTools'
import { EmptyState } from '@/components/brand/States'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Package, Store } from 'lucide-react'

export default function InsightPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="VelopX Insight" subtitle="Insurer intelligence — marketplace, garages, and claims tools" />

      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg" className="gap-2">
          <Link href="/insight/catalogue">
            <Package className="h-4 w-4" />
            Marketplace Catalogue
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="gap-2 bg-card">
          <Link href="/insight/garages">
            <Building2 className="h-4 w-4" />
            Garage Directory
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="gap-2 bg-card">
          <Link href="/insight/dealers">
            <Store className="h-4 w-4" />
            Dealer Directory
          </Link>
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
