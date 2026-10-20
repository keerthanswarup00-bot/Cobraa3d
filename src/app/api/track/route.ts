import { getPayload } from 'payload'
import config from '@payload-config'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin')
    const site = env.NEXT_PUBLIC_SITE_URL
    if (site && origin && !origin.startsWith(site)) {
      return new Response(null, { status: 400 })
    }

    let body: any
    try {
      const text = await req.text()
      if (text.length > 1024) return new Response(null, { status: 400 })
      body = JSON.parse(text)
    } catch {
      try {
        body = await req.json()
      } catch {
        return new Response(null, { status: 400 })
      }
    }

    if (body && typeof body === 'object') {
      const slug = typeof body.slug === 'string' && body.slug.length <= 80 ? body.slug : undefined
      const source = typeof body.source === 'string' && body.source.length <= 40 ? body.source : undefined
      if (!slug && !source) {
        return new Response(null, { status: 400 })
      }
      const payload = await getPayload({ config })
      await payload.create({ collection: 'whatsapp-clicks' as any, data: { slug, source } as any, overrideAccess: true })
    }
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 204 })
  }
}
