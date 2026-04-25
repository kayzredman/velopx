'use client'

import { useState } from 'react'
import { PartRow } from './PartRow'

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

export function PartsTable({ initialParts }: { initialParts: Part[] }) {
  const [parts, setParts] = useState(initialParts)

  function handleDeleted(id: string) {
    setParts((prev) => prev.filter((p) => p.id !== id))
  }

  if (parts.length === 0) {
    return (
      <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] p-12 text-center">
        <p className="text-[#8A97AA]">No parts listed yet. Add your first part to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#1E2E48] bg-[#0C1526] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1E2E48]">
            {['Part', 'Condition', 'Price', 'Stock', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs text-[#8A97AA] font-medium uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <PartRow key={part.id} part={part} onDeleted={handleDeleted} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
