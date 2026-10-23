export const PRICE_BUCKETS = [
  { id: 'under-500', label: 'Under ₹500' },
  { id: '500-999', label: '₹500 – ₹999' },
  { id: '1000-1999', label: '₹1,000 – ₹1,999' },
  { id: '2000-plus', label: '₹2,000 and above' },
  { id: 'ask', label: 'Ask for price' },
] as const

export const OPTION_FILTERS = [
  { id: 'personalisable', label: 'Personalisable' },
  { id: 'featured', label: 'Featured' },
  { id: 'in-stock', label: 'In stock' },
  { id: 'new', label: 'New' },
] as const

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
] as const

export type PriceBucketId = (typeof PRICE_BUCKETS)[number]['id']
export type OptionFilterId = (typeof OPTION_FILTERS)[number]['id']
export type CatalogSort = (typeof SORT_OPTIONS)[number]['value']

export type CatalogFilterState = {
  q: string
  categories: string[]
  materials: string[]
  colours: string[]
  prices: PriceBucketId[]
  options: OptionFilterId[]
  sort: CatalogSort
  page: number
}

export type FilterableCatalogProduct = {
  title: string
  categorySlug: string | null
  materialSlug: string | null
  colourSlugs: string[]
  hasPrice: boolean
  price: number | null
  personalisable: boolean
  featured: boolean
  availability: string | null
  newArrival: boolean
  searchText: string
}

type SearchParams = Record<string, string | string[] | undefined>
type IgnoreFacet = 'categories' | 'materials' | 'colours' | 'prices' | 'options'

export const EMPTY_FILTERS: CatalogFilterState = {
  q: '',
  categories: [],
  materials: [],
  colours: [],
  prices: [],
  options: [],
  sort: 'newest',
  page: 1,
}

const PRICE_IDS = new Set<string>(PRICE_BUCKETS.map((bucket) => bucket.id))
const OPTION_IDS = new Set<string>(OPTION_FILTERS.map((option) => option.id))
const SORT_ALIASES: Record<string, CatalogSort> = {
  newest: 'newest',
  new: 'newest',
  'price-asc': 'price-asc',
  plow: 'price-asc',
  'price-desc': 'price-desc',
  phigh: 'price-desc',
  'name-asc': 'name-asc',
  az: 'name-asc',
}

export function slugifyFilterValue(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function asArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value
  return typeof value === 'string' && value ? [value] : []
}

function uniqueValid(values: string[], allowed?: Set<string>): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value && (!allowed || allowed.has(value))))]
}

export function parseCatalogFilters(params: SearchParams = {}): CatalogFilterState {
  const pageValue = Number(typeof params.page === 'string' ? params.page : Number.NaN)
  return {
    q: typeof params.q === 'string' ? params.q.trim() : '',
    categories: uniqueValid(asArray(params.category).length ? asArray(params.category) : asArray(params.categories)),
    materials: uniqueValid(asArray(params.material).length ? asArray(params.material) : asArray(params.materials)),
    colours: uniqueValid(asArray(params.colour).length ? asArray(params.colour) : asArray(params.colours)),
    prices: uniqueValid(asArray(params.price).length ? asArray(params.price) : asArray(params.prices), PRICE_IDS) as PriceBucketId[],
    options: uniqueValid(asArray(params.option).length ? asArray(params.option) : asArray(params.options), OPTION_IDS) as OptionFilterId[],
    sort: SORT_ALIASES[typeof params.sort === 'string' ? params.sort : ''] || 'newest',
    page: Number.isFinite(pageValue) && pageValue > 1 ? Math.floor(pageValue) : 1,
  }
}

export function catalogFiltersToSearchParams(state: CatalogFilterState): URLSearchParams {
  const params = new URLSearchParams()
  const q = state.q.trim()
  if (q) params.set('q', q)
  state.categories.forEach((value) => params.append('category', value))
  state.materials.forEach((value) => params.append('material', value))
  state.colours.forEach((value) => params.append('colour', value))
  state.prices.forEach((value) => params.append('price', value))
  state.options.forEach((value) => params.append('option', value))
  if (state.sort !== 'newest') params.set('sort', state.sort)
  if (state.page > 1) params.set('page', String(state.page))
  return params
}

export function hasActiveCatalogFilters(state: CatalogFilterState): boolean {
  return Boolean(state.q || state.categories.length || state.materials.length || state.colours.length || state.prices.length || state.options.length)
}

export function countActiveCatalogFilters(state: CatalogFilterState): number {
  return state.categories.length + state.materials.length + state.colours.length + state.prices.length + state.options.length
}

export function priceBucketMatches(bucket: PriceBucketId, product: FilterableCatalogProduct): boolean {
  const price = product.price
  if (bucket === 'ask') return !product.hasPrice || price == null
  if (!product.hasPrice || price == null) return false
  if (bucket === 'under-500') return price < 500
  if (bucket === '500-999') return price >= 500 && price < 1000
  if (bucket === '1000-1999') return price >= 1000 && price < 2000
  return price >= 2000
}

function matchesOption(option: OptionFilterId, product: FilterableCatalogProduct): boolean {
  if (option === 'personalisable') return product.personalisable
  if (option === 'featured') return product.featured
  if (option === 'in-stock') return product.availability === 'in_stock'
  return product.newArrival
}

export function productMatchesCatalogFilters(
  product: FilterableCatalogProduct,
  state: CatalogFilterState,
  ignore?: IgnoreFacet,
): boolean {
  const terms = normalizeSearch(state.q).split(' ').filter(Boolean)
  if (terms.length && !terms.every((term) => product.searchText.includes(term))) return false
  if (ignore !== 'categories' && state.categories.length && !state.categories.includes(product.categorySlug || '')) return false
  if (ignore !== 'materials' && state.materials.length && !state.materials.includes(product.materialSlug || '')) return false
  if (ignore !== 'colours' && state.colours.length && !state.colours.some((colour) => product.colourSlugs.includes(colour))) return false
  if (ignore !== 'prices' && state.prices.length && !state.prices.some((bucket) => priceBucketMatches(bucket, product))) return false
  if (ignore !== 'options' && state.options.length && !state.options.every((option) => matchesOption(option, product))) return false
  return true
}

export function filterCatalogProducts<T extends FilterableCatalogProduct>(products: T[], state: CatalogFilterState): T[] {
  return products.filter((product) => productMatchesCatalogFilters(product, state))
}

export function sortCatalogProducts<T extends FilterableCatalogProduct>(products: T[], sort: CatalogSort): T[] {
  const indexed = products.map((product, index) => ({ product, index }))
  const priceAsc = (a: T, b: T) => {
    if (a.hasPrice && a.price != null && b.hasPrice && b.price != null) return a.price - b.price
    if (a.hasPrice && a.price != null) return -1
    if (b.hasPrice && b.price != null) return 1
    return 0
  }
  indexed.sort((a, b) => {
    if (sort === 'name-asc') return a.product.title.localeCompare(b.product.title) || a.index - b.index
    if (sort === 'price-asc') return priceAsc(a.product, b.product) || a.index - b.index
    if (sort === 'price-desc') {
      const bothPriced = a.product.hasPrice && a.product.price != null && b.product.hasPrice && b.product.price != null
      return (bothPriced ? (b.product.price as number) - (a.product.price as number) : priceAsc(a.product, b.product)) || a.index - b.index
    }
    return a.index - b.index
  })
  return indexed.map(({ product }) => product)
}

export type CatalogFacets = {
  categories: Map<string, number>
  materials: Map<string, number>
  colours: Map<string, number>
  prices: Map<PriceBucketId, number>
  options: Map<OptionFilterId, number>
}

export function buildCatalogFacets(products: FilterableCatalogProduct[], state: CatalogFilterState): CatalogFacets {
  const categories = new Map<string, number>()
  const materials = new Map<string, number>()
  const colours = new Map<string, number>()
  const prices = new Map<PriceBucketId, number>()
  const options = new Map<OptionFilterId, number>()

  products.forEach((product) => {
    if (productMatchesCatalogFilters(product, state, 'categories') && product.categorySlug) {
      categories.set(product.categorySlug, (categories.get(product.categorySlug) || 0) + 1)
    }
    if (productMatchesCatalogFilters(product, state, 'materials') && product.materialSlug) {
      materials.set(product.materialSlug, (materials.get(product.materialSlug) || 0) + 1)
    }
    if (productMatchesCatalogFilters(product, state, 'colours')) {
      product.colourSlugs.forEach((colour) => colours.set(colour, (colours.get(colour) || 0) + 1))
    }
    if (productMatchesCatalogFilters(product, state, 'prices')) {
      PRICE_BUCKETS.forEach((bucket) => {
        if (priceBucketMatches(bucket.id, product)) prices.set(bucket.id, (prices.get(bucket.id) || 0) + 1)
      })
    }
    if (productMatchesCatalogFilters(product, state, 'options')) {
      OPTION_FILTERS.forEach((option) => {
        if (matchesOption(option.id, product)) options.set(option.id, (options.get(option.id) || 0) + 1)
      })
    }
  })

  return { categories, materials, colours, prices, options }
}
