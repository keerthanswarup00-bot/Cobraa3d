'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

export type ConnectProduct = {
  id: string
  slug: string
  title: string
  blurb: string
  tag: string
  filament: string
  visual: 'plate' | 'key' | 'lamp' | 'stand' | 'photo' | 'sphere'
  sample?: string
  image?: { url: string; alt?: string; width?: number | null; height?: number | null }
  temporary?: boolean
  priceLabel?: string
  originalPriceLabel?: string
  whatsappURL?: string | null
}

function shapeWidth(shape: ConnectProduct['visual'], t: number) {
  if (shape === 'lamp') return 74 + 82 * Math.sin(Math.PI * t ** 0.8)
  if (shape === 'stand') return 176 - 118 * t ** 0.9
  return 40 + 150 * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))
}

function mixHex(hex: string, target: string, amount: number) {
  const from = hex.match(/[a-f\d]{2}/gi)?.map((part) => Number.parseInt(part, 16)) || [230, 220, 198]
  const to = target.match(/[a-f\d]{2}/gi)?.map((part) => Number.parseInt(part, 16)) || [0, 0, 0]
  return `#${from.map((channel, index) => Math.round(channel! * amount + (to[index] ?? 0) * (1 - amount)).toString(16).padStart(2, '0')).join('')}`
}

export function ink(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((part) => Number.parseInt(part, 16) / 255) || [0.9, 0.86, 0.78]
  const linear = channels.map((channel) => channel! <= 0.03928 ? channel! / 12.92 : ((channel! + 0.055) / 1.055) ** 2.4)
  const light = 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]! > 0.32
  return { color: light ? '#1b1814' : '#f3eddf', shadow: light ? '0 1px 0 rgba(255,255,255,.28)' : '0 1px 0 rgba(0,0,0,.4)' }
}

function segments(shape: ConnectProduct['visual'], t: number, layer: number, count: number) {
  const cx = 200
  if (shape === 'photo') return layer < 5 || layer >= count - 5 ? [[cx - 105, 210]] : [[cx - 105, 30], [cx + 75, 30]]
  if (shape === 'stand') {
    if (layer < 5) return [[cx - 95, 190]]
    if (layer >= count - 13) return [[cx - 65, 34], [cx + 31, 34]]
    const w = 150 - 40 * ((layer - 5) / (count - 18))
    return [[cx - w / 2, w]]
  }
  const w = shapeWidth(shape, t)
  return [[cx - w / 2, w]]
}

export function ProductRender({ product, animate, buildKey }: { product: ConnectProduct; animate: boolean; buildKey: number }) {
  const count = 36
  const height = 6.2
  const base = 300
  const id = `layer-${product.id}-${buildKey}`
  const isPlate = product.visual === 'plate' || product.visual === 'key'
  const contrast = ink(product.filament)
  if (isPlate) return <div key={buildKey} className={`studio-plate${product.visual === 'key' ? ' is-keychain' : ''}${animate ? ' is-building' : ''}`} style={{ '--fil': product.filament, color: contrast.color, textShadow: contrast.shadow, fontSize: product.visual === 'key' ? 36 : 42, fontFamily: 'var(--display)', fontWeight: 700, letterSpacing: '-.03em' } as React.CSSProperties}>{product.sample || product.title}</div>
  return <svg key={buildKey} className="studio-layer-render" viewBox="0 0 400 340" aria-hidden="true"><defs><linearGradient id={id} x1="0" x2="1"><stop offset="0" stopColor={mixHex(product.filament, '#000000', .52)} /><stop offset=".32" stopColor={product.filament} /><stop offset=".5" stopColor={mixHex(product.filament, '#ffffff', .82)} /><stop offset=".78" stopColor={mixHex(product.filament, '#000000', .86)} /><stop offset="1" stopColor={mixHex(product.filament, '#000000', .4)} /></linearGradient><filter id={`${id}-shadow`} x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="9" /></filter></defs><ellipse cx="200" cy="306" rx="105" ry="10" fill="#000" opacity=".7" filter={`url(#${id}-shadow)`} />{product.visual === 'photo' && <g><rect x="125" y="72" width="150" height="190" fill="#24221d" /><circle cx="238" cy="116" r="10" fill="#514a3f" /><path d="m125 248 45-62 30 32 30-74 45 104v14H125z" fill="#35312a" /></g>}{Array.from({ length: count }, (_, layer) => <g key={layer} className={animate ? 'studio-print-layer is-building' : 'studio-print-layer'} style={{ animationDelay: `${layer * 25}ms` }}><rect x={segments(product.visual, layer / (count - 1), layer, count)[0]![0]} y={base - (layer + 1) * height} width={segments(product.visual, layer / (count - 1), layer, count)[0]![1]} height={height + .5} rx="2.2" fill={`url(#${id})`} stroke="rgba(0,0,0,.3)" strokeWidth=".6" />{segments(product.visual, layer / (count - 1), layer, count).slice(1).map(([x, w], sub) => <rect key={sub} x={x} y={base - (layer + 1) * height} width={w} height={height + .5} rx="2.2" fill={`url(#${id})`} stroke="rgba(0,0,0,.3)" strokeWidth=".6" />)}</g>)}{animate && <line className="studio-render-nozzle" x1="60" y1="300" x2="340" y2="300" />}<ellipse cx="200" cy="77" rx={shapeWidth(product.visual, 1) / 2} ry={shapeWidth(product.visual, 1) * .065} fill={mixHex(product.filament, '#ffffff', .78)} /></svg>
}

export function ConnectProducts({ products, total, productsURL = '/products', variant = 'home', ctaLabel = 'Ask on WhatsApp' }: { products: ConnectProduct[]; total: number; productsURL?: string; variant?: 'home' | 'catalog'; ctaLabel?: string }) {
  const [rebuild, setRebuild] = useState<Record<string, number>>({})
  const cards = useRef<HTMLDivElement>(null)

  const animate = (id: string) => setRebuild((state) => ({ ...state, [id]: (state[id] || 0) + 1 }))
  useEffect(() => {
    const root = cards.current
    if (!root || variant === 'catalog' || !window.matchMedia('(hover: none)').matches) return
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = (entry.target as HTMLElement).dataset.connectCard
        if (id) animate(id)
        observer.unobserve(entry.target)
      }
    }), { threshold: .35 })
    root.querySelectorAll<HTMLElement>('[data-connect-card]').forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [products, variant])

  return <div className="studio-product-wrap">
    <div className="studio-product-grid" ref={cards}>{products.map((product, index) => <article className="studio-product-card" data-connect-card={product.id} key={`${product.id}-${product.slug}`} onPointerMove={variant === 'home' ? (event) => { const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--mx', `${event.clientX - bounds.left}px`); event.currentTarget.style.setProperty('--my', `${event.clientY - bounds.top}px`) } : undefined} onPointerEnter={variant === 'home' ? () => { if (!window.matchMedia('(hover: none)').matches) animate(product.id) } : undefined}>
      <Link className={`studio-product-photo${variant === 'catalog' && product.image?.width && product.image.height && product.image.width > product.image.height ? ' is-landscape' : ''}`} style={variant === 'catalog' && product.image?.width && product.image.height && product.image.width > product.image.height ? { aspectRatio: `${product.image.width} / ${product.image.height}` } : undefined} href={`/products/${product.slug}`} aria-label={`View ${product.title}`}>
        {product.image?.url ? <Image src={product.image.url} alt={product.image.alt || product.title} width={product.image.width || 720} height={product.image.height || 640} sizes="(max-width: 720px) 84vw, (max-width: 1020px) 48vw, 30vw" loading="lazy" unoptimized={!product.image.url.startsWith('/')} /> : <ProductRender product={product} animate={Boolean(rebuild[product.id])} buildKey={rebuild[product.id] || 0} />}
        <small className="studio-product-tag">{product.tag}</small><small className="studio-product-number">{String(index + 1).padStart(2, '0')}</small>
      </Link>
      <div className="studio-product-copy"><h3>{product.title}</h3>{variant !== 'catalog' && <p>{product.blurb}</p>}</div>
      {variant === 'catalog' ? <div className="studio-product-catalog-footer">
        <span className="studio-product-catalog-price">{product.priceLabel || 'Price on request'}{product.originalPriceLabel && <del>{product.originalPriceLabel}</del>}</span>
        {product.whatsappURL && <a className="studio-product-whatsapp" href={product.whatsappURL} aria-label={`Details for ${product.title} on WhatsApp`} target="_blank" rel="noopener noreferrer">Details</a>}
      </div> : <div className="studio-product-actions"><span className="studio-product-price">{product.priceLabel || 'Price on request'}</span><div className="studio-product-links"><Link className="studio-product-view" href={`/products/${product.slug}`}>View <ArrowUpRight size={15} /></Link>{product.whatsappURL && <a className="studio-product-ask" href={product.whatsappURL} data-wa-source="card" target="_blank" rel="noopener noreferrer">{ctaLabel}</a>}</div></div>}
    </article>)}</div>
    {variant === 'home' && <Link className="studio-view-all" href={productsURL}><span>View all products <small>{total} pieces</small></span><span className="studio-view-arrow" aria-hidden="true">↗</span></Link>}
  </div>
}
