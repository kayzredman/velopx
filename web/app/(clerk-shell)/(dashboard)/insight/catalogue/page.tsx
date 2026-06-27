import { PageHeader } from '@/components/brand/PageHeader'
import { MarketplaceCatalogue } from '@/components/assessor/MarketplaceCatalogue'

export default function InsightCataloguePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Catalogue"
        subtitle="Every dealer listing on velopX — insurer view"
      />
      <MarketplaceCatalogue />
    </div>
  )
}
