/** Resolve part image URLs for next/image and <img> */
export function partPrimaryImage(images?: string[] | null): string | null {
  const first = images?.find((u) => u.trim().length > 0)
  return first ?? null
}

export const PART_PLACEHOLDER = '/images/part-placeholder.svg'

export function partImageSrc(images?: string[] | null): string {
  return partPrimaryImage(images) ?? PART_PLACEHOLDER
}

/** Allow relative uploads and common CDNs */
export function isLocalUpload(url: string): boolean {
  return url.startsWith('/uploads/')
}
