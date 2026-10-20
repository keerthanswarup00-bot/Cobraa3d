import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, limit: 1000, depth: 0 })
  const baseURL = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const items: MetadataRoute.Sitemap = [
    { url: `${baseURL}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseURL}/products`, changeFrequency: 'daily', priority: 0.8 },
  ]
  for (const product of docs) {
    if (!product.slug) continue
    if ((product as any).isDemo && process.env.NODE_ENV === 'production') continue
    items.push({ url: `${baseURL}/products/${product.slug}`, lastModified: product.updatedAt, changeFrequency: 'weekly', priority: 0.7 })
  }
  return items
}
