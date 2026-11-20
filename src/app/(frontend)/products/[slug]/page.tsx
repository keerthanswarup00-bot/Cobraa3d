import type { Metadata } from 'next'
import { cache } from 'react'
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
import { SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH, getProductShareImageURL } from '@/lib/shareImage-constants'
import { getSiteSettings } from '@/utilities/getSiteSettings'

export const revalidate = 60

const loadProduct = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const [result, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] }, limit: 1, depth: 1 }),
    getSiteSettings(0),
  ])
  const product = result.docs[0]
  return { product, settings }
})

function textFromLexical(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const item = value as { text?: string; children?: unknown[] }
  return [item.text || '', ...(item.children || []).map(textFromLexical)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function getProductDescription(product: Product) {
  return product.seoDescription || product.meta?.description || product.shortBenefit || product.shortDescription || product.title
}

function urlForMedia(image: Product['images'] extends (infer _T)[] | null | undefined ? unknown : unknown) {
  if (!image || typeof image !== 'object') return undefined
  const media = image as {
    url?: string | null
    alt?: string | null
    sizes?: { medium?: { url?: string | null } | null; large?: { url?: string | null } | null }
  }
  const url = media.sizes?.medium?.url || media.url
  return url ? { url, alt: media.alt || '' } : undefined
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { product, settings } = await loadProduct(slug)
  if (!product) {
    const temporary = TEMP_PRODUCTS.find((item) => item.slug === slug)
    return temporary ? { title: temporary.name, description: temporary.blurb, robots: { index: false, follow: true } } : { title: 'Product not found' }
  }
  const canonical = `/products/${product.slug}`
  const brandName = settings.brandName || 'Cobraa 3D'
  const title = product.seoTitle || product.meta?.title || `${product.title} | ${brandName}, Hoskote`
  const description = getProductDescription(product)
  // 1200x630 share card built from the product photo (see share.jpg/route.ts); falls back to the site default image.
  const shareImage = {
    url: getProductShareImageURL(getServerSideURL(), product.slug || slug, product.updatedAt),
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    type: 'image/jpeg',
    alt: product.images?.[0]?.alt || product.title,
  }
  return {
    title, description, alternates: { canonical }, robots: product.isDemo ? { index: false, follow: false } : undefined,
    openGraph: { type: 'website', siteName: brandName, locale: 'en_IN', title, description, url: canonical, images: [shareImage] },
    twitter: { card: 'summary_large_image', title, description, images: [{ url: shareImage.url, alt: shareImage.alt }] },
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
    const url = media?.sizes?.square?.url || media?.sizes?.thumbnail?.url || media?.url
    return { slug: item.slug || '', title: item.title, image: url ? { url, alt: item.images?.[0]?.alt || item.title } : undefined }
  })
  const productData = {
    title: product.title, slug: product.slug || slug, shortDescription: product.shortDescription,
    descriptionText: textFromLexical(product.description?.root), price: product.price, salePrice: product.salePrice, originalPrice: product.originalPrice,
    currency: product.currency, priceMode: product.priceMode, availability: product.availability, images: photos,
    includedItems: product.includedItems?.map((item) => item.item.trim()).filter(Boolean), shortIncludes: product.shortIncludes,
    colourOptions: product.colourOptions?.map(({ name, hex }) => ({ name, hex })),
    powerAndBulb: product.powerAndBulb,
    dimensions: product.dimensions, material: product.material, ageGroup: product.ageGroup, personalisable: product.personalisable,
    personalisationNotes: product.personalisationNotes, careNotes: product.careNotes, productionNote: product.productionNote,
    badges: product.badges, whatsappMessageOverride: product.whatsappMessageOverride, isDemo: product.isDemo,
  }
  const displayPrice = getDisplayPrice({ id: product.id, price: product.price, salePrice: product.salePrice, priceMode: product.priceMode, currency: product.currency })
  const availabilityByStatus: Partial<Record<NonNullable<Product['availability']>, string>> = {
    in_stock: 'https://schema.org/InStock',
    out_of_stock: 'https://schema.org/OutOfStock',
  }
  const availability = product.availability ? availabilityByStatus[product.availability] : undefined
  const offerPrice = displayPrice.showOffer ? displayPrice.offerPrice : displayPrice.regularPrice
  const schema = product.isDemo ? null : {
    '@context': 'https://schema.org', '@type': 'Product', name: product.title, description: getProductDescription(product),
    image: photos.map((photo) => new URL(photo.url, siteURL).href),
    ...(product.priceMode === 'show' && offerPrice != null ? {
      offers: {
        '@type': 'Offer',
        priceCurrency: product.currency || 'INR',
        price: offerPrice,
        url: `${siteURL}/products/${product.slug}`,
        ...(availability ? { availability } : {}),
      },
    } : {}),
  }
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteURL }, { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteURL}/products` },
    { '@type': 'ListItem', position: 3, name: product.title, item: `${siteURL}/products/${product.slug}` },
  ] }
  return <>
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }} />
    <ProductDetail product={productData} brandName={settings.brandName} deliveryLine={settings.deliveryLine?.trim()} whatsappNumber={settings.whatsappNumber} productTemplate={settings.messageTemplates?.product} siteURL={siteURL} ctaLabel={settings.productEnquiryCtaLabel || 'Ask on WhatsApp'} related={related} />
    {product.faq?.length ? <section className="product-detail-extras" aria-labelledby="product-faq-title"><h2 id="product-faq-title">Frequently asked questions</h2>{product.faq.map((entry, index) => entry.question?.trim() && entry.answer?.trim() ? <details key={`${entry.question}-${index}`}><summary>{entry.question}</summary><p>{entry.answer}</p></details> : null)}</section> : null}

  </>
}
