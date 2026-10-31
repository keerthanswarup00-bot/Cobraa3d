'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Box, MessageCircle } from 'lucide-react'
import { ProductLink } from '@/components/product/ProductLink'
import type { ConnectProduct } from './ConnectProducts'

export function HomeProductGrid({ products, productsURL, viewAllLabel, eagerFirstImage = false }: {
  products: ConnectProduct[]
  productsURL: string
  viewAllLabel: string
  eagerFirstImage?: boolean
}) {
  return <div className="studio-product-wrap">
    <div className="studio-product-grid" role="region" aria-label="Products, scroll horizontally" tabIndex={0}>
      {products.slice(0, 4).map((product, index) => <article className="studio-product-card" key={`${product.id}-${product.slug}`}>
        <ProductLink
          className="studio-product-photo"
          href={`/products/${product.slug}`}
          preview={product.preview}
          prefetch={false}
          aria-label={`View ${product.title}`}
        >
          {product.image?.url
            ? <Image src={product.image.url} alt={product.image.alt || product.title} fill quality={75} sizes="(max-width: 760px) 74vw, (max-width: 1020px) 48vw, 390px" loading={eagerFirstImage && index === 0 ? 'eager' : 'lazy'} decoding="async" unoptimized={!product.image.url.startsWith('/')} />
            : <span className="home-product-placeholder" aria-hidden="true"><Box size={34} strokeWidth={1.2} /></span>}
          <small className="studio-product-tag">{product.tag}</small>
          <small className="studio-product-number">{String(index + 1).padStart(2, '0')}</small>
        </ProductLink>
        <div className="studio-product-copy"><h3><ProductLink href={`/products/${product.slug}`} preview={product.preview} prefetch={false}>{product.title}</ProductLink></h3></div>
        <div className="studio-product-actions">
          <span className="studio-product-price">{product.priceLabel || 'Ask for price'}</span>
          {product.whatsappURL && <a className="studio-product-ask" href={product.whatsappURL} aria-label={`Ask about ${product.title} on WhatsApp`} data-wa-source="card" target="_blank" rel="noopener noreferrer"><MessageCircle size={19} strokeWidth={1.8} aria-hidden="true" /></a>}
        </div>
      </article>)}
      <Link className="studio-view-all" href={productsURL}><span>{viewAllLabel}</span><ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  </div>
}
