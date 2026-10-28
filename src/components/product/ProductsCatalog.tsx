'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { ProductRender, type ConnectProduct } from '@/components/home/ConnectProducts'
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
  shortIncludes?: string | null
  badge?: string | null
  dimensionsLabel?: string | null
  whatsappHref?: string | null
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

export function ProductsCatalog({ products, categories, copy, calmMode, initialFilters }: Props) {
  const router = useRouter()
  const perPage = Math.min(48, Math.max(1, copy.perPage || 15))
  const filterTitleId = useId()

  const [filters, setFilters] = useState<CatalogFilterState>(initialFilters)
  const [search, setSearch] = useState(initialFilters.q)
  const [filtersOpen, setFiltersOpen] = useState(false)

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
  const filterSheetRef = useRef<HTMLElement>(null)
  const filterCloseRef = useRef<HTMLButtonElement>(null)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const filterLastFocusRef = useRef<HTMLElement | null>(null)
  const filterDragY = useRef<number | null>(null)
  const filterDragDist = useRef(0)

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
            <label className="pc-category-filter">
              <span>Category</span>
              <select
                className="pc-ctl"
                aria-label="Choose a product category"
                value={filters.categories.length > 1 ? '__multiple__' : filters.categories[0] || ''}
                onChange={(event) => updateFilters({ categories: event.target.value ? [event.target.value] : [] })}
              >
                <option value="">All categories</option>
                {filters.categories.length > 1 && <option value="__multiple__" disabled>Multiple categories selected</option>}
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value} disabled={!category.count && !filters.categories.includes(category.value)}>
                    {category.label} ({category.count})
                  </option>
                ))}
              </select>
            </label>
            <label className="pc-sort">
              <span>Sort</span>
              <select className="pc-ctl" aria-label="Sort products" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as CatalogSort })}>
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
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
                  <Link
                    className={`pc-media${product.images.length > 1 ? '' : ' single'}`}
                    href={`/products/${product.slug}`}
                    aria-label={`View ${product.title}`}
                    scroll={false}
                    prefetch
                    onPointerDown={() => router.prefetch(`/products/${product.slug}`)}
                    onTouchStart={() => router.prefetch(`/products/${product.slug}`)}
                  >
                    {product.images[0] ? (
                      <>
                        <Image className="a" src={product.images[0].url} alt={product.images[0].alt} fill sizes="(max-width: 860px) 50vw, (max-width: 1320px) 25vw, 300px" loading={index < 4 ? 'eager' : 'lazy'} unoptimized={!product.images[0].url.startsWith('/')} />
                        {product.images[1] && <Image className="b" src={product.images[1].url} alt="" aria-hidden fill sizes="(max-width: 860px) 50vw, (max-width: 1320px) 25vw, 300px" loading="lazy" unoptimized={!product.images[1].url.startsWith('/')} />}
                      </>
                    ) : (
                      <span className="pc-fallback"><ProductRender product={product.render} animate={false} buildKey={0} /></span>
                    )}
                  </Link>
                  <div className="pc-info">
                    <h2 className="pc-card-title">{product.title}</h2>
                    <div className="pc-foot">
                      <span className="pc-price">{product.priceLabel}</span>
                      <Link className="pc-view" href={`/products/${product.slug}`} scroll={false} prefetch onPointerDown={() => router.prefetch(`/products/${product.slug}`)} onTouchStart={() => router.prefetch(`/products/${product.slug}`)}>View</Link>
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
    </div>
  )
}
