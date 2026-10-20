import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, MapPin, MessageCircle } from 'lucide-react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LayerShowcase } from '@/components/LayerShowcase'
import { buildProductMessage, buildWhatsAppUrl, formatPrice } from '@/lib/shared'
import { getServerSideURL } from '@/utilities/getURL'
import type { Media, Product } from '@/payload-types'
import { getSiteSettings } from '@/utilities/getSiteSettings'

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config })
  const settings = await getSiteSettings(0)
  const description = settings.seoDefaults?.description || settings.hero?.description || settings.tagline || 'Thoughtfully designed 3D-printed products and custom creations from Hoskote, Bengaluru.'
  return {
    title: { absolute: `${settings.brandName || 'Cobraa 3D'} | Made in Hoskote. Made to be yours.` },
    description,
    alternates: { canonical: '/' },
    openGraph: { title: `${settings.brandName || 'Cobraa 3D'} | Made in Hoskote`, description, images: settings.ogImage && typeof settings.ogImage === 'object' && settings.ogImage.url ? [{ url: settings.ogImage.url }] : undefined },
  }
}

function photoOf(product: Product): Media | null {
  const image = product.images?.find((row) => row.image && typeof row.image === 'object')?.image
  return image && typeof image === 'object' ? image : null
}

export default async function HomePage() {
  const payload = await getPayload({ config })
  const [settings, productsResult] = await Promise.all([
    getSiteSettings(0),
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, sort: 'sortOrder,title', depth: 1, limit: 12 }),
  ])
  const products = (productsResult.docs as Product[])
    .filter((product) => process.env.NODE_ENV !== 'production' || !product.isDemo)
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.sortOrder || 0) - (b.sortOrder || 0))
  const featured = products.slice(0, 3)
  const heroProduct = products.find((product) => !product.isDemo && product.images?.some((row) => row.image && typeof row.image === 'object' && row.image.url))
  const heroPhoto = heroProduct ? photoOf(heroProduct) : null
  const whatsappURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: 'Hi Cobraa 3D, I found your connect page and would like to know more about your products.' })
  const customURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: 'Hi Cobraa 3D, I have an idea for a custom 3D print. I\'d like to discuss the design, colours and pricing.' })
  const baseURL = getServerSideURL()

  return <main className="connect-page">
    <section className="connect-hero" id="top" aria-labelledby="connect-title">
      <div className="hero-contour-lines" aria-hidden="true" />
      <div className="connect-hero-copy">
        <p className="connect-eyebrow">{settings.brandName || 'COBRAA 3D'} <span>·</span> HOSKOTE, BENGALURU</p>
        <h1 id="connect-title">Made in Hoskote.<br /><em>Made to be yours.</em></h1>
        <p className="connect-intro">Thoughtfully designed 3D-printed products, personalised gifts and custom creations — made one layer at a time.</p>
        <div className="connect-hero-actions">
          <Link className="button-dark" href="#products">Explore products <ArrowDownRight size={17} /></Link>
          {whatsappURL && <a className="button-light" href={whatsappURL} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Chat on WhatsApp</a>}
        </div>
        {!whatsappURL && process.env.NODE_ENV !== 'production' && <p className="connect-dev-warning">Add a valid business WhatsApp number in Site Settings to enable contact links.</p>}
      </div>
      <div className={`connect-hero-visual${heroPhoto?.url ? ' has-photo' : ' needs-photo'}`}>
        {heroPhoto?.url ? <Image src={heroPhoto.url} alt={heroPhoto.alt || heroProduct?.title || 'Cobraa 3D product'} fill priority sizes="(max-width: 760px) 92vw, 48vw" unoptimized={!heroPhoto.url.startsWith('/')} /> : <div className="hero-photo-placeholder"><span className="placeholder-orbit" aria-hidden="true" /><p>Studio photograph needed</p><small>Add a genuine product photo in the admin to feature it here.</small></div>}
        {heroPhoto?.url && heroProduct && <span className="hero-image-caption">{heroProduct.title}</span>}
      </div>
      <a className="hero-scroll-cue" href="#products" aria-label="Scroll to featured products"><span />Scroll to explore</a>
    </section>

    <section className="connect-products" id="products" aria-labelledby="featured-title">
      <header className="connect-section-heading">
        <div><p className="connect-eyebrow">Selected work</p><h2 id="featured-title">A few things we’ve made.</h2></div>
        <p>Useful little objects, thoughtful gifts and ideas brought to life in 3D.</p>
      </header>
      {featured.length ? <div className="connect-product-grid">{featured.map((product) => {
        const image = photoOf(product)
        const messageProduct = { ...product, whatsappMessageOverride: "Hi Cobraa 3D, I'm interested in the {{title}}. Please share more details, available customisation options and pricing. {{url}}" }
        const productWhatsApp = buildWhatsAppUrl({ number: settings.whatsappNumber, message: buildProductMessage(messageProduct, { baseURL }, settings) })
        return <article className="connect-product-card" key={product.id}>
          <Link className="connect-product-photo" href={`/products/${product.slug}`} scroll={false} aria-label={`View ${product.title}`}>
            {image?.url ? <Image src={image.url} alt={image.alt || product.title} fill sizes="(max-width: 700px) 46vw, (max-width: 1000px) 30vw, 25vw" unoptimized={!image.url.startsWith('/')} /> : <span className="connect-card-photo-needed">{product.isDemo ? 'Temporary illustration needed' : 'Product photo needed'}</span>}
            {product.isDemo && process.env.NODE_ENV !== 'production' && <span className="demo-product-mark">Development sample</span>}
          </Link>
          <div className="connect-product-copy"><div><h3><Link href={`/products/${product.slug}`} scroll={false}>{product.title}</Link></h3><p>{product.shortDescription}</p></div>
            {!product.isDemo && product.priceMode !== 'ask' && product.price != null && <span className="connect-product-price">{formatPrice(product.price, product.priceMode, product.currency || 'INR')}</span>}
          </div>
          <div className="connect-card-actions"><Link href={`/products/${product.slug}`}>View product <ArrowUpRight size={15} /></Link>{productWhatsApp ? <a className="connect-product-enquire" href={productWhatsApp} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> Enquire on WhatsApp</a> : <button type="button" disabled>WhatsApp unavailable</button>}</div>
        </article>
      })}</div> : <div className="connect-products-pending"><span className="pending-mark" aria-hidden="true">C3</span><div><h3>Product photographs are being prepared.</h3><p>Ask us about a custom piece while the catalogue is coming together.</p>{whatsappURL && <a href={whatsappURL} target="_blank" rel="noopener noreferrer">Ask on WhatsApp <ArrowUpRight size={15} /></a>}</div></div>}
      <Link className="connect-view-all" href="/products">View all products <ArrowUpRight size={16} /></Link>
    </section>

    <section className="connect-showcase" aria-labelledby="layer-title">
      <div className="showcase-contours" aria-hidden="true" />
      <div className="showcase-copy"><p className="connect-eyebrow">A different way to make</p><h2 id="layer-title">A little idea.<br /><em>Layer by layer.</em></h2><p>From a simple everyday object to something made just for you.</p><span className="showcase-instruction">Drag the form to explore its layers</span></div>
      <LayerShowcase />
    </section>

    <section className="connect-custom" id="custom" aria-labelledby="custom-title">
      <div className="custom-copy"><p className="connect-eyebrow">Made around your idea</p><h2 id="custom-title">Have something<br /><em>in mind?</em></h2><p>Personalised gifts, nameplates, desk accessories or a completely new idea. Tell us what you’d like to make.</p><p className="custom-details">Discuss colours, text, quantities and feasibility with the studio.</p></div>
      <div className="custom-actions">
        {customURL && <a className="button-dark" href={customURL} target="_blank" rel="noopener noreferrer">Discuss your idea on WhatsApp <ArrowUpRight size={16} /></a>}
        <Link className="button-light" href="/custom">Explore custom options <ArrowUpRight size={16} /></Link>
      </div>
    </section>

    <footer className="connect-footer" id="location">
      <div className="footer-contours" aria-hidden="true" />
      <div className="footer-main"><div><Link href="/" className="footer-brand">{settings.brandName || 'COBRAA 3D'}</Link><p>Hoskote, Bengaluru</p></div>
        <nav aria-label="Footer links"><Link href="/products">Products</Link><Link href="/custom">Custom orders</Link>{settings.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={15} /> Directions</a>}</nav>
        <div className="footer-contact">{whatsappURL && <a className="footer-whatsapp" href={whatsappURL} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Chat on WhatsApp <ArrowUpRight size={15} /></a>}</div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.brandName || 'Cobraa 3D'}</span><span>Designed and made one layer at a time.</span></div>
    </footer>
  </main>
}
