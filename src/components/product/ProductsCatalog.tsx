'use client'

import Image from 'next/image'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { ProductRender, type ConnectProduct } from '@/components/home/ConnectProducts'
import { formatPrice } from '@/lib/shared'
import { PushAlerts } from '@/components/PushAlerts'
import {
  buildCatalogFacets,
  catalogFiltersToSearchParams,
  countActiveCatalogFilters,
  EMPTY_FILTERS,
  filterCatalogProducts,
  hasActiveCatalogFilters,
  OPTION_FILTERS,
  PRICE_BUCKETS,
  SORT_OPTIONS,
  sortCatalogProducts,
  type CatalogFilterState,
  type CatalogSort,
  type OptionFilterId,
  type PriceBucketId,
} from '@/lib/catalogFilters'
import './products-catalog.css'

export type CatalogImage = { url: string; alt: string; width?: number | null; height?: number | null }
export type CatalogSpec = { label: string; value: string }

export type CatalogProduct = {
  id: number
  slug: string
  title: string
  category: string | null
  categorySlug: string | null
  tags: string[]
  material: string | null
  materialSlug: string | null
  colours: { name: string; slug: string; hex: string | null }[]
  colourSlugs: string[]
  personalisable: boolean
  featured: boolean
  availability: string | null
  newArrival: boolean
  searchText: string
  description: string
  priceLabel: string
  hasPrice: boolean
  price: number | null
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

type CategoryOption = { name: string; slug: string }

type Props = {
  products: CatalogProduct[]
  categories: CategoryOption[]
  copy: CatalogCopy
  whatsappBase: string | null
  brandName: string
  siteURL: string
  calmMode: boolean
  pushPublicKey?: string
  initialFilters: CatalogFilterState
}

type FacetOption = { value: string; label: string; count: number; hex?: string | null }
type FilterKey = 'categories' | 'materials' | 'colours' | 'prices' | 'options'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function FilterPanel({
  categories,
  materials,
  colours,
  prices,
  options,
  filters,
  onToggle,
  resetLabel,
  onClear,
}: {
  categories: FacetOption[]
  materials: FacetOption[]
  colours: FacetOption[]
  prices: FacetOption[]
  options: FacetOption[]
  filters: CatalogFilterState
  onToggle: (key: FilterKey, value: string) => void
  resetLabel: string
  onClear: () => void
}) {
  return (
    <div className="pc-filter-body">
      <section>
        <h3>Category</h3>
        <div className="pc-opt-list">
          {categories.map((option) => {
            const selected = filters.categories.includes(option.value)
            return (
              <label key={option.value} className={`pc-opt${!option.count && !selected ? ' is-empty' : ''}`}>
                <input type="checkbox" checked={selected} disabled={!option.count && !selected} onChange={() => onToggle('categories', option.value)} />
                <span>{option.label}</span>
                <small>{option.count}</small>
              </label>
            )
          })}
        </div>
      </section>

      <section>
        <h3>Material</h3>
        <div className="pc-opt-list">
          {materials.length > 0 ? materials.map((option) => (
            <label key={option.value} className={`pc-opt${!option.count && !filters.materials.includes(option.value) ? ' is-empty' : ''}`}>
              <input type="checkbox" checked={filters.materials.includes(option.value)} disabled={!option.count && !filters.materials.includes(option.value)} onChange={() => onToggle('materials', option.value)} />
              <span>{option.label}</span>
              <small>{option.count}</small>
            </label>
          )) : <p className="pc-opt-empty">No materials listed yet.</p>}
        </div>
      </section>

      <section>
        <h3>Colour</h3>
        <div className="pc-opt-list">
          {colours.length > 0 ? colours.map((option) => (
            <label key={option.value} className="pc-opt pc-opt-colour">
              <input type="checkbox" checked={filters.colours.includes(option.value)} disabled={!option.count && !filters.colours.includes(option.value)} onChange={() => onToggle('colours', option.value)} />
              <i style={{ background: option.hex || '#d8d4ca' }} aria-hidden="true" />
              <span>{option.label}</span>
              <small>{option.count}</small>
            </label>
          )) : <p className="pc-opt-empty">No colours listed yet.</p>}
        </div>
      </section>

      {prices.length > 0 && (
        <section>
          <h3>Price</h3>
          <div className="pc-opt-list">
            {prices.map((option) => (
              <label key={option.value} className={`pc-opt${!option.count && !filters.prices.includes(option.value as PriceBucketId) ? ' is-empty' : ''}`}>
                <input type="checkbox" checked={filters.prices.includes(option.value as PriceBucketId)} disabled={!option.count && !filters.prices.includes(option.value as PriceBucketId)} onChange={() => onToggle('prices', option.value)} />
                <span>{option.label}</span>
                <small>{option.count}</small>
              </label>
            ))}
          </div>
        </section>
      )}

      {options.length > 0 && (
        <section>
          <h3>Options</h3>
          <div className="pc-opt-list">
            {options.map((option) => (
              <label key={option.value} className="pc-opt">
                <input type="checkbox" checked={filters.options.includes(option.value as OptionFilterId)} onChange={() => onToggle('options', option.value)} />
                <span>{option.label}</span>
                <small>{option.count}</small>
              </label>
            ))}
          </div>
        </section>
      )}

      <button type="button" className="pc-linkbtn pc-filter-reset" onClick={onClear}>{resetLabel}</button>
    </div>
  )
}

export function ProductsCatalog({ products, categories, copy, whatsappBase, brandName, siteURL, calmMode, pushPublicKey, initialFilters }: Props) {
  const perPage = Math.min(48, Math.max(1, copy.perPage || 15))
  const sheetTitleId = useId()
  const filterTitleId = useId()

  const [filters, setFilters] = useState<CatalogFilterState>(initialFilters)
  const [search, setSearch] = useState(initialFilters.q)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [lastProduct, setLastProduct] = useState<CatalogProduct | null>(null)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [slide, setSlide] = useState(0)

  const bySlug = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products])
  const filtered = useMemo(() => sortCatalogProducts(filterCatalogProducts(products, filters), filters.sort), [products, filters])
  const facets = useMemo(() => buildCatalogFacets(products, filters), [products, filters])
  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(filters.page, pages)
  const start = (safePage - 1) * perPage
  const slice = filtered.slice(start, start + perPage)

  const categoryLabels = useMemo(() => new Map(categories.map((category) => [category.slug, category.name])), [categories])
  const materialLabels = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((product) => { if (product.materialSlug && product.material) map.set(product.materialSlug, product.material) })
    return map
  }, [products])
  const colourLabels = useMemo(() => {
    const map = new Map<string, { label: string; hex: string | null }>()
    products.forEach((product) => product.colours.forEach((colour) => { if (!map.has(colour.slug)) map.set(colour.slug, { label: colour.name, hex: colour.hex }) }))
    return map
  }, [products])

  const categoryOptions: FacetOption[] = categories.map((category) => ({
    value: category.slug,
    label: category.name,
    count: facets.categories.get(category.slug) || 0,
  }))
  const materialOptions: FacetOption[] = [...facets.materials.entries()]
    .map(([value, count]) => ({ value, label: materialLabels.get(value) || value, count }))
    .sort((a, b) => a.label.localeCompare(b.label))
  const colourOptions: FacetOption[] = [...facets.colours.entries()]
    .map(([value, count]) => ({ value, label: colourLabels.get(value)?.label || value, count, hex: colourLabels.get(value)?.hex || null }))
    .sort((a, b) => a.label.localeCompare(b.label))
  const priceOptions: FacetOption[] = PRICE_BUCKETS
    .map((bucket) => ({ value: bucket.id, label: bucket.label, count: facets.prices.get(bucket.id) || 0 }))
    .filter((option) => option.count > 0 || filters.prices.includes(option.value as PriceBucketId))
  const optionOptions: FacetOption[] = OPTION_FILTERS
    .map((option) => ({ value: option.id, label: option.label, count: facets.options.get(option.id) || 0 }))
    .filter((option) => option.count > 0 || filters.options.includes(option.value as OptionFilterId))

  const resultsRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const filterSheetRef = useRef<HTMLElement>(null)
  const filterCloseRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)
  const filterLastFocusRef = useRef<HTMLElement | null>(null)
  const pushedRef = useRef(false)
  const dragY = useRef<number | null>(null)
  const dragDist = useRef(0)
  const filterDragY = useRef<number | null>(null)
  const filterDragDist = useRef(0)

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
        history.pushState({ pcSheet: slug }, '', `${location.pathname}${location.search}${target}`)
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

  const updateFilters = useCallback((patch: Partial<CatalogFilterState>, resetPage = true) => {
    setFilters((current) => ({ ...current, ...patch, ...(resetPage ? { page: 1 } : {}) }))
  }, [])

  const toggleFilter = useCallback((key: FilterKey, value: string) => {
    setFilters((current) => {
      const list = current[key] as string[]
      const next = list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]
      return { ...current, [key]: next, page: 1 } as CatalogFilterState
    })
  }, [])

  const resetAll = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setSearch('')
  }, [])

  const removeFilter = toggleFilter

  const openFilters = useCallback(() => {
    filterLastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : filterTriggerRef.current
    if (filterSheetRef.current) {
      filterSheetRef.current.classList.remove('drag')
      filterSheetRef.current.style.transform = ''
    }
    setFiltersOpen(true)
  }, [])

  const closeFilters = useCallback((restoreFocus = true) => {
    setFiltersOpen(false)
    if (restoreFocus) filterLastFocusRef.current?.focus?.({ preventScroll: true })
  }, [])

  const onFilterTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    filterDragY.current = event.touches[0]!.clientY
    filterDragDist.current = 0
    filterSheetRef.current?.classList.add('drag')
  }
  const onFilterTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (filterDragY.current == null) return
    filterDragDist.current = Math.max(0, event.touches[0]!.clientY - filterDragY.current)
    if (filterSheetRef.current) filterSheetRef.current.style.transform = `translateY(${filterDragDist.current}px)`
  }
  const onFilterTouchEnd = () => {
    if (filterDragY.current == null) return
    filterDragY.current = null
    filterSheetRef.current?.classList.remove('drag')
    if (filterDragDist.current > 110) closeFilters()
    else if (filterSheetRef.current) filterSheetRef.current.style.transform = ''
  }

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
    if (search === filters.q) return
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, q: search.trim(), page: 1 }))
    }, 220)
    return () => window.clearTimeout(timer)
  }, [search, filters.q])

  useEffect(() => {
    try {
      const query = catalogFiltersToSearchParams({ ...filters, page: safePage }).toString()
      history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`)
    } catch {
      // history can be unavailable in restricted contexts
    }
  }, [filters, safePage])

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

  useEffect(() => {
    if (!filtersOpen) return
    const scrollY = window.scrollY
    const { body, documentElement } = document
    const previous = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width, paddingRight: body.style.paddingRight }
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    const focusTimer = window.setTimeout(() => filterCloseRef.current?.focus({ preventScroll: true }), 30)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeFilters()
        return
      }
      if (event.key !== 'Tab' || !filterSheetRef.current) return
      const items = Array.from(filterSheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) {
        event.preventDefault()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const inside = filterSheetRef.current.contains(document.activeElement)
      if (!inside || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault()
        first.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        last.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.paddingRight = previous.paddingRight
      window.scrollTo(0, scrollY)
    }
  }, [filtersOpen, closeFilters])

  useEffect(() => () => { document.body.classList.remove('pc-locked') }, [])

  const activeChips = useMemo(() => {
    const chips: { key: FilterKey; value: string; label: string }[] = []
    filters.categories.forEach((value) => chips.push({ key: 'categories', value, label: categoryLabels.get(value) || value }))
    filters.materials.forEach((value) => chips.push({ key: 'materials', value, label: materialLabels.get(value) || value }))
    filters.colours.forEach((value) => chips.push({ key: 'colours', value, label: colourLabels.get(value)?.label || value }))
    filters.prices.forEach((value) => chips.push({ key: 'prices', value, label: PRICE_BUCKETS.find((bucket) => bucket.id === value)?.label || value }))
    filters.options.forEach((value) => chips.push({ key: 'options', value, label: OPTION_FILTERS.find((option) => option.id === value)?.label || value }))
    return chips
  }, [filters, categoryLabels, materialLabels, colourLabels])

  const activeFilterCount = countActiveCatalogFilters(filters)

  const pageNumbers = (() => {
    const set = new Set([1, pages, safePage, safePage - 1, safePage + 1])
    if (safePage <= 3) [2, 3].forEach((n) => set.add(n))
    if (safePage >= pages - 2) [pages - 1, pages - 2].forEach((n) => set.add(n))
    return [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  })()

  const gotoPage = (next: number) => {
    updateFilters({ page: next }, false)
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

  const filterPanel = (
    <FilterPanel
      categories={categoryOptions}
      materials={materialOptions}
      colours={colourOptions}
      prices={priceOptions}
      options={optionOptions}
      filters={filters}
      onToggle={toggleFilter}
      resetLabel={copy.resetLabel}
      onClear={resetAll}
    />
  )

  const filterSheet = filtersOpen ? createPortal(
    <div className="pc-filter-layer">
      <button type="button" className="pc-filter-scrim" aria-label="Close filters" onClick={() => closeFilters()} />
      <section className="pc-filter-sheet" ref={filterSheetRef} role="dialog" aria-modal="true" aria-labelledby={filterTitleId}>
        <div className="pc-filter-grab" onTouchStart={onFilterTouchStart} onTouchMove={onFilterTouchMove} onTouchEnd={onFilterTouchEnd}><i /></div>
        <div className="pc-filter-head">
          <div>
            <p>Refine</p>
            <h2 id={filterTitleId}>{copy.filtersLabel}</h2>
          </div>
          <button ref={filterCloseRef} type="button" className="pc-filter-close" aria-label="Close filters" onClick={() => closeFilters()}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="pc-filter-scroll">
          <button type="button" className="pc-filter-clear-top" onClick={resetAll} disabled={!hasActiveCatalogFilters(filters)}>{copy.resetLabel}</button>
          {filterPanel}
        </div>
        <div className="pc-filter-foot">
          <button type="button" onClick={() => closeFilters()}>Show {filtered.length} {filtered.length === 1 ? 'product' : 'products'}</button>
        </div>
      </section>
    </div>,
    document.body,
  ) : null

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
              <input type="search" placeholder={copy.searchPlaceholder} autoComplete="off" aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <span className="pc-spacer" />
            <button ref={filterTriggerRef} type="button" className="pc-ctl pc-btn-filter" aria-haspopup="dialog" aria-expanded={filtersOpen} onClick={openFilters}>
              <SlidersHorizontal size={16} aria-hidden="true" />
              {copy.filtersLabel}
              {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
            </button>
            <label className="pc-sort">
              <span>Sort</span>
              <select className="pc-ctl" aria-label="Sort products" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as CatalogSort })}>
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <div className="pc-chips" role="group" aria-label="Categories">
            <button type="button" className="pc-chip" aria-pressed={filters.categories.length === 0} onClick={() => updateFilters({ categories: [] })}>
              All<small>{products.length}</small>
            </button>
            {categoryOptions.map((category) => (
              <button
                key={category.value}
                type="button"
                className="pc-chip"
                aria-pressed={filters.categories.includes(category.value)}
                disabled={!category.count && !filters.categories.includes(category.value)}
                onClick={() => toggleFilter('categories', category.value)}
              >
                {category.label}<small>{category.count}</small>
              </button>
            ))}
          </div>
          {(activeChips.length > 0 || filters.q) && (
            <div className="pc-active" aria-label="Active filters">
              <span className="pc-active-label">Active</span>
              {filters.q && (
                <button type="button" className="pc-active-chip" onClick={() => { setSearch(''); updateFilters({ q: '' }) }}>
                  “{filters.q}” <X size={12} aria-hidden="true" />
                </button>
              )}
              {activeChips.map((chip) => (
                <button key={`${chip.key}-${chip.value}`} type="button" className="pc-active-chip" onClick={() => removeFilter(chip.key, chip.value)}>
                  {chip.label} <X size={12} aria-hidden="true" />
                </button>
              ))}
              <button type="button" className="pc-active-clear" onClick={resetAll}>{copy.resetLabel}</button>
            </div>
          )}
        </div>

        <div className="pc-layout">
          <aside className="pc-side" aria-label={copy.filtersLabel}>
            <div className="pc-side-title">
              <span>{copy.filtersLabel}</span>
              {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
            </div>
            {filterPanel}
          </aside>

          <main id="pc-results" ref={resultsRef}>
            <div className="pc-meta">
              <span>{filtered.length} {filtered.length === 1 ? 'product' : 'products'}</span>
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

      {filterSheet}

      <div className={`pc-overlay${openSlug ? ' open' : ''}`} onClick={() => closeProduct()} />
      <section
        ref={sheetRef}
        className={`pc-sheet${openSlug ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={sheetTitleId}
        aria-hidden={openSlug ? undefined : true}
        inert={!openSlug}
        tabIndex={-1}
      >
        <div className="pc-grab" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}><i /></div>
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
              <PushAlerts publicKey={pushPublicKey} source="product-sheet" />
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
