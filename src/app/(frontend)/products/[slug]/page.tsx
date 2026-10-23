import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductDetail } from '@/components/ProductDetail'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ConnectTerrain } from '@/components/home/ConnectTerrain'
import { ProductRender, type ConnectProduct } from '@/components/home/ConnectProducts'
import { getDisplayPrice } from '@/lib/pricing'
import { TEMP_PRODUCTS } from '@/lib/tempProducts'
import type { Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 60

async function loadProduct(slug: string) {
  const payload = await getPayload({ config })
  const [result, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] }, limit: 1, depth: 1 }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])
  const product = result.docs[0]
  return { product, settings }
}

function textFromLexical(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const item = value as { text?: string; children?: unknown[] }
  return [item.text || '', ...(item.children || []).map(textFromLexical)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function urlForMedia(image: Product['images'] extends (infer _T)[] | null | undefined ? unknown : unknown) {
  if (!image || typeof image !== 'object') return undefined
  const media = image as { url?: string | null; alt?: string | null }
  return media.url ? { url: media.url, alt: media.alt || '' } : undefined
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { product } = await loadProduct(slug)
  if (!product) {
    const temporary = TEMP_PRODUCTS.find((item) => item.slug === slug)
    return temporary ? { title: temporary.name, description: temporary.blurb, robots: { index: false, follow: true } } : { title: 'Product not found' }
  }
  const mainImage = product.images?.[0]?.image
  const media = typeof mainImage === 'object' && mainImage ? mainImage : null
  const canonical = `/products/${product.slug}`
  const title = product.seoTitle || product.meta?.title || product.title
  const description = product.seoDescription || product.meta?.description || product.shortDescription || undefined
  return {
    title, description, alternates: { canonical }, robots: product.isDemo ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url: canonical, images: media?.url ? [{ url: media.url, alt: product.images?.[0]?.alt || product.title }] : undefined },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { product, settings } = await loadProduct(slug)
  if (!product) {
    const temporary = TEMP_PRODUCTS.find((item) => item.slug === slug)
    if (!temporary) notFound()
    const visual: ConnectProduct = { id: temporary.id, slug: temporary.slug, title: temporary.name, blurb: temporary.blurb, tag: temporary.tag, filament: temporary.fil, visual: temporary.vis, sample: 'sample' in temporary ? temporary.sample : undefined, temporary: true }
    return <main className="studio-home studio-temp-detail"><ConnectTerrain /><div className="studio-vignette" aria-hidden="true" /><section className="studio-temp-detail-inner studio-wrap"><Link href="/products" className="studio-temp-back">← All products</Link><div className="studio-temp-visual"><ProductRender product={visual} animate={false} buildKey={0} /></div><p className="studio-eyebrow">{temporary.tag} · Temporary catalogue preview</p><h1>{temporary.name}</h1><p className="studio-temp-description">{temporary.blurb}</p><p className="studio-temp-note">This temporary preview has no price or availability details.</p><Link className="studio-button is-light" href={`/?item=${temporary.id}#custom`}>Customise this piece <ArrowUpRight size={16} /></Link></section></main>
  }
  const payload = await getPayload({ config })
  let relatedProducts: Product[] = []
  const manual = (product.relatedProducts || []).filter((item): item is Product => typeof item === 'object' && !!item && item.status === 'published' && item._status === 'published' && (process.env.NODE_ENV !== 'production' || !item.isDemo))
  if (manual.length) relatedProducts = manual.slice(0, 6)
  else if (typeof product.category === 'object' && product.category) {
    const related = await payload.find({ collection: 'products', where: { and: [{ category: { equals: product.category.id } }, { id: { not_equals: product.id } }, { status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, limit: 6, depth: 1, sort: 'sortOrder,title' })
    relatedProducts = related.docs
  }
  const siteURL = getServerSideURL()
  const photos = (product.images || []).map((row) => ({ ...urlForMedia(row.image), alt: row.alt || product.title })).filter((item): item is { url: string; alt: string } => Boolean(item.url))
  const related = relatedProducts.map((item) => {
    const image = item.images?.[0]?.image
    const media = typeof image === 'object' && image ? image : undefined
    return { slug: item.slug || '', title: item.title, image: media?.url ? { url: media.url, alt: item.images?.[0]?.alt || item.title } : undefined }
  })
  const productData = {
    title: product.title, slug: product.slug || slug, shortDescription: product.shortDescription,
    descriptionText: textFromLexical(product.description?.root), price: product.price, salePrice: product.salePrice, originalPrice: product.originalPrice,
    currency: product.currency, priceMode: product.priceMode, availability: product.availability, images: photos,
    includedItems: product.includedItems?.map((item) => item.item), colourOptions: product.colourOptions?.map(({ name, hex }) => ({ name, hex })),
    dimensions: product.dimensions, material: product.material, ageGroup: product.ageGroup, personalisable: product.personalisable,
    personalisationNotes: product.personalisationNotes, careNotes: product.careNotes, productionNote: product.productionNote,
    badges: product.badges, whatsappMessageOverride: product.whatsappMessageOverride, isDemo: product.isDemo,
  }
  const displayPrice = getDisplayPrice({ id: product.id, price: product.price, salePrice: product.salePrice, priceMode: product.priceMode, currency: product.currency })
  const hasStructuredOffer = product.priceMode === 'show' && typeof product.price === 'number' && product.availability && !product.isDemo && displayPrice.showOffer
  const schema = product.isDemo ? null : {
    '@context': 'https://schema.org', '@type': 'Product', name: product.title, description: product.seoDescription || product.shortDescription || undefined,
    image: photos.map((photo) => photo.url), sku: undefined,
    ...(hasStructuredOffer ? { offers: { '@type': 'Offer', priceCurrency: product.currency || 'INR', price: displayPrice.offerPrice ?? product.price, availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : product.availability === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/PreOrder', url: `${siteURL}/products/${product.slug}` } } : product.priceMode === 'show' && typeof product.price === 'number' ? { offers: { '@type': 'Offer', priceCurrency: product.currency || 'INR', price: product.price, availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : product.availability === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/PreOrder', url: `${siteURL}/products/${product.slug}` } } : {}),
  }
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteURL }, { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteURL}/products` },
    { '@type': 'ListItem', position: 3, name: product.title, item: `${siteURL}/products/${product.slug}` },
  ] }
  return <>
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }} />
    <ProductDetail product={productData} brandName={settings.brandName} whatsappNumber={settings.whatsappNumber} productTemplate={settings.messageTemplates?.product} siteURL={siteURL} ctaLabel={settings.productEnquiryCtaLabel || 'Ask on WhatsApp'} related={related} />
  </>
}
