'use client'
import { useMemo, useState } from 'react'
import { ProductsBrowser, type BrowserProduct } from '@/components/ProductsBrowser'

export function PaintingKitAudience({ products }: { products: BrowserProduct[] }) {
  const [audience, setAudience] = useState<'kids' | 'adults'>('kids')
  const selected = useMemo(() => products.filter((item) => audience === 'kids'
    ? /kids|children|kid|child/i.test(`${item.title} ${item.ageGroup || ''} ${item.category && typeof item.category === 'object' ? item.category.name : ''}`)
    : /adult/i.test(`${item.title} ${item.ageGroup || ''} ${item.category && typeof item.category === 'object' ? item.category.name : ''}`)), [products, audience])
  return <>
    <div className="kit-tabs" role="tablist" aria-label="Painting kit audience">
      <button role="tab" aria-selected={audience === 'kids'} onClick={() => setAudience('kids')}>Kids</button>
      <button role="tab" aria-selected={audience === 'adults'} onClick={() => setAudience('adults')}>Adults</button>
    </div>
    {selected.length ? <ProductsBrowser products={selected} categories={[]} /> : <section className="route-empty"><h2>{audience === 'kids' ? 'No kids’ painting kits listed yet' : 'No adult painting kits listed yet'}</h2><p>Ask the studio what can be made for you.</p></section>}
  </>
}
