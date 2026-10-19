import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, limit: 1000, depth: 0 })
  const baseURL = getServerSideURL()
  return [
    { url: `${baseURL}/products`, changeFrequency: 'daily', priority: 0.8 },
    ...docs.filter((product) => product.slug).map((product) => ({ url: `${baseURL}/products/${product.slug}`, lastModified: product.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ]
}
