import Link from 'next/link'
import { PageHeader } from '@/components/brand/PageHeader'
import { AssessorTools } from './AssessorTools'
import { Button } from '@/components/ui/button'

export default function AssessPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Assessor Tools"
        subtitle="Marketplace catalogue, garage & dealer directories, plus benchmark and audit tools"
      />

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/assess/catalogue">Marketplace Catalogue</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/assess/garages">Garage Directory</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/assess/dealers">Dealer Directory</Link>
        </Button>
      </div>

      <AssessorTools />
    </div>
  )
}
