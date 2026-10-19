import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { formatPrice } from '@/lib/shared'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const payload = await getPayload({ config })
  const [{ docs: products }, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, sort: 'title', depth: 0, limit: 100 }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])

  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 sm:py-24">
    <Link className="text-sm text-neutral-500 underline-offset-4 hover:underline" href="/">{settings.brandName}</Link>
    <h1 className="mt-8 text-4xl font-medium tracking-tight text-neutral-950">Products</h1>
    <p className="mt-3 max-w-xl text-neutral-600">Explore the products in this catalogue.</p>
    {products.length ? <ul className="mt-10 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
      {products.map((product) => <li className="bg-white" key={product.id}>
        <Link className="block min-h-36 p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]" href={`/products/${product.slug}`}>
          <h2 className="text-lg font-medium text-neutral-950">{product.title}</h2>
          {product.shortDescription && <p className="mt-2 text-sm leading-6 text-neutral-600">{product.shortDescription}</p>}
          <p className="mt-4 text-sm text-neutral-700">{formatPrice(product.price, product.priceMode)}</p>
        </Link>
      </li>)}
    </ul> : <p className="mt-10 border border-neutral-200 p-6 text-sm text-neutral-600">No published products are available yet.</p>}
  </main>
}
