import type { Product } from '@/payload-types'
import { getDisplayPrice } from '@/lib/pricing'
import { buildProductMessage, buildWhatsAppUrl } from '@/lib/shared'

export type ProductPreviewImage = { url: string; alt?: string | null }

/**
 * The small payload the phone preview sheet needs. Listing pages build this on
 * the server so the sheet can render immediately from the card the visitor
 * tapped, without another product fetch.
 */
export type ProductPreviewData = {
  slug: string
  title: string
  priceLabel?: string
  description?: string
  images: ProductPreviewImage[]
  whatsappHref: string
}

/** Flatten a Lexical rich-text value to one plain paragraph. */
export function textFromLexical(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const item = value as { text?: unknown; children?: unknown }
  const text = typeof item.text === 'string' ? item.text : ''
  const children = Array.isArray(item.children) ? item.children.map(textFromLexical) : []
  return [text, ...children].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * The product page shows the rich-text "Full description" in "About this
 * piece" and falls back to the card description. The sheet uses the same
 * source, clipped so the three-line block stays readable.
 */
export function previewDescription(
  product: Pick<Product, 'description' | 'shortDescription'>,
  limit = 300,
): string {
  const full = textFromLexical(product.description?.root)
  const text = (full || product.shortDescription || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= limit) return text
  const clipped = text.slice(0, limit).replace(/\s+\S*$/, '').trim()
  return `${clipped}…`
}

export function previewImages(product: Pick<Product, 'images' | 'title'>): ProductPreviewImage[] {
  return (product.images || []).flatMap((row) => {
    const media = row.image && typeof row.image === 'object' ? row.image : null
    // The card already loaded the 900px derivative, so the hero is usually a cache hit.
    const url = media?.sizes?.medium?.url || media?.sizes?.large?.url || media?.url
    return url ? [{ url, alt: row.alt || media?.alt || product.title }] : []
  })
}

export function buildProductPreview(input: {
  product: Product
  slug: string
  siteURL: string
  whatsappNumber?: string | null
  productTemplate?: string | null
  /** Pass null to hide the price, or omit to derive it from the product. */
  priceLabel?: string | null
}): ProductPreviewData | null {
  const { product, slug, siteURL, whatsappNumber, productTemplate } = input
  const display = getDisplayPrice({
    id: product.id,
    price: product.price,
    salePrice: product.salePrice,
    priceMode: product.priceMode,
    currency: product.currency,
  })

  // Keep the existing prewritten product message exactly as the sheet built it.
  const message = buildProductMessage(
    {
      ...product,
      title: product.title,
      slug,
      updatedAt: product.updatedAt,
      images: (product.images || []).map((row) => ({
        alt: row.alt,
        image: row.image && typeof row.image === 'object' ? { url: row.image.url } : row.image,
      })),
      price: display.showOffer ? display.offerPrice ?? product.price : product.price,
      priceMode: product.priceMode,
    },
    { baseURL: siteURL },
    { whatsappNumber, productMessageTemplate: productTemplate },
  )
  const whatsappHref = buildWhatsAppUrl({ number: whatsappNumber, message })
  if (!whatsappHref) return null

  const priceLabel = input.priceLabel === undefined ? display.priceLabel : input.priceLabel ?? undefined

  return {
    slug,
    title: product.title,
    priceLabel,
    description: previewDescription(product),
    images: previewImages(product),
    whatsappHref,
  }
}
