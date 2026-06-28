import Link from 'next/link'
import { Building2, Package, Store } from 'lucide-react'
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

      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg" className="gap-2">
          <Link href="/assess/catalogue">
            <Package className="h-4 w-4" />
            Marketplace Catalogue
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="gap-2 bg-card">
          <Link href="/assess/garages">
            <Building2 className="h-4 w-4" />
            Garage Directory
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="gap-2 bg-card">
          <Link href="/assess/dealers">
            <Store className="h-4 w-4" />
            Dealer Directory
          </Link>
        </Button>
      </div>

      <AssessorTools />
    </div>
  )
}
