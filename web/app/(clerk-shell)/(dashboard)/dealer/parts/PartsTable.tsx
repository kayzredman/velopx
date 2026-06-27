'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ConditionBadge, StatusBadge } from '@/components/brand/Badges'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PartThumbnail } from '@/components/parts/PartImageGallery'
import { formatCurrency } from '@/lib/utils'
import type { Part } from '@/lib/api'

export function PartsTable({ parts }: { parts: Part[] }) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Remove this part from your catalogue?')) return
    await fetch(`/api/parts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16" />
          <TableHead>Name</TableHead>
          <TableHead>OEM</TableHead>
          <TableHead>Condition</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Price</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {parts.map((part) => (
          <TableRow key={part.id}>
            <TableCell>
              <Link href={`/dealer/parts/${part.id}`}>
                <PartThumbnail images={part.images} alt={part.name} className="h-12 w-12" />
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/dealer/parts/${part.id}`} className="font-medium hover:text-primary">
                {part.name}
              </Link>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{part.oemNumber ?? '—'}</TableCell>
            <TableCell>
              <ConditionBadge condition={part.condition} />
            </TableCell>
            <TableCell>
              <StatusBadge status={part.stockStatus} />
            </TableCell>
            <TableCell>{formatCurrency(part.price, part.currency)}</TableCell>
            <TableCell className="space-x-1 text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dealer/parts/${part.id}/edit`}>Edit</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(part.id)}>
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
