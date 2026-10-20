import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ConnectProducts, type ConnectProduct } from '@/components/home/ConnectProducts'
import { TEMP_PRODUCTS } from '@/lib/tempProducts'
import { buildWhatsAppUrl } from '@/lib/shared'
import type { Product } from '@/payload-types'

export const revalidate = 60
export const metadata: Metadata = { title: 'Products', alternates: { canonical: '/products' } }

function visualFor(product: Product): ConnectProduct['visual'] {
  const category = typeof product.category === 'object' && product.category ? product.category.name || '' : ''
  const value = `${product.slug || ''} ${product.title} ${category}`.toLowerCase()
  if (value.includes('nameplate') || value.includes('name plate')) return 'plate'
  if (value.includes('keychain') || value.includes('key chain')) return 'key'
  if (value.includes('lamp')) return 'lamp'
  if (value.includes('phone stand') || value.includes('phone-stand')) return 'stand'
  if (value.includes('photo stand') || value.includes('photo-stand')) return 'photo'
  return 'sphere'
}

function priceLabelFor(product: Product) {
  if (product.priceMode !== 'show' || product.price == null) return 'Price on request'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency || 'INR', maximumFractionDigits: 2 }).format(product.price)
}

function originalPriceLabelFor(product: Product) {
  if (product.priceMode !== 'show' || product.price == null || product.originalPrice == null || product.originalPrice <= product.price) return undefined
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency || 'INR', maximumFractionDigits: 2 }).format(product.originalPrice)
}

export default async function ProductsPage() {
  const payload = await getPayload({ config })
  const [result, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] }, sort: 'sortOrder,title', depth: 1, limit: 100 }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])
  const products: ConnectProduct[] = result.docs.length ? (result.docs as Product[]).map((product) => {
    const visual = visualFor(product)
    const imageRow = product.images?.find((row) => row.image && typeof row.image === 'object')
    const image = imageRow?.image && typeof imageRow.image === 'object' ? imageRow.image : null
    const category = typeof product.category === 'object' && product.category ? product.category.name : null
    const id = visual === 'plate' ? 'nameplate' : visual === 'key' ? 'keychain' : visual === 'lamp' ? 'lamp' : visual === 'stand' ? 'stand' : visual === 'photo' ? 'photo' : 'other'
    return { id, slug: product.slug || '', title: product.title, blurb: product.shortDescription || '', tag: product.badges?.[0] || category || 'Made to order', filament: product.colourOptions?.[0]?.hex || '#e6dcc6', visual, sample: product.title, image: image?.url ? { url: image.url, alt: imageRow?.alt || image.alt || product.title, width: image.width, height: image.height } : undefined, priceLabel: priceLabelFor(product), originalPriceLabel: originalPriceLabelFor(product), whatsappURL: buildWhatsAppUrl({ number: settings.whatsappNumber, message: `Hi Cobraa 3D, I would like to enquire about ${product.title}.` }) }
  }) : TEMP_PRODUCTS.map((product) => ({ id: product.id, slug: product.slug, title: product.name, blurb: product.blurb, tag: product.tag, filament: product.fil, visual: product.vis, sample: 'sample' in product ? product.sample : undefined, temporary: true, priceLabel: 'Price on request', whatsappURL: buildWhatsAppUrl({ number: settings.whatsappNumber, message: `Hi Cobraa 3D, I would like to enquire about ${product.name}.` }) }))

  return <main className="studio-catalog-page">
    <header className="studio-catalog-intro studio-wrap" aria-labelledby="catalog-title">
      <p className="studio-catalog-eyebrow">Objects, made differently</p>
      <h1 id="catalog-title">Thoughtful design.<br /><em>Made in 3D.</em></h1>
      <p className="studio-catalog-description">Explore distinctive décor, desk accessories, keepsakes and everyday objects made through 3D printing.</p>
      <a className="studio-catalog-explore" href="#product-grid">Explore the collection <span aria-hidden="true">↓</span></a>
    </header>
    <section className="studio-catalog-products studio-wrap" id="product-grid" aria-label="Product collection">
      <ConnectProducts products={products} total={products.length} variant="catalog" />
    </section>
  </main>
}
