export type ListingProduct = {
  title: string
  shortDescription?: string | null
  seasonalTags?: Array<{ tag?: string | null }> | null
  featured?: boolean | null
  publishedAt?: string | null
  price?: number | null
  priceMode?: string | null
}

export type ProductSort = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

export function filterAndSortProducts<T extends ListingProduct>(products: T[], query: string, sort: ProductSort): T[] {
  const needle = query.trim().toLocaleLowerCase()
  const filtered = needle ? products.filter((product) => [product.title, product.shortDescription || '', ...(product.seasonalTags || []).map((tag) => tag.tag || '')]
    .join(' ').toLocaleLowerCase().includes(needle)) : [...products]
  return filtered.sort((a, b) => {
    if (sort === 'featured') return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.title.localeCompare(b.title)
    if (sort === 'newest') return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    if (sort === 'name-asc') return a.title.localeCompare(b.title)
    const hasA = a.priceMode === 'show' && typeof a.price === 'number'
    const hasB = b.priceMode === 'show' && typeof b.price === 'number'
    if (hasA !== hasB) return hasA ? -1 : 1
    if (!hasA || !hasB) return a.title.localeCompare(b.title)
    return sort === 'price-asc' ? a.price! - b.price! : b.price! - a.price!
  })
}
