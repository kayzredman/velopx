'use client'

import { useState, useTransition } from 'react'

interface Part {
  id: string
  name: string
  oemNumber: string | null
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited'
  images: string[]
  createdAt: string
}

const CONDITION_LABELS = { oem: 'OEM', aftermarket: 'Aftermarket', used: 'Used' }
const STOCK_COLOURS = {
  in_stock: 'text-[#22C55E]',
  limited: 'text-[#F59E0B]',
  out_of_stock: 'text-[#EF4444]',
}
const STOCK_LABELS = { in_stock: 'In Stock', limited: 'Limited', out_of_stock: 'Out of Stock' }

export function PartRow({ part, onDeleted }: { part: Part; onDeleted: (id: string) => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete() {
    if (!confirm(`Delete "${part.name}"? This cannot be undone.`)) return

    startTransition(async () => {
      try {
        const res = await fetch(`/api/parts/${part.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
        onDeleted(part.id)
      } catch {
        setError('Failed to delete part.')
      }
    })
  }

  return (
    <tr className="border-b border-[#1E2E48] hover:bg-[#111E34] transition-colors">
      <td className="px-4 py-3">
        <p className="text-[#E8ECF1] text-sm font-medium">{part.name}</p>
        {part.oemNumber && <p className="text-[#8A97AA] text-xs mt-0.5">{part.oemNumber}</p>}
      </td>
      <td className="px-4 py-3 text-[#8A97AA] text-sm">
        {CONDITION_LABELS[part.condition]}
      </td>
      <td className="px-4 py-3 text-[#E8ECF1] text-sm font-medium">
        {part.currency} {Number(part.price).toLocaleString()}
      </td>
      <td className={`px-4 py-3 text-sm ${STOCK_COLOURS[part.stockStatus]}`}>
        {STOCK_LABELS[part.stockStatus]}
      </td>
      <td className="px-4 py-3 text-right">
        {error && <span className="text-[#EF4444] text-xs mr-2">{error}</span>}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-[#EF4444] hover:text-[#EF4444]/80 disabled:opacity-50"
        >
          {isPending ? 'Deleting…' : 'Delete'}
        </button>
      </td>
    </tr>
  )
}
