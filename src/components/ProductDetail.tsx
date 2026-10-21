'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { buildProductMessage, buildWhatsAppUrl, formatProductPrices } from '@/lib/shared'

type Photo = { url: string; alt: string }
type ProductData = {
  title: string; slug: string; shortDescription?: string | null; descriptionText?: string; price?: number | null; originalPrice?: number | null
  currency?: string; priceMode?: 'show' | 'ask' | null; availability?: string | null; images: Photo[]; includedItems?: string[]
  colourOptions?: { name: string; hex?: string | null }[]; dimensions?: string | null; material?: string | null; ageGroup?: string | null
  personalisable?: boolean | null; personalisationNotes?: string | null; careNotes?: string | null; productionNote?: string | null
  badges?: string[] | null; whatsappMessageOverride?: string | null; isDemo?: boolean | null
}
type Related = { slug: string; title: string; image?: Photo }

export function ProductDetail({ product, brandName, whatsappNumber, productTemplate, related = [], siteURL, ctaLabel }: {
  brandName: string
  product: ProductData; whatsappNumber?: string | null; productTemplate?: string | null
  related?: Related[]; siteURL: string; ctaLabel: string
}) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [colour, setColour] = useState('')
  const [kind, setKind] = useState<'product' | 'custom'>('product')
  const [notice, setNotice] = useState('')
  const message = useMemo(() => buildProductMessage({
    ...product, images: product.images.map((image) => ({ alt: image.alt, image: { url: image.url } })),
    badges: product.badges,
  }, { quantity, colour, kind, baseURL: siteURL }, {
    whatsappNumber, productMessageTemplate: productTemplate,
  }), [product, quantity, colour, kind, siteURL, whatsappNumber, productTemplate])
  const waURL = buildWhatsAppUrl({ message, number: whatsappNumber })
  const priceLabels = formatProductPrices(product)
  const share = async () => {
    const url = `${siteURL}/products/${product.slug}`
    if (navigator.share) { try { await navigator.share({ title: product.title, text: product.shortDescription || product.title, url }); return } catch { /* user cancelled */ } }
    try { await navigator.clipboard.writeText(url); setNotice('Link copied') } catch { setNotice('Copy this link: ' + url) }
  }
  return <main className="product-detail-page">
    <div className="detail-topbar"><Link href="/products">← Products</Link><button onClick={share}>Share</button></div>
    <article className="product-detail">
      <div className="detail-gallery">
        <div className="detail-main-image">
          {product.images[photoIndex]?.url ? <Image src={product.images[photoIndex].url} alt={product.images[photoIndex].alt || product.title} fill sizes="(max-width: 760px) 100vw, 55vw" preload /> : <div className="detail-image-empty">{product.title}</div>}
          {product.images.length > 1 && <><button className="gallery-arrow gallery-prev" aria-label="Previous image" onClick={() => setPhotoIndex((photoIndex + product.images.length - 1) % product.images.length)}>‹</button><button className="gallery-arrow gallery-next" aria-label="Next image" onClick={() => setPhotoIndex((photoIndex + 1) % product.images.length)}>›</button></>}
        </div>
        {product.images.length > 1 && <div className="detail-thumbnails" aria-label="Product photos">{product.images.map((photo, i) => <button key={`${photo.url}-${i}`} aria-label={`Show image ${i + 1}`} aria-pressed={i === photoIndex} onClick={() => setPhotoIndex(i)}>{photo.url && <Image src={photo.url} alt="" fill sizes="70px" />}</button>)}</div>}
        {product.images.length > 1 && <div className="gallery-dots" aria-label={`Image ${photoIndex + 1} of ${product.images.length}`}>{product.images.map((_, i) => <button key={i} aria-label={`Image ${i + 1}`} aria-pressed={i === photoIndex} onClick={() => setPhotoIndex(i)} />)}</div>}
      </div>
      <div className="detail-copy">
        <p className="detail-kicker">{brandName}</p><h1>{product.title}</h1>{product.isDemo && <p className="demo-detail-note">TEMPORARY DEMO LISTING · Image and product information will be replaced before launch.</p>}
        {product.shortDescription && <p className="detail-summary">{product.shortDescription}</p>}
        {!product.isDemo && <p className="detail-price">{priceLabels.priceLabel}{priceLabels.originalPriceLabel && <del>{priceLabels.originalPriceLabel}</del>}</p>}
        {!product.isDemo && product.availability === 'made_to_order' && <p className="made-to-order-note">Availability and final price confirmed on WhatsApp.</p>}
        {!product.isDemo && product.availability && <p className="detail-availability">{product.availability.replaceAll('_', ' ')}</p>}
        {product.colourOptions?.length ? <fieldset className="colour-picker"><legend>Colour or design</legend><div>{product.colourOptions.map((option) => <button type="button" key={option.name} aria-pressed={colour === option.name} onClick={() => setColour(option.name)}>{option.hex && <i style={{ backgroundColor: option.hex }} />} {option.name}</button>)}</div></fieldset> : null}
        <div className="quantity-row"><span>Quantity</span><div><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((n) => Math.max(1, n - 1))}>−</button><output>{quantity}</output><button aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity((n) => Math.min(99, n + 1))}>+</button></div></div>
        {product.personalisable && <button className="customise-link" onClick={() => setKind((v) => v === 'custom' ? 'product' : 'custom')}>{kind === 'custom' ? 'Customisation message selected' : 'Ask about customisation'}</button>}
        {waURL ? <a className="detail-whatsapp" href={waURL} target="_blank" rel="noopener noreferrer">{product.isDemo ? 'Enquire on WhatsApp' : product.availability === 'out_of_stock' || product.availability === 'coming_soon' ? 'Ask about availability' : ctaLabel}</a> : <button className="detail-whatsapp" disabled>{product.isDemo ? 'WhatsApp enquiry unavailable' : ctaLabel}</button>}
        {!waURL && process.env.NODE_ENV !== 'production' && <p className="connect-dev-warning">Add a valid business WhatsApp number in Site Settings to enable enquiry links.</p>}
        <p className="detail-message-preview">Message includes product details{colour ? `, ${colour}` : ''} and quantity {quantity}.</p>
        {notice && <p className="detail-notice" role="status">{notice}</p>}
      </div>
    </article>
    <section className="product-facts">
      {product.descriptionText && <div className="product-fact"><h2>About this piece</h2><p>{product.descriptionText}</p></div>}
      {product.includedItems?.length ? <div className="product-fact"><h2>Included</h2><ul>{product.includedItems.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
      {product.dimensions && <div className="product-fact"><h2>Dimensions</h2><p>{product.dimensions}</p></div>}
      {product.material && <div className="product-fact"><h2>Material</h2><p>{product.material}</p></div>}
      {product.ageGroup && <div className="product-fact"><h2>Age group</h2><p>{product.ageGroup}</p></div>}
      {product.personalisable && <div className="product-fact"><h2>Personalisation</h2><p>{product.personalisationNotes || 'Ask us about customisation.'}</p></div>}
      {product.careNotes && <div className="product-fact"><h2>Care</h2><p>{product.careNotes}</p></div>}
      {product.productionNote && <div className="product-fact"><h2>Production</h2><p>{product.productionNote}</p></div>}
    </section>
    {!!related.length && <section className="related-products"><h2>You may also like</h2><div>{related.map((item) => <Link href={`/products/${item.slug}`} key={item.slug}>{item.image?.url && <Image src={item.image.url} alt={item.image.alt} width={180} height={225} />}<span>{item.title}</span></Link>)}</div></section>}
    <div className="detail-mobile-cta">{waURL ? <a href={waURL} target="_blank" rel="noopener noreferrer">{product.isDemo ? 'Enquire on WhatsApp' : `${ctaLabel} · ${priceLabels.priceLabel}`}</a> : null}</div>
  </main>
}
