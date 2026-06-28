'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Upload, Link2 } from 'lucide-react'

interface PartImageInputProps {
  value: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
}

export function PartImageInput({ value, onChange, disabled }: PartImageInputProps) {
  const [urlDraft, setUrlDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function addUrl() {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    try {
      new URL(trimmed.startsWith('/') ? `http://local${trimmed}` : trimmed)
    } catch {
      setError('Enter a valid image URL')
      return
    }
    onChange([...value, trimmed])
    setUrlDraft('')
    setError(null)
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/uploads/part-image', { method: 'POST', body })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as { url: string }
      onChange([...value, json.url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Photos</p>
      <p className="text-xs text-muted-foreground">Paste a URL or upload from your device</p>

      <div className="flex gap-2">
        <Input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="https://… image URL"
          disabled={disabled}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
        />
        <Button type="button" variant="outline" size="icon" onClick={addUrl} disabled={disabled} title="Add URL">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          title="Upload image"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) uploadFile(f)
          }}
        />
      </div>

      {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs"
            >
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{url}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeAt(i)}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
