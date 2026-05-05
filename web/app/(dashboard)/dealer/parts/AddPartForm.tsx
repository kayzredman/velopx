'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EMPTY = {
  name: '',
  oemNumber: '',
  condition: 'oem' as const,
  price: '',
  currency: 'GHS',
  country: 'GH',
  stockStatus: 'in_stock' as const,
  description: '',
}

export function AddPartForm({ onCreated }: { onCreated?: () => void } = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.price) {
      setError('Name and price are required.')
      return
    }

    setIsPending(true)
    void (async () => {
      try {
        const res = await fetch('/api/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            attributes: {},
            images: [],
          }),
        })
        if (!res.ok) {
          const body = (await res.json()) as { error?: string }
          throw new Error(body.error ?? 'Failed to add part')
        }
        setForm(EMPTY)
        setOpen(false)
        if (onCreated) {
          onCreated()
        } else {
          router.refresh()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add part.')
      } finally {
        setIsPending(false)
      }
    })()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-[#F5A623] text-[#070C14] text-sm font-semibold hover:bg-[#F7BC5A] transition-colors"
      >
        + Add Part
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1E2E48] bg-[#0C1526] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#E8ECF1] font-semibold text-lg">Add Part</h2>
              <button onClick={() => setOpen(false)} className="text-[#8A97AA] hover:text-[#E8ECF1] text-xl">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Part Name *">
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Front Brake Pad Set"
                  className={inputCls}
                />
              </Field>

              <Field label="OEM Number">
                <input
                  value={form.oemNumber}
                  onChange={(e) => set('oemNumber', e.target.value)}
                  placeholder="e.g. 53711-02190"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Condition">
                  <select value={form.condition} onChange={(e) => set('condition', e.target.value)} className={inputCls}>
                    <option value="oem">OEM</option>
                    <option value="aftermarket">Aftermarket</option>
                    <option value="used">Used</option>
                  </select>
                </Field>
                <Field label="Stock Status">
                  <select value={form.stockStatus} onChange={(e) => set('stockStatus', e.target.value)} className={inputCls}>
                    <option value="in_stock">In Stock</option>
                    <option value="limited">Limited</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price *">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls}>
                    <option value="GHS">GHS</option>
                    <option value="KES">KES</option>
                    <option value="ZAR">ZAR</option>
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={2}
                  placeholder="Optional description"
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {error && <p className="text-[#EF4444] text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-[#1E2E48] text-[#8A97AA] text-sm hover:bg-[#111E34]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-lg bg-[#F5A623] text-[#070C14] font-semibold text-sm hover:bg-[#F7BC5A] disabled:opacity-50"
                >
                  {isPending ? 'Adding…' : 'Add Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const inputCls =
  'w-full bg-[#111E34] border border-[#1E2E48] rounded-lg px-3 py-2 text-[#E8ECF1] text-sm placeholder-[#4A5568] focus:outline-none focus:border-[#F5A623] transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#8A97AA] text-xs mb-1.5">{label}</label>
      {children}
    </div>
  )
}
