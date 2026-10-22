import { formatPrice, isActiveWithinWindow } from './shared'

export type ProductPriceFields = {
  id?: number | string | null
  price?: number | null
  salePrice?: number | null
  priceMode?: 'show' | 'ask' | null
  currency?: string | null
}

export type OfferPriceFields = {
  title?: string | null
  discountText?: string | null
  active?: boolean | null
  startsAt?: string | null
  endsAt?: string | null
  applicableProducts?: Array<number | string | { id?: number | string | null } | null> | null
}

export function productMatchesOffer(product: ProductPriceFields, offer: OfferPriceFields): boolean {
  const applicable = offer.applicableProducts ?? []
  if (!applicable.length) return true
  const id = product.id
  return applicable.some((entry) => {
    if (entry == null) return false
    if (typeof entry === 'object') return entry.id != null && id != null && String(entry.id) === String(id)
    return id != null && String(entry) === String(id)
  })
}

export function getDisplayPrice(product: ProductPriceFields, activeOffer?: OfferPriceFields | null, now = new Date()) {
  const regularPrice = typeof product.price === 'number' && Number.isFinite(product.price) ? product.price : null
  const offerPrice = typeof product.salePrice === 'number' && Number.isFinite(product.salePrice) ? product.salePrice : null
  const currency = product.currency || 'INR'
  const regularLabel = regularPrice == null || product.priceMode !== 'show' ? 'Ask for price' : formatPrice(regularPrice, 'show', currency)

  const applies = Boolean(
    activeOffer
    && isActiveWithinWindow(activeOffer as any, now)
    && productMatchesOffer(product, activeOffer)
    && regularPrice != null
    && product.priceMode === 'show'
    && offerPrice != null
    && offerPrice < regularPrice,
  )

  if (!applies || regularPrice == null || offerPrice == null) {
    return {
      hasOffer: false,
      showOffer: false,
      regularPrice,
      offerPrice,
      discountPercent: null,
      badge: null,
      priceLabel: regularLabel,
      regularPriceLabel: regularLabel,
      offerPriceLabel: offerPrice != null ? formatPrice(offerPrice, 'show', currency) : null,
    }
  }

  const multiplier = ((regularPrice - offerPrice) / regularPrice) * 100
  const discountPercent = Math.max(0, Math.round(multiplier))
  return {
    hasOffer: true,
    showOffer: true,
    regularPrice,
    offerPrice,
    discountPercent,
    badge: `-${discountPercent}%`,
    priceLabel: formatPrice(offerPrice, 'show', currency),
    regularPriceLabel: formatPrice(regularPrice, 'show', currency),
    offerPriceLabel: formatPrice(offerPrice, 'show', currency),
    offerTitle: activeOffer?.title || null,
    offerText: activeOffer?.discountText || null,
  }
}
