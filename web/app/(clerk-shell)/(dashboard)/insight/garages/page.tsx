import { PageHeader } from '@/components/brand/PageHeader'
import { GarageDirectory } from '@/components/assessor/GarageDirectory'

export default function InsightGaragesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Garage Directory" subtitle="All registered garages — insurer view" />
      <GarageDirectory />
    </div>
  )
}
