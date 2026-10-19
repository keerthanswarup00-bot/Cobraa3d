import { describe, expect, it } from 'vitest'
import { filterAndSortProducts } from '@/lib/productListing'

const products = [
  { title: 'Desk stand', shortDescription: 'Custom desk holder', price: 20, priceMode: 'show', featured: false, publishedAt: '2026-01-01', seasonalTags: [{ tag: 'office' }] },
  { title: 'Festive star', shortDescription: 'Decor piece', price: 10, priceMode: 'show', featured: true, publishedAt: '2026-02-01', seasonalTags: [{ tag: 'festive' }] },
  { title: 'Ask item', priceMode: 'ask', featured: false, publishedAt: '2025-01-01' },
]

describe('filterAndSortProducts', () => {
  it('searches product title, description and tags', () => {
    expect(filterAndSortProducts(products, 'office', 'featured').map((p) => p.title)).toEqual(['Desk stand'])
    expect(filterAndSortProducts(products, 'FESTIVE', 'featured').map((p) => p.title)).toEqual(['Festive star'])
  })
  it('sorts featured, newest and visible prices', () => {
    expect(filterAndSortProducts(products, '', 'featured')[0].title).toBe('Festive star')
    expect(filterAndSortProducts(products, '', 'newest')[0].title).toBe('Festive star')
    expect(filterAndSortProducts(products, '', 'price-asc').map((p) => p.title)).toEqual(['Festive star', 'Desk stand', 'Ask item'])
    expect(filterAndSortProducts(products, '', 'price-desc')[0].title).toBe('Desk stand')
    expect(filterAndSortProducts(products, '', 'name-asc').map((p) => p.title)).toEqual(['Ask item', 'Desk stand', 'Festive star'])
  })
})
