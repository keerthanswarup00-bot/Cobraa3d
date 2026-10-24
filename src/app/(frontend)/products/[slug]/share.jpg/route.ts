import { getPayload } from 'payload'
import config from '@payload-config'
import { composeShareImage } from '@/lib/shareImage'
import { getServerSideURL } from '@/utilities/getURL'

export const runtime = 'nodejs'

// The preview image for /products/[slug]: the product's first photo on a clean 1200x630 JPEG.
// Linked from the product page's og:image, with ?v=<updatedAt> so editing a product refreshes shared previews.
const MAX_SOURCE_BYTES = 15 * 1024 * 1024

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const siteURL = getServerSideURL()
  const fallback = () => Response.redirect(new URL('/share-default.jpg', siteURL), 307)
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'products',
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }, { _status: { equals: 'published' } }, { isDemo: { not_equals: true } }] },
      limit: 1,
      depth: 1,
    })
    const image = docs[0]?.images?.[0]?.image
    if (typeof image !== 'object' || !image?.url) return fallback()
    const response = await fetch(new URL(image.url, siteURL), { signal: AbortSignal.timeout(8000) })
    if (!response.ok) return fallback()
    const source = Buffer.from(await response.arrayBuffer())
    if (source.length > MAX_SOURCE_BYTES) return fallback()
    const jpeg = await composeShareImage(source)
    return new Response(new Uint8Array(jpeg), {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch {
    return fallback()
  }
}
