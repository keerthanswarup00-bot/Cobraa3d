import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownRight, ArrowRight, Box, MapPin, MessageCircle, Nfc } from 'lucide-react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { ConnectProduct } from '@/components/home/ConnectProducts'
import { HomeProductGrid } from '@/components/home/HomeProductGrid'
import { HomeReviews } from '@/components/home/HomeReviews'
import { buildProductMessage, buildWhatsAppUrl } from '@/lib/shared'
import { slugifyFilterValue } from '@/lib/catalogFilters'
import { getDisplayPrice } from '@/lib/pricing'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import type { Product } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings(0)
  const description = settings.seoDefaults?.description || settings.hero?.description || settings.tagline || undefined
  return {
    title: { absolute: settings.seoDefaults?.title || settings.brandName || 'Cobraa 3D' },
    description,
    alternates: { canonical: '/' },
    openGraph: { title: settings.seoDefaults?.title || settings.brandName || 'Cobraa 3D', description, images: settings.ogImage && typeof settings.ogImage === 'object' && settings.ogImage.url ? [{ url: settings.ogImage.url }] : undefined },
  }
}

type HomeCategory = { id: number | string; name: string; slug: string; sortOrder: number }

function visualFor(product: Product): ConnectProduct['visual'] {
  const category = typeof product.category === 'object' && product.category ? product.category.name || '' : ''
  const value = `${product.slug || ''} ${product.title} ${category}`.toLowerCase()
  if (value.includes('nameplate') || value.includes('name plate')) return 'plate'
  if (value.includes('keychain') || value.includes('key chain')) return 'key'
  if (value.includes('lamp') || value.includes('light')) return 'lamp'
  if (value.includes('phone stand') || value.includes('phone-stand')) return 'stand'
  if (value.includes('photo stand') || value.includes('photo-stand')) return 'photo'
  return 'sphere'
}

function asHomeProduct(product: Product, siteURL: string, productTemplate?: string | null, whatsappNumber?: string | null): ConnectProduct {
  const mediaRow = product.images?.find((row) => row.image && typeof row.image === 'object')
  const media = mediaRow?.image && typeof mediaRow.image === 'object' ? mediaRow.image : null
  const category = typeof product.category === 'object' && product.category ? product.category : null
  const displayPrice = getDisplayPrice({ id: product.id, price: product.price, salePrice: product.salePrice, priceMode: product.priceMode, currency: product.currency })
  const messagePrice = displayPrice.showOffer ? displayPrice.offerPrice ?? product.price : product.price
  const message = buildProductMessage({
    title: product.title,
    slug: product.slug,
    price: messagePrice,
    priceMode: product.priceMode,
    currency: product.currency,
    whatsappMessageOverride: product.whatsappMessageOverride,
    ageGroup: product.ageGroup,
    personalisable: product.personalisable,
    badges: product.badges,
    images: product.images?.map((row) => ({ alt: row.alt, image: row.image && typeof row.image === 'object' ? { url: row.image.url } : row.image })) || [],
  }, { baseURL: siteURL }, { messageTemplates: { product: productTemplate } })

  return {
    id: String(product.id),
    slug: product.slug || '',
    title: product.title,
    blurb: product.shortDescription || '',
    tag: product.badges?.[0] || category?.name || '3D printed',
    filament: product.colourOptions?.[0]?.hex || '#e6dcc6',
    visual: visualFor(product),
    sample: product.title,
    categorySlug: category ? category.slug || slugifyFilterValue(category.name) : null,
    image: media?.url ? { url: media.url, alt: mediaRow?.alt || media.alt || product.title, width: media.width, height: media.height } : undefined,
    priceLabel: displayPrice.priceLabel,
    whatsappURL: buildWhatsAppUrl({ number: whatsappNumber, message }),
  }
}

function ProductSection({ title, eyebrow, description, products, href, categorySlug, viewMore = 'View more products', eagerFirstImage = false }: {
  title: string; eyebrow?: string; description?: string; products: ConnectProduct[]; href?: string; categorySlug?: string; viewMore?: string; eagerFirstImage?: boolean
}) {
  if (!products.length) return null
  return <section className="home-section home-product-section" aria-label={title} data-category-slug={categorySlug}>
    <div className="home-section-inner">
      <header className="home-section-heading">
        <div>{eyebrow && <p className="home-eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>
        {description && <p className="home-section-description">{description}</p>}
      </header>
      <HomeProductGrid products={products.slice(0, 3)} productsURL={href || '/products'} viewAllLabel={viewMore} eagerFirstImage={eagerFirstImage} />
    </div>
  </section>
}

export default async function HomePage() {
  const payload = await getPayload({ config })
  const [settings, result] = await Promise.all([
    getSiteSettings(1),
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] }, sort: 'sortOrder,title', depth: 1, limit: 100 }),
  ])

  const siteURL = getServerSideURL()
  const allProducts = (result.docs as Product[]).map((product) => asHomeProduct(product, siteURL, settings.messageTemplates?.product, settings.whatsappNumber))
  const productsById = new Map(allProducts.map((product) => [product.id, product]))
  const cmsProducts = result.docs as Product[]
  const featuredFromSettings = (settings.hero?.featuredProducts || []).flatMap((entry) => {
    const id = typeof entry === 'object' ? String(entry.id) : String(entry)
    const product = productsById.get(id)
    return product ? [product] : []
  })
  const featuredCandidates = [...new Map([...featuredFromSettings, ...allProducts.filter((_, index) => Boolean(cmsProducts[index]?.featured))].map((product) => [product.id, product])).values()]
  const featured = [...featuredCandidates, ...allProducts.filter((product) => !featuredCandidates.some((selected) => selected.id === product.id))].slice(0, 3)

  const categoryMap = new Map<string, HomeCategory>()
  for (const product of cmsProducts) {
    const category = typeof product.category === 'object' && product.category ? product.category : null
    if (!category || category.visible !== true) continue
    const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (!categoryMap.has(slug)) categoryMap.set(slug, { id: category.id, name: category.name, slug, sortOrder: category.sortOrder || 0 })
  }
  const categories = [...categoryMap.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const lightingCategory = categories.find((category) => /lamp|light/.test(`${category.name} ${category.slug}`.toLowerCase()))
  const otherCategory = categories.find((category) => category.slug !== lightingCategory?.slug)
  const productGroups = new Map<string, ConnectProduct[]>()
  for (const product of allProducts) {
    if (!product.categorySlug) continue
    const items = productGroups.get(product.categorySlug) || []
    items.push(product)
    productGroups.set(product.categorySlug, items)
  }
  const lightingProducts = lightingCategory ? productGroups.get(lightingCategory.slug) || [] : []
  const otherProducts = otherCategory ? productGroups.get(otherCategory.slug) || [] : []
  const heroProduct = featured[0] || allProducts[0]
  const heroHeadline = settings.hero?.headline?.trim() || 'Creative 3D prints for curious minds.'
  const heroDescription = settings.hero?.description?.trim() || 'Colouring kits, thoughtful gifts and playful designs made to bring imagination to life.'
  const whatsAppURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: 'Hi Cobraa 3D, I would like to ask about your products.' })
  const instagram = settings.instagram?.trim()
    ? (/^https?:\/\//i.test(settings.instagram) ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, '')}`)
    : null
  const footerSocialLinks = [
    ...(instagram ? [{ label: 'Instagram', url: instagram }] : []),
    ...(settings.socialLinks || []).filter((link) => link?.url).map((link) => ({ label: link.label || 'Social', url: link.url! })),
  ].filter((link, index, links) => links.findIndex((candidate) => candidate.url === link.url) === index)

  return <main className="studio-home home-rework" id="top">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <p className="home-eyebrow"><MapPin size={14} aria-hidden="true" /> Hoskote, Bengaluru</p>
        <h1 id="home-title">{heroHeadline}</h1>
        <p className="home-hero-description">{heroDescription}</p>
        <div className="home-hero-actions">
          <Link className="home-button home-button-primary" href="/products">{settings.hero?.primaryCtaLabel || 'Browse products'} <ArrowRight size={17} /></Link>
          {whatsAppURL && <a className="home-button home-button-secondary" href={whatsAppURL} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Chat on WhatsApp</a>}
        </div>
      </div>
      {heroProduct && <Link className="home-hero-visual" href={`/products/${heroProduct.slug}`} aria-label={`Discover ${heroProduct.title}`}>
        {heroProduct.image?.url ? <Image src={heroProduct.image.url} alt={heroProduct.image.alt || heroProduct.title} fill loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 48vw" unoptimized={!heroProduct.image.url.startsWith('/')} /> : <div className="home-hero-placeholder" aria-hidden="true"><Box size={68} strokeWidth={1} /></div>}
        <span>{heroProduct.title}<ArrowDownRight size={18} aria-hidden="true" /></span>
      </Link>}
    </section>

    <ProductSection eyebrow="Selected for you" title="Featured products" description="A few pieces from the studio." products={featured} href="/products" viewMore="View all products" eagerFirstImage />

    {lightingCategory && <ProductSection eyebrow="Explore by category" title={lightingCategory.name} products={lightingProducts} categorySlug={lightingCategory.slug} href={`/products?category=${encodeURIComponent(lightingCategory.slug)}`} viewMore={`View more ${lightingCategory.name.toLowerCase()}`} />}

    <section className="home-custom-teaser" id="custom" aria-labelledby="nfc-title">
      <div className="home-custom-icon"><Nfc size={35} strokeWidth={1.5} aria-hidden="true" /></div>
      <div><p className="home-eyebrow">Custom idea · in development</p><h2 id="nfc-title">NFC keychain</h2><p>A custom keychain concept we’re setting aside for a future build.</p></div>
      <span className="home-coming-soon">Coming later</span>
    </section>

    {otherCategory && <ProductSection eyebrow="More to explore" title={otherCategory.name} products={otherProducts} categorySlug={otherCategory.slug} href={`/products?category=${encodeURIComponent(otherCategory.slug)}`} viewMore={`View more ${otherCategory.name.toLowerCase()}`} />}

    <section className="home-info" aria-label="Studio information">
      <div className="home-info-item"><MapPin size={19} aria-hidden="true" /><div><h3>Made in Hoskote</h3><p>Based in Bengaluru, Karnataka.</p></div></div>
      <div className="home-info-item"><MessageCircle size={19} aria-hidden="true" /><div><h3>Questions or custom ideas?</h3><p>Talk to us directly on WhatsApp.</p></div></div>
      <div className="home-info-item"><Box size={19} aria-hidden="true" /><div><h3>Made in 3D</h3><p>Explore the catalogue to see each piece and its details.</p></div></div>
    </section>

    <HomeReviews />

    <section className="home-about" aria-labelledby="about-title">
      <div className="home-about-copy"><p className="home-eyebrow">A little about us</p><h2 id="about-title">About Cobraa 3D</h2><p>At Cobraa 3D, we turn creativity into something you can touch! We create fun, thoughtfully designed 3D-printed products that inspire kids to explore, colour, create, and learn. From unique colouring kits to creative gifts, every product is made to bring imagination to life, one creation at a time.</p></div>
    </section>

    <footer className="home-footer">
      <div className="home-footer-top"><Link href="/" className="home-footer-brand">Cobraa<i>.</i>3D</Link><nav aria-label="Footer navigation"><Link href="/products">Products</Link><Link href="/location">About the studio</Link>{settings.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer">Directions</a>}{footerSocialLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}<Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>{whatsAppURL && <a href={whatsAppURL} target="_blank" rel="noopener noreferrer">WhatsApp <ArrowRight size={15} /></a>}</div>
      <div className="home-footer-bottom"><span>© {new Date().getFullYear()} {settings.brandName || 'Cobraa 3D'}</span><span>Hoskote, Bengaluru</span><Link href="#top">Back to top ↑</Link></div>
    </footer>
  </main>
}
