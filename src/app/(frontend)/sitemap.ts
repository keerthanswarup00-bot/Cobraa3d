import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const baseURL = getServerSideURL()
  const pages = await payload.findGlobal({ slug: 'legal-pages', depth: 0 })
  const hasContent = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false
    const node = value as { text?: string; children?: unknown[] }
    return Boolean(node.text?.trim() || node.children?.some(hasContent))
  }
  const routes = [
    { url: `${baseURL}/`, changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${baseURL}/products`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${baseURL}/location`, changeFrequency: 'monthly' as const, priority: 0.6 },
    ...(hasContent(pages.privacy) ? [{ url: `${baseURL}/privacy`, changeFrequency: 'yearly' as const, priority: 0.3 }] : []),
    ...(hasContent(pages.terms) ? [{ url: `${baseURL}/terms`, changeFrequency: 'yearly' as const, priority: 0.3 }] : []),
  ]
  const productURLs: MetadataRoute.Sitemap = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const result = await payload.find({
      collection: 'products',
      where: { and: [
        { status: { equals: 'published' } },
        { _status: { equals: 'published' } },
        ...(process.env.NODE_ENV === 'production' ? [{ isDemo: { not_equals: true } }] : []),
      ] },
      page,
      limit: 1000,
      depth: 0,
    })
    productURLs.push(...result.docs.filter((product) => product.slug).map((product) => ({
      url: `${baseURL}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })))
    hasNextPage = result.hasNextPage
    page += 1
  }
  return [...routes, ...productURLs]
}
