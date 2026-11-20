'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Share2, Truck } from 'lucide-react'
import { useMemo, useState, type MouseEvent } from 'react'
import { ProductLink } from '@/components/product/ProductLink'
import { recoverProductPhoto } from '@/components/product/recover-product-photo'
import { returnToCatalog } from '@/components/product/catalog-position'
import { getDisplayPrice } from '@/lib/pricing'
import { buildProductMessage, buildWhatsAppUrl } from '@/lib/shared'

type Photo = { url: string; originalUrl?: string | null; alt: string }
type ProductData = {
  title: string; slug: string; shortDescription?: string | null; descriptionText?: string; price?: number | null; salePrice?: number | null; originalPrice?: number | null
  currency?: string; priceMode?: 'show' | 'ask' | null; availability?: string | null; images: Photo[]; includedItems?: string[]
  shortIncludes?: string | null; powerAndBulb?: string | null
  colourOptions?: { name: string; hex?: string | null }[]; dimensions?: string | null; material?: string | null; ageGroup?: string | null
  personalisable?: boolean | null; personalisationNotes?: string | null; careNotes?: string | null; productionNote?: string | null
  badges?: string[] | null; whatsappMessageOverride?: string | null; isDemo?: boolean | null
}
type Related = { slug: string; title: string; image?: Photo }

export function ProductDetail({ product, brandName, deliveryLine, whatsappNumber, productTemplate, related = [], siteURL, ctaLabel }: {
  brandName: string
  deliveryLine?: string
  product: ProductData; whatsappNumber?: string | null; productTemplate?: string | null
  related?: Related[]; siteURL: string; ctaLabel: string
}) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const selectedPhoto = product.images[photoIndex]
  const backupPhoto = product.images[photoIndex === 0 ? 1 : 0]
  const [quantity, setQuantity] = useState(1)
  const [colour, setColour] = useState('')
  const [kind, setKind] = useState<'product' | 'custom'>('product')
  const [notice, setNotice] = useState('')
  function backToProducts(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (returnToCatalog()) event.preventDefault()
  }
  const displayPrice = getDisplayPrice({ id: product.slug, price: product.price, salePrice: product.salePrice, priceMode: product.priceMode, currency: product.currency })
  const message = useMemo(() => buildProductMessage({
    ...product, images: product.images.map((image) => ({ alt: image.alt, image: { url: image.url } })),
    badges: product.badges,
    price: displayPrice.showOffer ? displayPrice.offerPrice ?? product.price : product.price,
    priceMode: product.priceMode,
  }, { quantity, colour, kind, baseURL: siteURL }, {
    whatsappNumber, productMessageTemplate: productTemplate,
  }), [product, displayPrice.showOffer, displayPrice.offerPrice, quantity, colour, kind, siteURL, whatsappNumber, productTemplate])
  const waURL = buildWhatsAppUrl({ message, number: whatsappNumber })
  const priceLabel = displayPrice.priceLabel
  const askAvailability = product.availability === 'out_of_stock' || product.availability === 'coming_soon'
  const enquiryLabel = product.isDemo ? 'Enquire on WhatsApp' : askAvailability ? 'Ask about availability' : ctaLabel
  const showDelivery = deliveryLine && !product.isDemo && !askAvailability
  const shortIncludes = product.shortIncludes?.trim()
  const included = product.includedItems?.length ? product.includedItems : shortIncludes ? [shortIncludes] : []
  const description = product.descriptionText?.trim()
  const facts = [
    ['About this piece', description === product.shortDescription?.trim() ? null : description],
    ['Power and lighting', product.powerAndBulb],
    ['Dimensions', product.dimensions],
    ['Material', product.material],
    ['Age group', product.ageGroup],
    ['Personalisation', product.personalisable ? product.personalisationNotes || 'Ask us about customisation on WhatsApp.' : null],
    ['Care', product.careNotes],
    ['Production', product.productionNote],
  ].filter(([, value]) => value?.trim())

  const share = async () => {
    const url = `${siteURL}/products/${product.slug}`
    if (navigator.share) { try { await navigator.share({ title: product.title, text: product.shortDescription || product.title, url }); return } catch { /* user cancelled */ } }
    try { await navigator.clipboard.writeText(url); setNotice('Link copied') } catch { setNotice('Copy this link: ' + url) }
  }
  return <main className="product-detail-page">
    <div className="detail-topbar"><Link href="/products" onClick={backToProducts}>← <span>All products</span></Link><button type="button" className="detail-share" onClick={share} aria-label="Share product" title="Share product"><Share2 size={17} aria-hidden="true" /></button></div>
    <article className="product-detail">
      <div className="detail-gallery">
        <div className="detail-main-image" data-initial-photo={photoIndex === 0 && product.images[0] ? '' : undefined}>
          {selectedPhoto?.url ? <Image key={photoIndex} src={selectedPhoto.url} alt={selectedPhoto.alt || product.title} fill sizes="(max-width: 760px) 100vw, 55vw" quality={75} preload={photoIndex === 0} fetchPriority={photoIndex === 0 ? 'high' : 'auto'} unoptimized={!selectedPhoto.url.startsWith('/')} onError={(event) => recoverProductPhoto(event, selectedPhoto.originalUrl, backupPhoto?.url, backupPhoto?.originalUrl)} /> : <div className="detail-image-empty">{product.title}</div>}
          {product.images.length > 1 && <><button className="gallery-arrow gallery-prev" aria-label="Previous image" onClick={() => setPhotoIndex((photoIndex + product.images.length - 1) % product.images.length)}>‹</button><button className="gallery-arrow gallery-next" aria-label="Next image" onClick={() => setPhotoIndex((photoIndex + 1) % product.images.length)}>›</button></>}
        </div>
        {product.images.length > 1 && <div className="detail-thumbnails" aria-label="Product photos">{product.images.map((photo, i) => <button key={`${photo.url}-${i}`} aria-label={`Show image ${i + 1}`} aria-pressed={i === photoIndex} onClick={() => setPhotoIndex(i)}>{photo.url && <Image src={photo.url} alt="" fill sizes="70px" quality={75} loading={i === 0 ? 'eager' : 'lazy'} unoptimized={!photo.url.startsWith('/')} onError={(event) => recoverProductPhoto(event, photo.originalUrl)} />}</button>)}</div>}
        {product.images.length > 1 && <div className="gallery-dots" aria-label={`Image ${photoIndex + 1} of ${product.images.length}`}>{product.images.map((_, i) => <button key={i} aria-label={`Image ${i + 1}`} aria-pressed={i === photoIndex} onClick={() => setPhotoIndex(i)} />)}</div>}
      </div>
      <div className="detail-copy">
        <p className="detail-kicker">{brandName}</p><h1>{product.title}</h1>{product.isDemo && <p className="demo-detail-note">TEMPORARY DEMO LISTING · Image and product information will be replaced before launch.</p>}
        {product.shortDescription && <p className="detail-summary">{product.shortDescription}</p>}
        {!product.isDemo && <p className="detail-price">{displayPrice.showOffer ? <><span>{displayPrice.priceLabel}</span>{displayPrice.regularPrice != null && <del>{displayPrice.regularPriceLabel}</del>}</> : priceLabel}{displayPrice.badge && <span className="offer-badge">{displayPrice.badge}</span>}</p>}
        {!product.isDemo && product.availability === 'made_to_order' && <p className="made-to-order-note">Availability and final price confirmed on WhatsApp.</p>}
        {!product.isDemo && product.availability && <p className="detail-availability">{product.availability.replaceAll('_', ' ')}</p>}
        {displayPrice.offerText && <p className="detail-offer-text">{displayPrice.offerText}</p>}
        {showDelivery && (
          <div className="detail-delivery">
            <Truck size={20} aria-hidden="true" />
            <div>
              <h2>Delivery</h2>
              <p>{deliveryLine}</p>
              <Link href="/shipping-and-delivery-policy">Shipping details</Link>
            </div>
          </div>
        )}
        {product.colourOptions?.length ? <fieldset className="colour-picker"><legend>Colour or design</legend><div>{product.colourOptions.map((option) => <button type="button" key={option.name} aria-pressed={colour === option.name} onClick={() => setColour(option.name)}>{option.hex && <i style={{ backgroundColor: option.hex }} />} {option.name}</button>)}</div></fieldset> : null}
        <div className="quantity-row"><span>Quantity</span><div><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((n) => Math.max(1, n - 1))}>−</button><output>{quantity}</output><button aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity((n) => Math.min(99, n + 1))}>+</button></div></div>
        {product.personalisable && <button className="customise-link" onClick={() => setKind((v) => v === 'custom' ? 'product' : 'custom')}>{kind === 'custom' ? 'Customisation message selected' : 'Ask about customisation'}</button>}
        {waURL ? <a className="detail-whatsapp" href={waURL} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" />{enquiryLabel}</a> : <button className="detail-whatsapp" disabled>WhatsApp enquiry unavailable</button>}
        {waURL && <p className="detail-message-preview">Send your selection on WhatsApp to confirm your order.</p>}
        {notice && <p className="detail-notice" role="status">{notice}</p>}
      </div>
    </article>
    {(facts.length > 0 || included.length > 0) && (
      <section className="product-facts" aria-label="Product details">
        {facts.map(([label, value]) => <div className="product-fact" key={label}><h2>{label}</h2><p>{value}</p></div>)}
        {included.length > 0 && <div className="product-fact"><h2>What’s included</h2><ul>{included.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      </section>
    )}
    {!!related.length && <section className="related-products"><h2>You may also like</h2><div>{related.map((item) => <ProductLink href={`/products/${item.slug}`} key={item.slug}>{item.image?.url && <Image src={item.image.url} alt={item.image.alt} width={180} height={225} quality={75} loading="lazy" unoptimized={!item.image.url.startsWith('/')} onError={(event) => recoverProductPhoto(event, item.image?.originalUrl)} />}<span>{item.title}</span></ProductLink>)}</div></section>}
    <div className="detail-mobile-cta">{waURL ? <a href={waURL} target="_blank" rel="noopener noreferrer">{!product.isDemo && !askAvailability && product.priceMode === 'show' && product.price != null ? `${enquiryLabel} · ${priceLabel}` : enquiryLabel}</a> : null}</div>
  </main>
}
