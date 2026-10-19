import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { PaintingKitAudience } from '@/components/PaintingKitAudience'
import type { BrowserProduct } from '@/components/ProductsBrowser'
import { buildProductMessage, buildWhatsAppUrl } from '@/lib/shared'
import { getServerSideURL } from '@/utilities/getURL'

export const metadata: Metadata = { title: 'Painting Kits', alternates: { canonical: '/painting-kits' } }
export default async function PaintingKitsPage() {
  const payload = await getPayload({ config })
  const [products, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, depth: 2, limit: 100 }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])
  const kits = products.docs.filter((p) => /paint|colour|color|kit/i.test(`${p.title} ${p.slug} ${typeof p.category === 'object' ? p.category?.name : ''}`))
  const items: BrowserProduct[] = kits.map((p) => ({ id: p.id, slug: p.slug || '', title: p.title, shortDescription: p.shortDescription, price: p.price, currency: p.currency, priceMode: p.priceMode, featured: p.featured, publishedAt: p.publishedAt, badges: p.badges, availability: p.availability, category: typeof p.category === 'object' && p.category ? { slug: p.category.slug || '', name: p.category.name } : null, isDemo: p.isDemo, ageGroup: p.ageGroup, images: (p.images || []).map((x) => ({ alt: x.alt || p.title, image: typeof x.image === 'object' && x.image ? { url: x.image.url, width: x.image.width, height: x.image.height } : undefined })), whatsappURL: buildWhatsAppUrl({ message: buildProductMessage(p, { baseURL: getServerSideURL() }), number: settings.whatsappNumber }) }))
  return <main className="store-page"><p className="section-eyebrow">COLOUR · CREATE · DISPLAY</p><h1>Painting kits</h1><p>Explore the kits currently listed in the catalogue. Ask us about the contents and availability.</p><PaintingKitAudience products={items} /></main>
}
