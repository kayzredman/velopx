'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { partImageSrc, partPrimaryImage, PART_PLACEHOLDER } from '@/lib/partImages'

interface PartImageGalleryProps {
  images: string[]
  alt: string
  className?: string
}

export function PartImageGallery({ images, alt, className }: PartImageGalleryProps) {
  const valid = images.filter(Boolean)
  const [active, setActive] = useState(0)
  const main = valid[active] ?? null
  const src = main ?? PART_PLACEHOLDER

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
        <Image
          src={partImageSrc(main ? [main] : [])}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 560px"
          unoptimized={src.startsWith('/uploads/')}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = PART_PLACEHOLDER
          }}
        />
      </div>
      {valid.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {valid.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                i === active ? 'border-primary' : 'border-border opacity-70 hover:opacity-100'
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
                unoptimized={url.startsWith('/uploads/')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PartThumbnail({
  images,
  alt,
  className,
}: {
  images?: string[]
  alt: string
  className?: string
}) {
  const src = partImageSrc(images)
  const hasPhoto = !!partPrimaryImage(images)

  return (
    <div
      className={cn(
        'relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={cn('object-cover', !hasPhoto && 'opacity-80')}
        sizes="(max-width:640px) 50vw, 240px"
        unoptimized={src.startsWith('/uploads/')}
      />
    </div>
  )
}
