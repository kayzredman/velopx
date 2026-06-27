'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PartImageInput } from './PartImageInput'
import type { Part } from '@/lib/api'

export interface PartFormValues {
  name: string
  oemNumber?: string
  description?: string
  condition: 'oem' | 'aftermarket' | 'used'
  price: number
  currency: string
  country: string
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited'
  images: string[]
}

function valuesFromPart(part: Part): PartFormValues {
  return {
    name: part.name,
    oemNumber: part.oemNumber ?? undefined,
    description: part.description ?? undefined,
    condition: part.condition,
    price: parseFloat(part.price),
    currency: part.currency,
    country: part.country,
    stockStatus: part.stockStatus as PartFormValues['stockStatus'],
    images: part.images ?? [],
  }
}

interface PartFormDialogProps {
  triggerLabel?: string
}

export function PartFormDialog({ triggerLabel = '+ Add Part' }: PartFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Part to Catalogue</DialogTitle>
        </DialogHeader>
        <PartForm
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

interface PartFormProps {
  part?: Part
  onSuccess?: () => void
  onCancel?: () => void
}

export function PartForm({ part, onSuccess, onCancel }: PartFormProps) {
  const router = useRouter()
  const isEdit = !!part
  const [values, setValues] = useState<PartFormValues>(() =>
    part ? valuesFromPart(part) : {
      name: '',
      condition: 'oem',
      price: 0,
      currency: 'GHS',
      country: 'GH',
      stockStatus: 'in_stock',
      images: [],
    }
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        name: values.name,
        oemNumber: values.oemNumber || undefined,
        description: values.description || undefined,
        condition: values.condition,
        price: values.price,
        currency: values.currency,
        country: values.country,
        stockStatus: values.stockStatus,
        images: values.images,
      }

      const res = await fetch(isEdit ? `/api/parts/${part!.id}` : '/api/parts', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())

      if (onSuccess) onSuccess()
      else if (isEdit) router.push(`/dealer/parts/${part!.id}`)
      else router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        placeholder="Part name"
        required
      />
      <Input
        value={values.oemNumber ?? ''}
        onChange={(e) => setValues((v) => ({ ...v, oemNumber: e.target.value }))}
        placeholder="OEM number"
      />
      <textarea
        value={values.description ?? ''}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        placeholder="Description"
        rows={3}
        className="flex w-full rounded-md border border-input bg-navy-900 px-3 py-2 text-sm"
      />
      <select
        value={values.condition}
        onChange={(e) =>
          setValues((v) => ({ ...v, condition: e.target.value as PartFormValues['condition'] }))
        }
        className="flex h-10 w-full rounded-md border border-input bg-navy-900 px-3 text-sm"
        required
      >
        <option value="oem">OEM</option>
        <option value="aftermarket">Aftermarket</option>
        <option value="used">Used</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={values.price || ''}
          onChange={(e) => setValues((v) => ({ ...v, price: parseFloat(e.target.value) || 0 }))}
          placeholder="Price"
          required
        />
        <Input
          value={values.currency}
          onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))}
          placeholder="Currency"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          value={values.country}
          onChange={(e) => setValues((v) => ({ ...v, country: e.target.value.toUpperCase() }))}
          placeholder="Country"
          maxLength={2}
        />
        <select
          value={values.stockStatus}
          onChange={(e) =>
            setValues((v) => ({ ...v, stockStatus: e.target.value as PartFormValues['stockStatus'] }))
          }
          className="flex h-10 w-full rounded-md border border-input bg-navy-900 px-3 text-sm"
        >
          <option value="in_stock">In stock</option>
          <option value="limited">Limited</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      <PartImageInput
        value={values.images}
        onChange={(images) => setValues((v) => ({ ...v, images }))}
        disabled={loading}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Save part'}
        </Button>
      </div>
    </form>
  )
}
