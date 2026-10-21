import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductsCatalog, type CatalogCopy, type CatalogProduct, type CatalogSpec } from '@/components/product/ProductsCatalog'
import type { ConnectProduct } from '@/components/home/ConnectProducts'
import { buildWhatsAppUrl, formatOriginalPrice, formatPrice, getVisibleCategories } from '@/lib/shared'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { getServerSideURL } from '@/utilities/getURL'
import type { Product } from '@/payload-types'

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

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams
  const initialQuery = typeof params.q === 'string' ? params.q : ''
  const pageValue = Number(typeof params.page === 'string' ? params.page : Number.NaN)
  const initialPage = Number.isFinite(pageValue) && pageValue > 1 ? Math.floor(pageValue) : 1
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
    const category = typeof product.category === 'object' && product.category ? product.category.name : null
    const tags = [...new Set((product.seasonalTags || []).map((row) => row.tag).filter((tag): tag is string => Boolean(tag)))]
    const hasPrice = product.priceMode === 'show' && typeof product.price === 'number' && Number.isFinite(product.price) && product.price >= 0
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
      tags,
      description: product.shortDescription || '',
      priceLabel: formatPrice(product.price, product.priceMode, product.currency || 'INR'),
      originalPriceLabel: formatOriginalPrice(product.originalPrice, product.price, product.priceMode, product.currency || 'INR'),
      hasPrice,
      price: product.price,
      currency: product.currency || 'INR',
      specs: specsFor(product),
      images,
      render,
    }
  })

  const categories = getVisibleCategories(categoryResult.docs, result.docs).map((category) => ({ name: category.name }))
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
      initialQuery={initialQuery}
      initialPage={initialPage}
    />
  )
}
