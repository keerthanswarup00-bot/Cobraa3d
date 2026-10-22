'use client'

import Image from 'next/image'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react'
import { ProductRender, type ConnectProduct } from '@/components/home/ConnectProducts'
import { formatPrice } from '@/lib/shared'
import './products-catalog.css'

export type CatalogImage = { url: string; alt: string; width?: number | null; height?: number | null }
export type CatalogSpec = { label: string; value: string }

export type CatalogProduct = {
  id: number
  slug: string
  title: string
  category: string | null
  tags: string[]
  description: string
  priceLabel: string
  hasPrice: boolean
  price?: number | null
  currency: string
  specs: CatalogSpec[]
  images: CatalogImage[]
  render: ConnectProduct
}

export type CatalogCopy = {
  eyebrow: string
  heading: string
  headingAccent: string
  searchPlaceholder: string
  filtersLabel: string
  maxPriceLabel: string
  goodForLabel: string
  resetLabel: string
  emptyTitle: string
  emptyBody: string
  emptyAction: string
  noteLabel: string
  notePlaceholder: string
  orderLabel: string
  orderFooter: string
  finePrint: string
  perPage: number
}

type Props = {
  products: CatalogProduct[]
  categories: { name: string }[]
  copy: CatalogCopy
  whatsappBase: string | null
  brandName: string
  siteURL: string
  calmMode: boolean
  initialQuery?: string
  initialPage?: number
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const SORTS = [
  { value: 'new', label: 'Newest' },
  { value: 'plow', label: 'Price: low to high' },
  { value: 'phigh', label: 'Price: high to low' },
  { value: 'az', label: 'Name: A to Z' },
] as const

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ProductsCatalog({ products, categories, copy, whatsappBase, brandName, siteURL, calmMode, initialQuery = '', initialPage = 1 }: Props) {
  const perPage = Math.min(48, Math.max(1, copy.perPage || 15))
  const sheetTitleId = useId()

  const bySlug = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products])
  const orderMap = useMemo(() => new Map(products.map((product, index) => [product.id, index])), [products])
  const chips = useMemo(() => {
    const counts = new Map<string, number>()
    products.forEach((product) => {
      const name = product.category?.trim()
      if (name) counts.set(name, (counts.get(name) || 0) + 1)
    })

    // Prefer the configured category order, but never hide a category that
    // is actually attached to a published product.
    const configured = categories
      .filter((category) => (counts.get(category.name) || 0) > 0)
      .map((category) => category.name)
    const seen = new Set(configured)
    const productCategories = [...counts.keys()]
      .filter((name) => !seen.has(name))
      .sort((a, b) => a.localeCompare(b))

    return [
      { name: 'All', count: products.length },
      ...[...configured, ...productCategories].map((name) => ({ name, count: counts.get(name) || 0 })),
    ]
  }, [products, categories])
  const tagList = useMemo(() => [...new Set(products.flatMap((product) => product.tags))].sort((a, b) => a.localeCompare(b)), [products])
  const priced = useMemo(() => products.filter((product) => product.hasPrice && product.price != null), [products])
  const maxP = priced.length ? Math.max(...priced.map((product) => product.price as number)) : 0
  const minP = priced.length ? Math.min(...priced.map((product) => product.price as number)) : 0
  const priceFloor = Math.floor(minP / 100) * 100
  const priceEnabled = priced.length >= 2 && minP < maxP
  const currency = priced[0]?.currency || 'INR'

  const [q, setQ] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery.trim().toLowerCase())
  const [cat, setCat] = useState('All')
  const [tags, setTags] = useState<string[]>([])
  const [maxOverride, setMaxOverride] = useState<number | null>(null)
  const [sort, setSort] = useState<(typeof SORTS)[number]['value']>('new')
  const [page, setPage] = useState(initialPage)
  const [drawer, setDrawer] = useState(false)
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [lastProduct, setLastProduct] = useState<CatalogProduct | null>(null)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [slide, setSlide] = useState(0)
  const max = maxOverride == null ? maxP : Math.min(maxOverride, maxP)

  const resultsRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const grabRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)
  const pushedRef = useRef(false)
  const dragY = useRef<number | null>(null)
  const dragDist = useRef(0)

  const openProduct = useCallback((slug: string, fromPop = false) => {
    const product = bySlug.get(slug)
    if (!product) return
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setLastProduct(product)
    setOpenSlug(slug)
    setQty(1)
    setNote('')
    setSlide(0)
    if (sheetRef.current) {
      sheetRef.current.classList.remove('drag')
      sheetRef.current.style.transform = ''
    }
    if (trackRef.current) trackRef.current.scrollLeft = 0
    const target = `#/p/${encodeURIComponent(slug)}`
    if (!fromPop && location.hash !== target) {
      try {
        history.pushState({ pcSheet: slug }, '', target)
        pushedRef.current = true
      } catch {
        // history can be unavailable in restricted contexts
      }
    }
    document.body.classList.add('pc-locked')
    window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 50)
  }, [bySlug])

  const closeProduct = useCallback((fromPop = false) => {
    setOpenSlug(null)
    document.body.classList.remove('pc-locked')
    if (!fromPop) {
      if (pushedRef.current) {
        pushedRef.current = false
        history.back()
      } else {
        try {
          history.replaceState(null, '', `${location.pathname}${location.search}`)
        } catch {
          // history can be unavailable in restricted contexts
        }
      }
    } else {
      pushedRef.current = false
    }
    lastFocusRef.current?.focus?.({ preventScroll: true })
  }, [])

  const resetAll = useCallback(() => {
    setQ('')
    setQuery('')
    setCat('All')
    setTags([])
    setMaxOverride(null)
    setSort('new')
    setPage(1)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const match = window.location.hash.match(/^#\/p\/(.+)$/)
        if (match) openProduct(decodeURIComponent(match[1]), true)
      } catch {
        // a malformed hash simply opens nothing
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [openProduct])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = q.trim().toLowerCase()
      if (next !== query) {
        setQuery(next)
        setPage(1)
      }
    }, 140)
    return () => window.clearTimeout(timer)
  }, [q, query])

  useEffect(() => {
    const onPop = () => {
      const match = location.hash.match(/^#\/p\/(.+)$/)
      if (match) openProduct(decodeURIComponent(match[1]), true)
      else closeProduct(true)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [openProduct, closeProduct])

  useEffect(() => {
    if (!openSlug) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeProduct()
        return
      }
      if (event.key === 'Tab' && sheetRef.current) {
        const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (!items.length) {
          event.preventDefault()
          return
        }
        const first = items[0]!
        const last = items[items.length - 1]!
        const inside = sheetRef.current.contains(document.activeElement)
        if (!inside || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault()
          first.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          last.focus()
        }
        return
      }
      const target = event.target
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return
      const track = trackRef.current
      const product = lastProduct
      if (!track || !product || product.images.length < 2) return
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      const index = Math.round(track.scrollLeft / track.clientWidth)
      const next = Math.max(0, Math.min(product.images.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))
      track.scrollTo({ left: next * track.clientWidth, behavior: calmMode || prefersReduced() ? 'auto' : 'smooth' })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openSlug, closeProduct, lastProduct, calmMode])

  useEffect(() => () => { document.body.classList.remove('pc-locked') }, [])

  const filtered = useMemo(() => {
    const list = products.filter((product) =>
      (cat === 'All' || product.category === cat)
      && (!query || `${product.title} ${product.category || ''} ${product.tags.join(' ')}`.toLowerCase().includes(query))
      && (!tags.length || tags.every((tag) => product.tags.includes(tag)))
      && (!product.hasPrice || (product.price as number) <= max))
    const priceAsc = (a: CatalogProduct, b: CatalogProduct) => {
      if (a.hasPrice && b.hasPrice) return (a.price as number) - (b.price as number)
      if (a.hasPrice) return -1
      if (b.hasPrice) return 1
      return 0
    }
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'plow') list.sort((a, b) => priceAsc(a, b) || (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    else if (sort === 'phigh') list.sort((a, b) => (a.hasPrice && b.hasPrice ? (b.price as number) - (a.price as number) : priceAsc(a, b)) || (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    else list.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    return list
  }, [products, orderMap, cat, query, tags, max, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, pages)

  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const trimmed = q.trim()
      if (trimmed) url.searchParams.set('q', trimmed)
      else url.searchParams.delete('q')
      if (safePage > 1) url.searchParams.set('page', String(safePage))
      else url.searchParams.delete('page')
      history.replaceState(history.state, '', url)
    } catch {
      // history can be unavailable in restricted contexts
    }
  }, [q, safePage])

  const start = (safePage - 1) * perPage
  const slice = filtered.slice(start, start + perPage)
  const activeFilters = tags.length + (max < maxP ? 1 : 0) + (cat !== 'All' ? 1 : 0)
  const money = (value: number) => formatPrice(value, 'show', currency)

  const pageNumbers = (() => {
    const set = new Set([1, pages, safePage, safePage - 1, safePage + 1])
    if (safePage <= 3) [2, 3].forEach((n) => set.add(n))
    if (safePage >= pages - 2) [pages - 1, pages - 2].forEach((n) => set.add(n))
    return [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  })()

  const gotoPage = (next: number) => {
    setPage(next)
    const target = resultsRef.current
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - 150
    window.scrollTo({ top: Math.min(top, window.scrollY), behavior: calmMode || prefersReduced() ? 'auto' : 'smooth' })
  }

  const onCardActivate = (event: ReactMouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    openProduct(slug)
  }

  const onTrackScroll = () => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setSlide(Math.round(track.scrollLeft / track.clientWidth))
  }

  const goGallery = (direction: number) => {
    const track = trackRef.current
    if (!track || !lastProduct || !track.clientWidth) return
    const index = Math.max(0, Math.min(lastProduct.images.length - 1, Math.round(track.scrollLeft / track.clientWidth) + direction))
    track.scrollTo({ left: index * track.clientWidth, behavior: calmMode || prefersReduced() ? 'auto' : 'smooth' })
  }

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    dragY.current = event.touches[0]!.clientY
    dragDist.current = 0
    sheetRef.current?.classList.add('drag')
  }
  const onTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (dragY.current == null) return
    dragDist.current = Math.max(0, event.touches[0]!.clientY - dragY.current)
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dragDist.current}px)`
  }
  const onTouchEnd = () => {
    if (dragY.current == null) return
    dragY.current = null
    sheetRef.current?.classList.remove('drag')
    if (dragDist.current > 110) closeProduct()
    else if (sheetRef.current) sheetRef.current.style.transform = ''
  }

  const orderHref = useMemo(() => {
    if (!whatsappBase || !lastProduct) return null
    const lines = [`Hi ${brandName}, I'd like to order:`, '', `• ${lastProduct.title}`, `• Qty: ${qty}`]
    if (lastProduct.hasPrice && lastProduct.price != null) {
      lines.push(`• Price: ${formatPrice(lastProduct.price, 'show', lastProduct.currency)} each · ${formatPrice(lastProduct.price * qty, 'show', lastProduct.currency)} total`)
    }
    const trimmed = note.trim()
    if (trimmed) lines.push(`• Notes: ${trimmed}`)
    lines.push('', `• Product: ${siteURL}/products/${lastProduct.slug}`, '', copy.orderFooter)
    return `${whatsappBase}${encodeURIComponent(lines.join('\n'))}`
  }, [whatsappBase, lastProduct, qty, note, brandName, siteURL, copy.orderFooter])

  const orderLabel = (() => {
    if (!lastProduct || qty <= 1) return copy.orderLabel
    const total = lastProduct.hasPrice && lastProduct.price != null ? ` · ${formatPrice(lastProduct.price * qty, 'show', lastProduct.currency)}` : ''
    return `Order ${qty} on WhatsApp${total}`
  })()

  const slideCount = lastProduct ? Math.max(1, lastProduct.images.length) : 1

  return (
    <div className={`pc-page${calmMode ? ' pc-calm' : ''}`}>
      <div className="pc-wrap">
        <div className="pc-head">
          {copy.eyebrow && <p className="pc-eyebrow">{copy.eyebrow}</p>}
          <h1>{copy.heading}{copy.headingAccent && <><br /><span>{copy.headingAccent}</span></>}</h1>
        </div>

        <div className="pc-toolbar">
          <div className="pc-row">
            <label className="pc-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" placeholder={copy.searchPlaceholder} autoComplete="off" aria-label="Search products" value={q} onChange={(event) => setQ(event.target.value)} />
            </label>
            <span className="pc-spacer" />
            <button type="button" className="pc-ctl pc-btn-filter" onClick={() => setDrawer(true)}><span>{copy.filtersLabel}</span>{activeFilters > 0 && <span className="pc-filter-count">{activeFilters}</span>}<span aria-hidden="true">☷</span></button>
            <select className="pc-ctl" aria-label="Sort products" value={sort} onChange={(event) => { setSort(event.target.value as (typeof SORTS)[number]['value']); setPage(1) }}>
              {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="pc-chips" role="group" aria-label="Categories">
            {chips.map((chip) => (
              <button key={chip.name} type="button" className="pc-chip" aria-pressed={cat === chip.name} onClick={() => { setCat(chip.name); setPage(1) }}>
                {chip.name}<small>{chip.count}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="pc-layout">
          <aside className={`pc-side${drawer ? ' open' : ''}`} aria-label={copy.filtersLabel}>
            <div className="pc-side-head"><span>{copy.filtersLabel}</span><div className="pc-side-actions"><button type="button" className="pc-linkbtn" onClick={resetAll}>Reset</button><button type="button" className="pc-side-done" onClick={() => setDrawer(false)}>Show {filtered.length} products</button></div></div>
            <section className="pc-side-categories">
              <h3>Category</h3>
              <div className="pc-side-category-list">
                {chips.map((chip) => (
                  <button key={chip.name} type="button" className="pc-opt pc-category-opt" aria-pressed={cat === chip.name} onClick={() => { setCat(chip.name); setPage(1) }}>
                    <span>{chip.name}</span><small>{chip.count}</small>
                  </button>
                ))}
              </div>
            </section>
            {priceEnabled && (
              <section>
                <h3>{copy.maxPriceLabel}</h3>
                <input type="range" min={priceFloor} max={maxP} step={50} value={max} aria-label={copy.maxPriceLabel} onChange={(event) => { setMaxOverride(Number(event.target.value)); setPage(1) }} />
                <div className="pc-range-val"><span>{money(priceFloor)}</span><span>{max >= maxP ? 'Any' : `Up to ${money(max)}`}</span></div>
              </section>
            )}
            {tagList.length > 0 && (
              <section>
                <h3>{copy.goodForLabel}</h3>
                <div>
                  {tagList.map((tag) => (
                    <label key={tag} className="pc-opt">
                      <input type="checkbox" checked={tags.includes(tag)} onChange={(event) => { setTags((current) => event.target.checked ? [...current, tag] : current.filter((value) => value !== tag)); setPage(1) }} />
                      {' '}{tag}
                    </label>
                  ))}
                </div>
              </section>
            )}
            <button type="button" className="pc-linkbtn" onClick={resetAll}>{copy.resetLabel}</button>
          </aside>

          <main id="pc-results" ref={resultsRef}>
            <div className="pc-meta">
              <span>{filtered.length} product{filtered.length === 1 ? '' : 's'}</span>
              <span>{filtered.length ? `Page ${safePage} of ${pages}` : ''}</span>
            </div>
            <div className="pc-grid">
              {slice.length ? slice.map((product, index) => (
                <article className="pc-card" key={product.id}>
                  <a className={`pc-media${product.images.length > 1 ? '' : ' single'}`} href={`/products/${product.slug}`} aria-label={`View ${product.title}`} onClick={(event) => onCardActivate(event, product.slug)}>
                    {product.images[0] ? (
                      <>
                        <Image className="a" src={product.images[0].url} alt={product.images[0].alt} fill sizes="(max-width: 860px) 50vw, (max-width: 1320px) 25vw, 300px" loading={index < 4 ? 'eager' : 'lazy'} unoptimized={!product.images[0].url.startsWith('/')} />
                        {product.images[1] && <Image className="b" src={product.images[1].url} alt="" aria-hidden fill sizes="(max-width: 860px) 50vw, (max-width: 1320px) 25vw, 300px" loading="lazy" unoptimized={!product.images[1].url.startsWith('/')} />}
                      </>
                    ) : (
                      <span className="pc-fallback"><ProductRender product={product.render} animate={false} buildKey={0} /></span>
                    )}
                  </a>
                  <div className="pc-info">
                    <h2 className="pc-card-title">{product.title}</h2>
                    <div className="pc-foot">
                      <span className="pc-price">{product.priceLabel}</span>
                      <a className="pc-view" href={`/products/${product.slug}`} onClick={(event) => onCardActivate(event, product.slug)}>View</a>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="pc-empty"><b>{copy.emptyTitle}</b>{copy.emptyBody} <button type="button" className="pc-linkbtn" onClick={resetAll}>{copy.emptyAction}</button>.</div>
              )}
            </div>
            {pages > 1 && (
              <nav className="pc-pager" aria-label="Pagination">
                <button type="button" className="pc-pg" disabled={safePage === 1} aria-label="Previous page" onClick={() => gotoPage(safePage - 1)}>←</button>
                {pageNumbers.map((number, index) => {
                  const previous = pageNumbers[index - 1]
                  return (
                    <span key={number} style={{ display: 'contents' }}>
                      {previous && number - previous > 1 && <span className="pc-dots">…</span>}
                      <button type="button" className="pc-pg" aria-current={number === safePage ? 'page' : undefined} onClick={() => gotoPage(number)}>{number}</button>
                    </span>
                  )
                })}
                <button type="button" className="pc-pg" disabled={safePage === pages} aria-label="Next page" onClick={() => gotoPage(safePage + 1)}>→</button>
              </nav>
            )}
          </main>
        </div>
      </div>

      <div className={`pc-scrim${drawer ? ' open' : ''}`} onClick={() => setDrawer(false)} />

      <div className={`pc-overlay${openSlug ? ' open' : ''}`} onClick={() => closeProduct()} />
      <section
        ref={sheetRef}
        className={`pc-sheet${openSlug ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={sheetTitleId}
        aria-hidden={openSlug ? undefined : true}
        inert={!openSlug}
      >
        <div className="pc-grab" ref={grabRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}><i /></div>
        <button ref={closeRef} type="button" className="pc-close" aria-label="Close" onClick={() => closeProduct()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="pc-scroll">
          <div className="pc-gal">
            <div className="pc-track" ref={trackRef} onScroll={onTrackScroll}>
              {lastProduct && (lastProduct.images.length ? lastProduct.images.map((image, index) => (
                <div className="pc-slide" key={`${image.url}-${index}`}>
                  <Image src={image.url} alt={`${lastProduct.title} — image ${index + 1} of ${lastProduct.images.length}`} fill sizes="(max-width: 860px) 100vw, 50vw" loading={index === 0 ? 'eager' : 'lazy'} draggable={false} unoptimized={!image.url.startsWith('/')} />
                </div>
              )) : (
                <div className="pc-slide"><span className="pc-fallback"><ProductRender product={lastProduct.render} animate={false} buildKey={0} /></span></div>
              ))}
            </div>
            <button type="button" className="pc-arrow l" aria-label="Previous image" style={slideCount > 1 ? undefined : { visibility: 'hidden' }} onClick={() => goGallery(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className="pc-arrow r" aria-label="Next image" style={slideCount > 1 ? undefined : { visibility: 'hidden' }} onClick={() => goGallery(1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
            {lastProduct && lastProduct.images.length > 1 && (
              <div className="pc-dotrow" aria-hidden="true">
                {lastProduct.images.map((_, index) => <i key={index} className={index === slide ? 'on' : ''} />)}
              </div>
            )}
          </div>
          {lastProduct && (
            <div className="pc-detail">
              {lastProduct.category && <div className="pc-cat">{lastProduct.category}</div>}
              <h2 id={sheetTitleId}>{lastProduct.title}</h2>
              <div className="pc-sheet-price">{lastProduct.priceLabel}</div>
              {lastProduct.description && <p className="pc-desc">{lastProduct.description}</p>}
              {lastProduct.specs.length > 0 && (
                <dl className="pc-specs">
                  {lastProduct.specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}
                </dl>
              )}
              <label className="pc-field" htmlFor="pc-note">{copy.noteLabel}</label>
              <textarea className="pc-note" id="pc-note" placeholder={copy.notePlaceholder} value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          )}
        </div>
        {orderHref && (
          <div className="pc-sheet-action">
            <div className="pc-buybar">
              <div className="pc-qty">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty((current) => Math.max(1, current - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty((current) => Math.min(20, current + 1))}>+</button>
              </div>
              <a className="pc-order" href={orderHref} target="_blank" rel="noopener noreferrer" data-wa-source="catalog" data-wa-slug={lastProduct?.slug}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                <span>{orderLabel}</span>
              </a>
            </div>
            {copy.finePrint && <div className="pc-fine">{copy.finePrint}</div>}
          </div>
        )}
      </section>
    </div>
  )
}
