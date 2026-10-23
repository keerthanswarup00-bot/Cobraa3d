import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { BriefProvider } from '@/components/home/BriefProvider'
import { ConnectBuilder } from '@/components/home/ConnectBuilder'
import { HomeHero } from '@/components/home/HomeHero'
import { ConnectProducts, type ConnectProduct } from '@/components/home/ConnectProducts'
import { ConnectHud, ConnectTerrain } from '@/components/home/ConnectTerrain'
import { resolveBriefConfig } from '@/components/home/briefConfig'
import { TEMP_PRODUCTS } from '@/lib/tempProducts'
import { buildProductMessage, buildWhatsAppUrl, isActiveWithinWindow } from '@/lib/shared'
import { env } from '@/lib/env'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { getServerSideURL } from '@/utilities/getURL'
import { getDisplayPrice } from '@/lib/pricing'
import type { Product } from '@/payload-types'
import { PushAlerts } from '@/components/PushAlerts'

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

function cmsVisual(product: Product): ConnectProduct['visual'] {
  const category = typeof product.category === 'object' && product.category ? product.category.name || '' : ''
  const value = `${product.slug || ''} ${product.title} ${category}`.toLowerCase()
  if (value.includes('nameplate') || value.includes('name plate')) return 'plate'
  if (value.includes('keychain') || value.includes('key chain')) return 'key'
  if (value.includes('lamp')) return 'lamp'
  if (value.includes('phone stand') || value.includes('phone-stand')) return 'stand'
  if (value.includes('photo stand') || value.includes('photo-stand')) return 'photo'
  return 'sphere'
}

function instagramLink(handle?: string | null) {
  const value = handle?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://instagram.com/${value.replace(/^@/, '')}`
}

export default async function HomePage() {
  const payload = await getPayload({ config })
  const [settings, result, printBed, offerResult] = await Promise.all([
    getSiteSettings(0),
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] }, sort: 'sortOrder,title', depth: 1, limit: 100 }),
    payload.find({ collection: 'print-bed', where: { and: [{ visible: { equals: true } }, { video: { exists: true } }] }, sort: '-postedAt', depth: 1, limit: 1 }),
    payload.find({ collection: 'offers', limit: 100, depth: 0 }),
  ])
  const cmsProducts = (result.docs as Product[]).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.sortOrder || 0) - (b.sortOrder || 0))
  const siteURL = getServerSideURL()
  const usingTemporary = cmsProducts.length === 0
  const allProducts: ConnectProduct[] = usingTemporary ? TEMP_PRODUCTS.map((product) => ({ id: product.id, slug: product.slug, title: product.name, blurb: product.blurb, tag: product.tag, filament: product.fil, visual: product.vis, sample: 'sample' in product ? product.sample : undefined, temporary: true, priceLabel: 'Ask for price' })) : cmsProducts.map((product) => {
    const mediaRow = product.images?.find((row) => row.image && typeof row.image === 'object')
    const media = mediaRow?.image && typeof mediaRow.image === 'object' ? mediaRow.image : null
    return {
      id: cmsVisual(product) === 'key' ? 'keychain' : cmsVisual(product) === 'lamp' ? 'lamp' : cmsVisual(product) === 'stand' ? 'stand' : cmsVisual(product) === 'photo' ? 'photo' : cmsVisual(product) === 'plate' ? 'nameplate' : 'other',
      slug: product.slug || '', title: product.title, blurb: product.shortDescription || '', tag: product.badges?.[0] || (typeof product.category === 'object' && product.category ? product.category.name || 'Made to order' : 'Made to order'),
      filament: product.colourOptions?.[0]?.hex || '#e6dcc6', visual: cmsVisual(product), sample: product.title,
      image: media?.url ? { url: media.url, alt: mediaRow?.alt || media.alt || product.title, width: media.width, height: media.height } : undefined,
      priceLabel: getDisplayPrice({ id: product.id, price: product.price, salePrice: product.salePrice, priceMode: product.priceMode, currency: product.currency }).priceLabel,
      whatsappURL: buildWhatsAppUrl({ number: settings.whatsappNumber, message: buildProductMessage({
        title: product.title,
        slug: product.slug,
        price: product.salePrice != null && product.priceMode === 'show' && product.salePrice < (product.price ?? Infinity) ? product.salePrice : product.price,
        priceMode: product.priceMode,
        currency: product.currency,
        whatsappMessageOverride: product.whatsappMessageOverride,
        ageGroup: product.ageGroup,
        personalisable: product.personalisable,
        badges: product.badges,
        images: product.images?.map((row) => ({ alt: row.alt, image: row.image && typeof row.image === 'object' ? { url: row.image.url } : row.image })) || [],
      }, { baseURL: siteURL }, { messageTemplates: { product: settings.messageTemplates?.product } }) }),
    }
  })
  const globalOffer = offerResult.docs.find((offer) => isActiveWithinWindow(offer) && !offer.applicableProducts?.length)
  const activeOfferText = globalOffer?.discountText?.trim() || globalOffer?.title?.trim() || null
  // CMS results are already ordered with explicitly featured items first; always fill the three-card row from real records.
  const featured = allProducts.slice(0, 3)
  const totalProducts = usingTemporary ? allProducts.length : result.totalDocs
  const genericWhatsApp = buildWhatsAppUrl({ number: settings.whatsappNumber, message: 'Hi Cobraa 3D! I have an idea I would like to discuss.' })
  const stepOne = settings.connectCopy?.howStepOneTitle || 'Shape your brief'
  const stepOneDescription = settings.connectCopy?.howStepOneDescription || 'Pick the piece, add your name or idea, choose your colours.'
  const stepTwo = settings.connectCopy?.howStepTwoTitle || 'Confirm on WhatsApp'
  const stepTwoDescription = settings.connectCopy?.howStepTwoDescription || 'Send it to us. We reply with feasibility, price and timing.'
  const stepThree = settings.connectCopy?.howStepThreeTitle || 'We print it'
  const stepThreeDescription = settings.connectCopy?.howStepThreeDescription || 'Made to order in Hoskote, Bengaluru. Most small pieces ready in 1-2 days.'
  const howHeading = settings.connectCopy?.howHeading || 'From first thought to finished print.'
  const deliveryLine = settings.connectCopy?.deliveryNote || settings.deliveryLine || 'Most small pieces ready in 1-2 days'
  const heroLede = settings.connectCopy?.heroLede || "Type a name in any language, pick your colours and watch it take shape. Send us the brief on WhatsApp and we'll confirm price and timing."
  const heroHint = settings.connectCopy?.heroHint || 'Drag the piece sideways to turn it.'
  const productsEyebrow = settings.connectCopy?.productsEyebrow || 'Made to order'
  const productsSubline = settings.connectCopy?.productsSubline || 'Every piece is printed to order. Ask on WhatsApp and we’ll confirm colour and timing.'
  const namePromise = settings.connectCopy?.namePromise || 'Any name, any language. We check it prints well and confirm on WhatsApp.'
  const finePrint = settings.productsPage?.finePrint || ''
  const briefConfig = resolveBriefConfig(settings)
  const printVideo = printBed.docs[0]?.video && typeof printBed.docs[0].video === 'object' ? printBed.docs[0].video.url : null
  const socialLinks = [
    ...(instagramLink(settings.instagram) ? [{ label: 'Instagram', url: instagramLink(settings.instagram)! }] : []),
    ...(settings.socialLinks || []).filter((link) => link?.url).map((link) => ({ label: link.label || 'Social', url: link.url })),
  ].filter((link, index, all) => all.findIndex((entry) => entry.url === link.url) === index)

  return <main className="studio-home" id="top">
    <ConnectTerrain />
    <div className="studio-vignette" aria-hidden="true" />
    <BriefProvider config={briefConfig} whatsappNumber={settings.whatsappNumber} activeOfferText={activeOfferText}>
      <section className="studio-hero" aria-labelledby="home-title">
        <div className="studio-wrap studio-hero-content">
          <div className="studio-hero-copy">
            <p className="studio-eyebrow"><i aria-hidden="true" />Hoskote, Bengaluru · Printed to order</p>
            <h1 id="home-title"><span>Personalised 3D prints.</span><span className="is-outline">Made in Hoskote.</span></h1>
            <p className="studio-lede">{heroLede}</p>
          </div>
          <HomeHero hint={heroHint} />
        </div>
      </section>

      <section className="studio-trust" aria-label="What to expect">
        <div className="studio-wrap">
          <ul className="studio-trust-list">
            <li>Made to order</li>
            <li>Hoskote, Bengaluru</li>
            <li>{deliveryLine}</li>
          </ul>
          {finePrint && <p className="studio-trust-fine">{finePrint}</p>}
        </div>
      </section>

      <section className="studio-products studio-wrap" id="products" aria-labelledby="featured-title">
        <header className="studio-section-heading"><div><p className="studio-eyebrow">{productsEyebrow}</p><h2 id="featured-title">A few things <em>we’ve made.</em></h2></div><p>{productsSubline}</p></header>
        <ConnectProducts products={featured} total={totalProducts} ctaLabel={settings.productEnquiryCtaLabel || 'Ask on WhatsApp'} />
      </section>

      <section className="studio-how" id="how" aria-labelledby="how-title">
        <div className="studio-wrap">
          <header className="studio-section-heading"><div><p className="studio-eyebrow">How it works</p><h2 id="how-title">{howHeading}</h2></div></header>
          <ol className="studio-how-steps">
            <li><span>01</span><div><b>{stepOne}</b><p>{stepOneDescription}</p></div></li>
            <li><span>02</span><div><b>{stepTwo}</b><p>{stepTwoDescription}</p></div></li>
            <li><span>03</span><div><b>{stepThree}</b><p>{stepThreeDescription}</p></div></li>
          </ol>
        </div>
      </section>

      {printVideo && <section className="studio-video" aria-label="From the print bed">
        <div className="studio-wrap"><video className="studio-video-frame" src={printVideo} muted playsInline loop autoPlay preload="metadata" /></div>
      </section>}

      <section className="studio-custom" id="custom" aria-labelledby="custom-title"><div className="studio-wrap studio-custom-grid">
        <div className="studio-custom-intro"><p className="studio-eyebrow">Start a custom order</p><h2 id="custom-title">Tell us the idea. <em>We’ll print the rest.</em></h2><p className="studio-lede">Nameplates, gifts, desk pieces, or something nobody has made yet. Shape your brief and it lands in our WhatsApp, ready to quote.</p>{genericWhatsApp && <a className="studio-talk-link" href={genericWhatsApp} target="_blank" rel="noopener noreferrer">Rather just talk? Open a blank chat →</a>}</div>
        <ConnectBuilder namePromise={namePromise} />
      </div></section>
    </BriefProvider>

    <footer className="studio-footer"><div className="studio-footer-contours" aria-hidden="true" /><div className="studio-wrap"><div className="studio-footer-top"><div className="studio-footer-story"><h2>Small ideas,<br /><em>made real.</em></h2><p>{settings.brandName || 'Cobraa 3D'} is a small print studio in Hoskote, Bengaluru, making personalised pieces to order.</p></div><div><h3>Explore</h3><nav aria-label="Explore links"><Link href="#products">Products</Link><Link href="#custom">Custom orders</Link><Link href="/products">View all products</Link></nav></div><div><h3>Say hello</h3><nav aria-label="Contact links">{genericWhatsApp && <a href={genericWhatsApp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}{socialLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}{settings.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={14} /> Directions</a>}<PushAlerts publicKey={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.VAPID_PUBLIC_KEY} presentation="link" source="footer" /><span>Hoskote, Bengaluru</span></nav></div></div><div className="studio-footer-bottom"><span>© {new Date().getFullYear()} {settings.brandName || 'Cobraa 3D'}</span><span>Designed and made one layer at a time.</span><Link href="#top">Back to top ↑</Link></div></div></footer>
    <ConnectHud />
  </main>
}
