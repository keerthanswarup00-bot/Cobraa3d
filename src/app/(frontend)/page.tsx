import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LayerShowcase } from '@/components/LayerShowcase'
import { ConnectBuilder } from '@/components/home/ConnectBuilder'
import { ConnectProducts, type ConnectProduct } from '@/components/home/ConnectProducts'
import { ConnectHud, ConnectTerrain } from '@/components/home/ConnectTerrain'
import { TEMP_PRODUCTS } from '@/lib/tempProducts'
import { buildWhatsAppUrl } from '@/lib/shared'
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

export default async function HomePage() {
  const payload = await getPayload({ config })
  const [settings, result] = await Promise.all([
    getSiteSettings(0),
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] }, sort: 'sortOrder,title', depth: 1, limit: 100 }),
  ])
  const cmsProducts = (result.docs as Product[]).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.sortOrder || 0) - (b.sortOrder || 0))
  const usingTemporary = cmsProducts.length === 0
  const allProducts: ConnectProduct[] = usingTemporary ? TEMP_PRODUCTS.map((product) => ({ id: product.id, slug: product.slug, title: product.name, blurb: product.blurb, tag: product.tag, filament: product.fil, visual: product.vis, sample: 'sample' in product ? product.sample : undefined, temporary: true, priceLabel: 'Price on request' })) : cmsProducts.map((product) => {
    const mediaRow = product.images?.find((row) => row.image && typeof row.image === 'object')
    const media = mediaRow?.image && typeof mediaRow.image === 'object' ? mediaRow.image : null
    return {
      id: cmsVisual(product) === 'key' ? 'keychain' : cmsVisual(product) === 'lamp' ? 'lamp' : cmsVisual(product) === 'stand' ? 'stand' : cmsVisual(product) === 'photo' ? 'photo' : cmsVisual(product) === 'plate' ? 'nameplate' : 'other',
      slug: product.slug || '', title: product.title, blurb: product.shortDescription || '', tag: product.badges?.[0] || (typeof product.category === 'object' && product.category ? product.category.name || 'Made to order' : 'Made to order'),
      filament: product.colourOptions?.[0]?.hex || '#e6dcc6', visual: cmsVisual(product), sample: product.title,
      image: media?.url ? { url: media.url, alt: mediaRow?.alt || media.alt || product.title, width: media.width, height: media.height } : undefined,
      priceLabel: product.priceMode === 'show' && product.price != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency || 'INR', maximumFractionDigits: 2 }).format(product.price) : 'Price on request',
      whatsappURL: buildWhatsAppUrl({ number: settings.whatsappNumber, message: `Hi Cobraa 3D, I would like to enquire about ${product.title}.` }),
    }
  })
  // CMS results are already ordered with explicitly featured items first; always fill the three-card row from real records.
  const featured = allProducts.slice(0, 3)
  const genericWhatsApp = buildWhatsAppUrl({ number: settings.whatsappNumber, message: 'Hi Cobraa 3D! I have an idea I would like to discuss.' })
  const stepOne = settings.connectCopy?.howStepOneTitle || 'Shape the brief'
  const stepOneDescription = settings.connectCopy?.howStepOneDescription || 'Pick the object, colour and details.'
  const stepTwo = settings.connectCopy?.howStepTwoTitle || 'We check and quote'
  const stepTwoDescription = settings.connectCopy?.howStepTwoDescription || 'Feasibility, price and timeline, confirmed in chat.'
  const stepThree = settings.connectCopy?.howStepThreeTitle || 'Layer by layer'
  const stepThreeDescription = settings.connectCopy?.howStepThreeDescription || 'Printed to order in Hoskote, Bengaluru.'

  return <main className="studio-home" id="top">
    <ConnectTerrain />
    <div className="studio-vignette" aria-hidden="true" />
    <section className="studio-hero" aria-labelledby="connect-title">
      <div className="studio-wrap studio-hero-content">
        <p className="studio-eyebrow"><i aria-hidden="true" />Hoskote, Bengaluru · Printed to order</p>
        <h1 id="connect-title"><span>Made in Hoskote.</span><span className="is-outline">Made to be yours.</span></h1>
        <p className="studio-lede">Personalised nameplates, lamps, keychains and desk pieces, printed one layer at a time. Tell us the idea and we’ll make it real.</p>
        <div className="studio-hero-actions"><Link className="studio-button is-light" href="#products">Browse products <span aria-hidden="true">↓</span></Link><Link className="studio-button is-ghost" href="#custom">Start a custom brief <span aria-hidden="true">→</span></Link></div>
      </div>
      <p className="studio-hint"><span className="for-pointer">Move your cursor. The terrain bends like a print bed.</span><span className="for-touch">Touch and drag. The terrain bends like a print bed.</span></p>
    </section>

    <section className="studio-products studio-wrap" id="products" aria-labelledby="featured-title">
      <header className="studio-section-heading"><div><p className="studio-eyebrow">Ready to order</p><h2 id="featured-title">A few things <em>we’ve made.</em></h2></div><p>Every piece is printed to order. Pick a colour, add your details, and we’ll confirm the rest.</p></header>
      <ConnectProducts products={featured} total={allProducts.length} />
    </section>

    <section className="studio-showcase" aria-labelledby="layer-title"><div className="studio-wrap studio-showcase-grid"><div className="studio-showcase-copy"><p className="studio-eyebrow">A different way to make</p><h2 id="layer-title">A little idea.<br /><em>Layer by layer.</em></h2><p>From a simple everyday object to something made just for you.</p><span className="studio-showcase-instruction">Drag the form to explore its layers</span></div><LayerShowcase /></div></section>

    <section className="studio-custom" id="custom" aria-labelledby="custom-title"><div className="studio-wrap studio-custom-grid">
      <div className="studio-custom-intro"><p className="studio-eyebrow">Start a custom order</p><h2 id="custom-title">Tell us the idea. <em>We’ll print the rest.</em></h2><p className="studio-lede">Nameplates, gifts, desk pieces, or something nobody has made yet. Shape your brief and it lands in our WhatsApp, ready to quote.</p><ol className="studio-custom-steps"><li><span>01</span><div><b>{stepOne}</b><p>{stepOneDescription}</p></div></li><li><span>02</span><div><b>{stepTwo}</b><p>{stepTwoDescription}</p></div></li><li><span>03</span><div><b>{stepThree}</b><p>{stepThreeDescription}</p></div></li></ol>{genericWhatsApp && <a className="studio-talk-link" href={genericWhatsApp} target="_blank" rel="noopener noreferrer">Rather just talk? Open a blank chat →</a>}</div>
      <ConnectBuilder whatsappNumber={settings.whatsappNumber} />
    </div></section>

    <footer className="studio-footer"><div className="studio-footer-contours" aria-hidden="true" /><div className="studio-wrap"><div className="studio-footer-top"><div className="studio-footer-story"><h2>Small ideas,<br /><em>made real.</em></h2><p>{settings.brandName || 'Cobraa 3D'} is a small print studio in Hoskote, Bengaluru, making personalised pieces to order.</p></div><div><h3>Explore</h3><nav aria-label="Explore links"><Link href="#products">Products</Link><Link href="#custom">Custom orders</Link><Link href="/products">View all products</Link></nav></div><div><h3>Say hello</h3><nav aria-label="Contact links">{genericWhatsApp && <a href={genericWhatsApp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}{settings.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={14} /> Directions</a>}<span>Hoskote, Bengaluru</span></nav></div></div><div className="studio-footer-bottom"><span>© {new Date().getFullYear()} {settings.brandName || 'Cobraa 3D'}</span><span>Designed and made one layer at a time.</span><Link href="#top">Back to top ↑</Link></div></div></footer>
    <ConnectHud />
  </main>
}
