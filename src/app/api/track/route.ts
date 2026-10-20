import { getPayload } from 'payload'
import config from '@payload-config'
import { env } from '@/lib/env'
import { consumeRateLimit, getClientIP } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin')
    const allowedOrigins = new Set<string>()
    if (env.NEXT_PUBLIC_SITE_URL) allowedOrigins.add(new URL(env.NEXT_PUBLIC_SITE_URL).origin)
    if (process.env.VERCEL_URL) {
      const deploymentURL = process.env.VERCEL_URL.startsWith('http')
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`
      allowedOrigins.add(new URL(deploymentURL).origin)
    }
    if (allowedOrigins.size === 0) allowedOrigins.add(new URL(req.url).origin)
    let requestOrigin: string
    try {
      requestOrigin = origin ? new URL(origin).origin : ''
    } catch {
      requestOrigin = ''
    }
    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      return new Response(null, { status: 400 })
    }

    const ip = getClientIP(req)
    if (!ip) return new Response(null, { status: 400 })
    const payload = await getPayload({ config })
    if (await consumeRateLimit(payload, { namespace: 'track', ip, limit: 30, windowMs: 60_000 })) {
      return new Response(null, { status: 429 })
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
      await payload.create({ collection: 'whatsapp-clicks' as any, data: { slug, source } as any, overrideAccess: true })
    }
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 204 })
  }
}
