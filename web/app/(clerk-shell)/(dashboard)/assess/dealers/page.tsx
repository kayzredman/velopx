import { PageHeader } from '@/components/brand/PageHeader'
import { DealerDirectory } from '@/components/assessor/DealerDirectory'

export default function AssessDealersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dealer Directory" subtitle="All registered parts dealers on the platform" />
      <DealerDirectory />
    </div>
  )
}
