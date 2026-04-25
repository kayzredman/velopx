import { apiFetch } from '@/lib/api'
import { AddPartForm } from './AddPartForm'
import { PartsTable } from './PartsTable'

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

async function getParts(): Promise<Part[]> {
  try {
    const res = await apiFetch<{ data: Part[]; meta: { total: number } }>('/v1/parts?limit=100')
    return res.data
  } catch {
    return []
  }
}

export default async function PartsPage() {
  const parts = await getParts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E8ECF1]">Parts Catalogue</h1>
          <p className="text-[#8A97AA] mt-1">{parts.length} listing{parts.length !== 1 ? 's' : ''}</p>
        </div>
        <AddPartForm />
      </div>

      <PartsTable initialParts={parts} />
    </div>
  )
}
