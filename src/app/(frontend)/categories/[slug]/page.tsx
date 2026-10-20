import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductsBrowser, type BrowserProduct } from '@/components/ProductsBrowser'
import { buildProductMessage, buildWhatsAppUrl } from '@/lib/shared'
import { getServerSideURL } from '@/utilities/getURL'
export const revalidate = 60
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return { title: slug.replaceAll('-', ' '), alternates: { canonical: `/categories/${slug}` } } }
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params; const payload = await getPayload({ config })
 const [categoryResult, settings] = await Promise.all([payload.find({ collection: 'categories', where: { and: [{ slug: { equals: slug } }, { visible: { equals: true } }] }, limit: 1 }), payload.findGlobal({ slug: 'site-settings', depth: 1 })])
 const category = categoryResult.docs[0]; if (!category) notFound()
 const result = await payload.find({ collection: 'products', where: { and: [{ category: { equals: category.id } }, { status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, depth: 1, limit: 100 })
 if (!result.docs.length) notFound()
 const products: BrowserProduct[] = result.docs.map((p) => ({ id: p.id, slug: p.slug || '', title: p.title, shortDescription: p.shortDescription, price: p.price, currency: p.currency, priceMode: p.priceMode, featured: p.featured, publishedAt: p.publishedAt, badges: p.badges, availability: p.availability, category: { slug, name: category.name }, isDemo: p.isDemo, images: (p.images || []).map((x) => ({ alt: x.alt || p.title, image: typeof x.image === 'object' && x.image ? { url: x.image.url, width: x.image.width, height: x.image.height } : undefined })), whatsappURL: buildWhatsAppUrl({ message: buildProductMessage(p, { baseURL: getServerSideURL() }), number: settings.whatsappNumber }) }))
 return <main className="store-page"><p className="section-eyebrow">SHOP BY CATEGORY</p><h1>{category.name}</h1>{category.description && <p>{category.description}</p>}<ProductsBrowser products={products} categories={[{ slug, name: category.name }]} initialCategory={slug} /></main>
}
