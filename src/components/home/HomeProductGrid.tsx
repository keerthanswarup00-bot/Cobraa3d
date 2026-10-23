import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Box } from 'lucide-react'
import type { ConnectProduct } from './ConnectProducts'

export function HomeProductGrid({ products, productsURL, viewAllLabel, eagerFirstImage = false }: {
  products: ConnectProduct[]
  productsURL: string
  viewAllLabel: string
  eagerFirstImage?: boolean
}) {
  return <div className="studio-product-wrap">
    <div className="studio-product-grid">
      {products.slice(0, 3).map((product, index) => <article className="studio-product-card" key={`${product.id}-${product.slug}`}>
        <Link className="studio-product-photo" href={`/products/${product.slug}`} aria-label={`View ${product.title}`}>
          {product.image?.url
            ? <Image src={product.image.url} alt={product.image.alt || product.title} fill sizes="(max-width: 370px) 90vw, (max-width: 760px) 44vw, (max-width: 1020px) 48vw, 30vw" loading={eagerFirstImage && index === 0 ? 'eager' : 'lazy'} unoptimized={!product.image.url.startsWith('/')} />
            : <span className="home-product-placeholder" aria-hidden="true"><Box size={34} strokeWidth={1.2} /></span>}
          <small className="studio-product-tag">{product.tag}</small>
          <small className="studio-product-number">{String(index + 1).padStart(2, '0')}</small>
        </Link>
        <div className="studio-product-copy"><h3>{product.title}</h3>{product.blurb && <p>{product.blurb}</p>}</div>
        <div className="studio-product-actions">
          <span className="studio-product-price">{product.priceLabel || 'Ask for price'}</span>
          <div className="studio-product-links">
            <Link className="studio-product-view" href={`/products/${product.slug}`}>View <ArrowUpRight size={15} aria-hidden="true" /></Link>
            {product.whatsappURL && <a className="studio-product-ask" href={product.whatsappURL} data-wa-source="card" target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>}
          </div>
        </div>
      </article>)}
    </div>
    <Link className="studio-view-all" href={productsURL}><span>{viewAllLabel}</span><span className="studio-view-arrow" aria-hidden="true">↗</span></Link>
  </div>
}
