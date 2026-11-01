import { describe, expect, it } from 'vitest'
import { shouldOptimizeImage } from '@/lib/imageOptimization'
import { getProductThumbnailURL, previewImages } from '@/lib/productPreview'
import type { Product } from '@/payload-types'

describe('configured media image optimization', () => {
  it('optimizes local media paths', () => {
    expect(shouldOptimizeImage('/api/media/file/lamp.webp', '')).toBe(true)
  })

  it('optimizes public media URLs only within the configured origin and path', () => {
    const base = 'https://cdn.example.test/storage/public/media'
    expect(shouldOptimizeImage('https://cdn.example.test/storage/public/media/lamp.webp', base)).toBe(true)
    expect(shouldOptimizeImage('https://cdn.example.test/private/lamp.webp', base)).toBe(false)
    expect(shouldOptimizeImage('https://other.example.test/storage/public/media/lamp.webp', base)).toBe(false)
  })

  it('keeps unconfigured remote hosts out of the optimizer', () => {
    expect(shouldOptimizeImage('https://cdn.example.test/lamp.webp', '')).toBe(false)
  })

  it('uses the original media URL for the preview image', () => {
    const product = {
      title: 'Desk lamp',
      images: [{
        alt: 'Lamp',
        image: {
          id: 1,
          alt: 'Uploaded lamp',
          url: 'https://cdn.example.test/media/lamp.webp',
          sizes: { medium: { url: 'https://cdn.example.test/media/lamp-medium.webp' } },
          updatedAt: '2026-11-01T00:00:00.000Z',
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      }],
    } satisfies Pick<Product, 'images' | 'title'>

    expect(previewImages(product)).toEqual([{ url: 'https://cdn.example.test/media/lamp.webp', alt: 'Lamp', fallbackURL: undefined }])
  })

  it('uses Payload thumbnail variants for the detail-page thumbnail strip', () => {
    const media = {
      id: 1,
      alt: 'Uploaded lamp',
      url: 'https://cdn.example.test/media/lamp.webp',
      sizes: { thumbnail: { url: 'https://cdn.example.test/media/lamp-300x.webp' } },
      updatedAt: '2026-11-01T00:00:00.000Z',
      createdAt: '2026-11-01T00:00:00.000Z',
    } satisfies NonNullable<Product['images']>[number]['image'] & object

    expect(getProductThumbnailURL(media)).toBe('https://cdn.example.test/media/lamp-300x.webp')
    expect(getProductThumbnailURL({ ...media, sizes: undefined })).toBe(media.url)
  })
})
