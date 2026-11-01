import type { Media } from '@/payload-types'

export type ProductImageSize = 'medium' | 'square' | 'thumbnail' | 'large'
export type ProductImageSource = { url: string; width: number }

function resolveImageURL(url: string, baseURL?: string) {
  return baseURL ? new URL(url, baseURL).toString() : url
}

export function getProductImageSources(
  image: number | Media | null | undefined,
  options: { preferredSizes?: readonly ProductImageSize[]; baseURL?: string } = {},
): ProductImageSource[] {
  if (typeof image !== 'object' || image === null) return []

  return (options.preferredSizes || ['thumbnail', 'square', 'medium', 'large'])
    .flatMap((size) => {
      const source = image.sizes?.[size]
      return source?.url && typeof source.width === 'number'
        ? [{ url: resolveImageURL(source.url, options.baseURL), width: source.width }]
        : []
    })
    .sort((a, b) => a.width - b.width)
}

export function getProductImageURL(
  image: number | Media | null | undefined,
  options: { preferredSizes?: readonly ProductImageSize[]; baseURL?: string } = {},
): string | undefined {
  if (typeof image !== 'object' || image === null) return undefined

  const mediaURL = options.preferredSizes?.map((size) => image.sizes?.[size]?.url).find(Boolean) || image.url
  if (!mediaURL) return undefined

  return resolveImageURL(mediaURL, options.baseURL)
}
