import { PageHeader } from '@/components/brand/PageHeader'
import { DealerDirectory } from '@/components/assessor/DealerDirectory'

export default function InsightDealersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dealer Directory" subtitle="All registered dealers — insurer view" />
      <DealerDirectory />
    </div>
  )
}
