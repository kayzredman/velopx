'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function DealerPartActions({ partId }: { partId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Remove this part from your catalogue? This cannot be undone.')) return
    await fetch(`/api/parts/${partId}`, { method: 'DELETE' })
    router.push('/dealer/parts')
    router.refresh()
  }

  return (
    <div className="flex justify-end border-t border-border pt-6">
      <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDelete}>
        Remove listing
      </Button>
    </div>
  )
}
