import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildProductMessage, buildWhatsAppUrl, formatPrice } from '@/lib/shared'

export const dynamic = 'force-dynamic'

export const revalidate = 60

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const [result, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 1 }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])
  const product = result.docs[0]
  if (!product) notFound()
  const message = buildProductMessage(product, { baseURL: process.env.NEXT_PUBLIC_SERVER_URL }, settings)
  const enquiryURL = buildWhatsAppUrl({ message, number: settings.whatsappNumber })

  return <main className="mx-auto min-h-screen max-w-4xl px-6 py-12 sm:py-20">
    <Link className="inline-flex min-h-11 items-center text-sm text-neutral-500 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2" href="/products">← Products</Link>
    <article className="mt-10 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">{settings.brandName}</p>
      <h1 className="mt-4 text-4xl font-medium tracking-tight text-neutral-950 sm:text-6xl">{product.title}</h1>
      {product.shortDescription && <p className="mt-5 text-lg leading-8 text-neutral-600">{product.shortDescription}</p>}
      <p className="mt-8 text-base text-neutral-900">{formatPrice(product.price, product.priceMode)}</p>
      {enquiryURL && <a className="mt-8 inline-flex min-h-11 items-center rounded bg-neutral-950 px-5 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950" href={enquiryURL} rel="noreferrer" target="_blank">{settings.productEnquiryCtaLabel}</a>}
    </article>
  </main>
}
