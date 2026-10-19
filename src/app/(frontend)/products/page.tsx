import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductsBrowser, type BrowserProduct, type BrowserCategory } from '@/components/ProductsBrowser'
import { buildProductMessage, buildWhatsAppUrl } from '@/lib/shared'
import { findVisibleCategories } from '@/lib/shared'
import type { Metadata } from 'next'
import type { Category } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Products',
  alternates: { canonical: '/products' },
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; sort?: string }> }) {
  const params = await searchParams
  const payload = await getPayload({ config })
  const [{ docs: rawProducts }, categories, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, sort: 'sortOrder,title', depth: 2, limit: 100 }),
    findVisibleCategories(payload),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])
  const browserCategories: BrowserCategory[] = (categories as Category[]).filter((c) => c.slug).map((c) => ({ slug: c.slug, name: c.name }))
  const visibleSlugs = new Set(browserCategories.map((c) => c.slug))
  const products: BrowserProduct[] = rawProducts.filter((p) => process.env.NODE_ENV !== 'production' || !p.isDemo).map((p) => {
    const category = typeof p.category === 'object' && p.category ? { slug: p.category.slug, name: p.category.name } : null
    const message = buildProductMessage(p, { baseURL: getServerSideURL() }, settings)
    const whatsappURL = buildWhatsAppUrl({ message, number: settings.whatsappNumber })
    return {
      id: p.id, slug: p.slug || '', title: p.title, shortDescription: p.shortDescription, seasonalTags: p.seasonalTags,
      isDemo: p.isDemo,
      price: p.price, currency: p.currency, priceMode: p.priceMode, featured: p.featured, publishedAt: p.publishedAt,
      badges: p.badges, availability: p.availability, category: category && visibleSlugs.has(category.slug || '') ? category : null,
      images: (p.images || []).map((entry) => ({ alt: entry.alt, image: typeof entry.image === 'object' && entry.image ? { url: entry.image.url, width: entry.image.width, height: entry.image.height } : undefined })),
      whatsappURL,
    }
  })
  const category = params.category && visibleSlugs.has(params.category) ? params.category : ''
  const sort = ['featured', 'newest', 'price-asc', 'price-desc', 'name-asc'].includes(params.sort || '') ? params.sort as 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc' : 'featured'
  return <main className="products-page">
    <header className="products-heading"><Link href="/" className="products-brand">{settings.brandName}</Link><h1>Products</h1><p>Explore the catalogue and ask us about anything that catches your eye.</p></header>
    {!settings.whatsappNumber && process.env.NODE_ENV !== 'production' && <p className="connect-dev-warning">Add a valid business WhatsApp number in Site Settings to enable enquiry links.</p>}
    <ProductsBrowser products={products} categories={browserCategories} initialCategory={category} initialQuery={params.q || ''} initialSort={sort} />
  </main>
}
