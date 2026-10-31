'use client'

import Image from 'next/image'
import { Search, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ProductLink } from '@/components/product/ProductLink'
import { filterAndSortProducts, type ProductSort } from '@/lib/productListing'

export type BrowserProduct = {
  id: number; slug: string; title: string; shortDescription?: string | null; seasonalTags?: { tag?: string | null }[] | null
  price?: number | null; currency?: string; priceMode?: string | null; featured?: boolean | null; publishedAt?: string | null
  badges?: string[] | null; availability?: string | null; category?: { slug?: string; name?: string } | number | null
  images?: { alt: string; image?: { url?: string | null; width?: number | null; height?: number | null } | number }[] | null
  whatsappURL?: string | null
  isDemo?: boolean | null; ageGroup?: string | null
}
export type BrowserCategory = { slug: string; name: string }

const priceText = (p: BrowserProduct) => p.priceMode === 'show' && p.price != null
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: p.currency || 'INR', maximumFractionDigits: 0 }).format(p.price)
  : 'Ask for price'
const badgeOrder = ['festive', 'new', 'bestseller', 'customisable']
const badgeLabel: Record<string, string> = { festive: 'Festive', new: 'New', bestseller: 'Bestseller', customisable: 'Customisable' }

export function ProductsBrowser({ products, categories, initialCategory = '', initialQuery = '', initialSort = 'featured' }: {
  products: BrowserProduct[]; categories: BrowserCategory[]; initialCategory?: string; initialQuery?: string; initialSort?: ProductSort
}) {
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<ProductSort>(initialSort)
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery))
  const [shown, setShown] = useState(12)
  const filteredByCategory = useMemo(() => category ? products.filter((p) => typeof p.category === 'object' && p.category?.slug === category) : products, [products, category])
  const filtered = useMemo(() => filterAndSortProducts(filteredByCategory, query, sort), [filteredByCategory, query, sort])
  const hasPrices = products.some((p) => p.priceMode === 'show' && p.price != null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (category) params.set('category', category); else params.delete('category')
    if (query.trim()) params.set('q', query.trim()); else params.delete('q')
    if (sort !== 'featured') params.set('sort', sort); else params.delete('sort')
    const suffix = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${suffix ? `?${suffix}` : ''}`)
  }, [category, query, sort])

  const reset = () => { setCategory(''); setQuery(''); setSort('featured'); setSearchOpen(false); setShown(12) }
  return <div className="product-browser">
    <div className="product-toolbar">
      <nav className="category-chips" aria-label="Product categories"><button className={!category ? 'active' : ''} onClick={() => setCategory('')}>All</button>{categories.map((item) => <button key={item.slug} className={category === item.slug ? 'active' : ''} onClick={() => setCategory(item.slug)}>{item.name}</button>)}</nav>
      <div className="product-tools"><button className="icon-button" aria-label={searchOpen ? 'Close search' : 'Search products'} onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery('') }}><Search size={18} /></button>
        <label className="sort-label"><span className="sr-only">Sort products</span><select value={sort} onChange={(e) => setSort(e.target.value as ProductSort)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="name-asc">Name: A–Z</option>{hasPrices && <><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></>}</select></label>
      </div>
    </div>
    {searchOpen && <label className="product-search"><span className="sr-only">Search products</span><input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setShown(12) }} placeholder="Search products" /></label>}
    <div className="active-filter"><span aria-live="polite">{category ? `${categories.find((c) => c.slug === category)?.name || 'Category'} · ` : ''}{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>{(category || query || sort !== 'featured') && <button onClick={reset}>Reset</button>}</div>
    {filtered.length ? <><ul className="product-grid">{filtered.slice(0, shown).map((p, index) => {
      const main = p.images?.[0]
      const secondary = p.images?.[1]
      const mainImage = typeof main?.image === 'object' ? main.image : undefined
      const secondImage = typeof secondary?.image === 'object' ? secondary.image : undefined
      const badge = badgeOrder.find((b) => p.badges?.includes(b))
      const unavailable = p.availability === 'out_of_stock' || p.availability === 'coming_soon'
      return <li key={p.id} className="product-card"><ProductLink className="product-image" href={`/products/${p.slug}`} aria-label={`View ${p.title}`}>
        {mainImage?.url ? <Image src={mainImage.url} alt={main?.alt || p.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" loading={index === 0 ? 'eager' : 'lazy'} /> : <span className="image-placeholder">Product photo to be added</span>}
        {p.isDemo && <span className="demo-product-label">DEMO · temporary listing</span>}
        {p.isDemo && <span className="demo-image-label">Placeholder image · not a product photo</span>}
        {secondImage?.url && <Image className="product-image-secondary" src={secondImage.url} alt={secondary?.alt || p.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />}
        {badge && <span className="product-badge">{badgeLabel[badge]}</span>}
        {unavailable && <span className="availability-label">{p.availability === 'out_of_stock' ? 'Out of stock' : 'Coming soon'}</span>}
      </ProductLink><div className="product-card-copy"><div><ProductLink href={`/products/${p.slug}`}><h2>{p.title}</h2></ProductLink>{p.shortDescription && <p>{p.shortDescription}</p>}{!p.isDemo && <strong>{priceText(p)}</strong>}</div>
        {p.whatsappURL ? <a className={`product-wa${p.isDemo ? ' product-wa-demo' : ''}`} href={p.whatsappURL} target="_blank" rel="noopener noreferrer" aria-label={`${unavailable ? 'Ask about availability for' : 'Enquire about'} ${p.title}`}><MessageCircle size={17} /><span>{p.isDemo ? 'Enquire on WhatsApp' : unavailable ? 'Ask about availability' : 'WhatsApp'}</span></a> : <button className="product-wa product-wa-demo" type="button" disabled aria-label={`WhatsApp enquiry unavailable for ${p.title}`}><MessageCircle size={17} /><span>WhatsApp unavailable</span></button>}
      </div></li>
    })}</ul>{filtered.length > shown && <button className="show-more" onClick={() => setShown((n) => n + 12)}>Show more</button>}</>
      : <div className="product-empty"><span className="empty-contour" aria-hidden="true">〰</span><h2>Nothing here yet</h2><p>Try clearing your filters or ask us about a custom piece.</p><button onClick={reset}>Reset filters</button></div>}
  </div>
}
