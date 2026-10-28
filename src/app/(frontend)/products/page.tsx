import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductsCatalog, type CatalogCopy, type CatalogProduct, type CatalogSpec } from '@/components/product/ProductsCatalog'
import type { ConnectProduct } from '@/components/home/ConnectProducts'
import { getDisplayPrice } from '@/lib/pricing'
import { buildProductMessage, buildWhatsAppUrl, getVisibleCategories } from '@/lib/shared'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { getServerSideURL } from '@/utilities/getURL'
import type { Product } from '@/payload-types'
import { env } from '@/lib/env'
import { normalizeSearch, parseCatalogFilters, slugifyFilterValue } from '@/lib/catalogFilters'

export const metadata: Metadata = {
  title: '3D Printed Products | Cobraa 3D, Hoskote',
  description: 'Browse 3D printed products from Cobraa 3D, a studio in Hoskote, Bengaluru. Ask about products on WhatsApp; shipping is available across India.',
  alternates: { canonical: '/products' },
}

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

function humanize(value: string): string {
  const [first = '', ...rest] = value.split('_')
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].filter(Boolean).join(' ')
}

function specsFor(product: Product): CatalogSpec[] {
  const specs: CatalogSpec[] = []
  if (product.material) specs.push({ label: 'Material', value: product.material })
  if (product.dimensions) specs.push({ label: 'Dimensions', value: product.dimensions })
  if (product.ageGroup) specs.push({ label: 'Age group', value: product.ageGroup })
  if (product.careNotes) specs.push({ label: 'Care notes', value: product.careNotes })
  if (product.productionNote) specs.push({ label: 'Production note', value: product.productionNote })
  if (product.availability) specs.push({ label: 'Availability', value: humanize(product.availability) })
  return specs
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function byRecency(a: Product, b: Product): number {
  const at = Date.parse(a.publishedAt || a.createdAt) || 0
  const bt = Date.parse(b.publishedAt || b.createdAt) || 0
  if (bt !== at) return bt - at
  const as = a.sortOrder ?? 0
  const bs = b.sortOrder ?? 0
  if (as !== bs) return as - bs
  return b.id - a.id
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const initialFilters = parseCatalogFilters(params)
  const payload = await getPayload({ config })
  const [result, categoryResult, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] }, depth: 1, pagination: false }),
    payload.find({ collection: 'categories', where: { visible: { equals: true } }, sort: 'sortOrder', depth: 0, pagination: false }),
    getSiteSettings(0),
  ])

  const products: CatalogProduct[] = [...(result.docs as Product[])].sort(byRecency).map((product) => {
    const visual = visualFor(product)
    const slug = product.slug || slugify(product.title)
    const images = (product.images || []).flatMap((row) => {
      if (!row.image || typeof row.image !== 'object' || !row.image.url) return []
      return [{ url: row.image.url, alt: row.alt || row.image.alt || product.title, width: row.image.width, height: row.image.height }]
    })
    const categoryDoc = typeof product.category === 'object' && product.category ? product.category : null
    const category = categoryDoc?.name || null
    const categorySlug = categoryDoc ? categoryDoc.slug || slugifyFilterValue(categoryDoc.name) : null
    const tags = [...new Set((product.seasonalTags || []).map((row) => row.tag).filter((tag): tag is string => Boolean(tag)))]
    const colours = (product.colourOptions || []).flatMap((row) => row.name ? [{ name: row.name, slug: slugifyFilterValue(row.name), hex: row.hex || null }] : [])
    const material = product.material?.trim() || null
    const materialSlug = material ? slugifyFilterValue(material) : null
    const searchText = normalizeSearch([product.title, product.shortDescription || '', category || '', material || '', ...colours.map((colour) => colour.name), ...tags].join(' '))
    const display = getDisplayPrice({ id: product.id, price: product.price, salePrice: product.salePrice, priceMode: product.priceMode, currency: product.currency })
    const hasPrice = display.regularPrice != null && product.priceMode === 'show'
    const whatsappHref = buildWhatsAppUrl({ number: settings.whatsappNumber, message: buildProductMessage(product, {}, settings) })
    const knownDimensions = [
      product.heightMm ? `${product.heightMm} mm H` : '',
      product.widthMm ? `${product.widthMm} mm W` : '',
      product.depthMm ? `${product.depthMm} mm D` : '',
    ].filter(Boolean).join(' × ')
    const render: ConnectProduct = {
      id: String(product.id),
      slug,
      title: product.title,
      blurb: product.shortDescription || '',
      tag: product.badges?.[0] || category || 'Made to order',
      filament: product.colourOptions?.[0]?.hex || '#e6dcc6',
      visual,
      sample: product.title,
    }
    return {
      id: product.id,
      slug,
      title: product.title,
      category,
      categorySlug,
      tags,
      material,
      materialSlug,
      colours,
      colourSlugs: colours.map((colour) => colour.slug),
      personalisable: product.personalisable === true,
      featured: product.featured === true,
      availability: product.availability || null,
      newArrival: (product.badges || []).includes('new'),
      searchText,
      description: product.shortDescription || '',
      shortIncludes: product.shortIncludes?.trim() || null,
      badge: product.badge || null,
      dimensionsLabel: knownDimensions || product.dimensions?.trim() || null,
      whatsappHref,
      priceLabel: hasPrice ? display.priceLabel : 'Ask on WhatsApp',
      hasPrice,
      price: display.regularPrice ?? product.price ?? null,
      currency: product.currency || 'INR',
      specs: specsFor(product),
      images,
      render,
    }
  })

  const categories = getVisibleCategories(categoryResult.docs, result.docs).map((category) => ({
    name: category.name.trim().replace(/\s+/g, ' '),
    slug: category.slug || slugifyFilterValue(category.name),
  }))
  const categorySlugs = new Set(categories.map((category) => category.slug))
  for (const product of result.docs as Product[]) {
    const category = typeof product.category === 'object' && product.category ? product.category : null
    if (!category || category.visible !== true || !category.name?.trim()) continue
    const name = category.name.trim().replace(/\s+/g, ' ')
    const slug = category.slug || slugifyFilterValue(name)
    if (!slug || categorySlugs.has(slug)) continue
    categorySlugs.add(slug)
    categories.push({ name, slug })
  }
  const productsPage = settings.productsPage
  const copy: CatalogCopy = {
    eyebrow: productsPage?.eyebrow ?? 'Objects, made differently',
    heading: productsPage?.heading ?? 'Thoughtful design.',
    headingAccent: productsPage?.headingAccent ?? 'Made in 3D.',
    searchPlaceholder: productsPage?.searchPlaceholder ?? 'Search products…',
    filtersLabel: productsPage?.filtersLabel ?? 'Filters',
    maxPriceLabel: productsPage?.maxPriceLabel ?? 'Max price',
    goodForLabel: productsPage?.goodForLabel ?? 'Good for',
    resetLabel: productsPage?.resetLabel ?? 'Reset all',
    emptyTitle: productsPage?.emptyTitle ?? 'Nothing matches that.',
    emptyBody: productsPage?.emptyBody ?? 'Try a different word or',
    emptyAction: productsPage?.emptyAction ?? 'reset the filters',
    noteLabel: productsPage?.noteLabel ?? 'Customisation or notes (optional)',
    notePlaceholder: productsPage?.notePlaceholder ?? 'Colour, name to print, size…',
    orderLabel: productsPage?.orderLabel ?? 'Order on WhatsApp',
    orderFooter: productsPage?.orderFooter ?? 'Please confirm availability and delivery time.',
    finePrint: productsPage?.finePrint ?? "You'll confirm size, colour and delivery with us on WhatsApp. No payment is taken here.",
    perPage: productsPage?.perPage ?? 15,
  }

  return (
    <ProductsCatalog
      products={products}
      categories={categories}
      copy={copy}
      whatsappBase={buildWhatsAppUrl({ number: settings.whatsappNumber, message: '' })}
      brandName={settings.brandName || 'Cobraa 3D'}
      siteURL={getServerSideURL()}
      calmMode={settings.experience?.calmMode === true}
      pushPublicKey={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.VAPID_PUBLIC_KEY}
      initialFilters={initialFilters}
    />
  )
}
