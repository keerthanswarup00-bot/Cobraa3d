import { ProductGrid } from '@/components/product/ProductGrid'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'
import { buildProductMessage, buildWhatsAppUrl } from '@/lib/shared'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Products',
  alternates: { canonical: '/products' },
}

export default async function ProductsPage() {
  const payload = await getPayload({ config })
  const [{ docs: rawProducts }, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, sort: 'sortOrder,title', depth: 1, limit: 100 }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])
  const products = rawProducts.filter((p: any) => process.env.NODE_ENV !== 'production' || !p.isDemo)
  return (
    <main className="pg-wrap">
      <h1 className="pg-title">Products</h1>
      <ProductGrid
        products={products.map((p: any) => ({
          slug: p.slug,
          name: p.title,
          priceLabel: (p.priceMode === 'show' && p.price != null) ? `${p.currency || 'INR'} ${p.price}` : 'Ask for price',
          image: p.images?.[0]?.image && typeof p.images[0].image === 'object' ? { url: p.images[0].image.url, alt: p.images[0].alt } : undefined,
        }))}
      />
    </main>
  )
}
