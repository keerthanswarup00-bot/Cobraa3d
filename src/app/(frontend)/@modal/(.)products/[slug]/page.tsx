// src/app/(frontend)/@modal/(.)products/[slug]/page.tsx
// Intercepts soft navigations to /products/[slug]. Hard loads still hit the real page (SEO, WhatsApp previews).
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { getServerSideURL } from '@/utilities/getURL'
import { buildProductPreview } from '@/lib/productPreview'
import type { Product } from '@/payload-types'
import { ProductPreviewRoute } from './ProductPreviewRoute'

async function getProductBySlug(slug: string) {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'products',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
        { _status: { equals: 'published' } },
      ],
    },
    depth: 1,
    limit: 1,
  })
  return res.docs[0] as Product | undefined
}

export default async function ProductSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSiteSettings()])
  if (!product) notFound()

  const productSlug = product.slug || slug
  const preview = buildProductPreview({
    product,
    slug: productSlug,
    siteURL: getServerSideURL(),
    whatsappNumber: settings.whatsappNumber,
    productTemplate: settings.messageTemplates?.product,
  })
  if (!preview) notFound()

  return <ProductPreviewRoute preview={preview} />
}
