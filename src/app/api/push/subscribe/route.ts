import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { consumeRateLimit, getClientIP } from '@/lib/rateLimit'
import { isAllowedPushEndpoint, readCappedJSON, sameOriginRequest } from '@/lib/pushServer'

export const dynamic = 'force-dynamic'

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048).refine(isAllowedPushEndpoint, 'Push endpoint host is not supported.'),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }).strict(),
  expirationTime: z.number().nullable().optional(),
}).strict()

const bodySchema = z.object({
  subscription: subscriptionSchema,
  source: z.string().trim().min(1).max(40).default('storefront'),
  isTest: z.boolean().default(false),
}).strict()

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: 'Same-origin request required.' }, { status: 403 })
  const ip = getClientIP(request)
  if (!ip) return Response.json({ error: 'Client address unavailable.' }, { status: 400 })
  const payload = await getPayload({ config })
  if (await consumeRateLimit(payload, { namespace: 'push-subscribe', ip, limit: 10, windowMs: 60_000 })) {
    return Response.json({ error: 'Too many subscription requests. Try again shortly.' }, { status: 429 })
  }

  const raw = await readCappedJSON(request)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return Response.json({ error: 'Invalid push subscription.' }, { status: 400 })
  if (parsed.data.isTest) {
    const { user } = await payload.auth({ headers: request.headers })
    if (!user || !['admin', 'editor'].includes((user as { role?: string }).role || '')) {
      return Response.json({ error: 'Admin or editor access required for test subscriptions.' }, { status: 403 })
    }
  }

  const { subscription, source, isTest } = parsed.data
  const existing = await payload.find({
    collection: 'push-subscriptions',
    where: { endpoint: { equals: subscription.endpoint } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const data = {
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: (request.headers.get('user-agent') || '').slice(0, 200),
    source,
    isTest,
    active: true,
    lastError: null,
  }

  if (existing.docs[0]) {
    await payload.update({ collection: 'push-subscriptions', id: existing.docs[0].id, data, overrideAccess: true })
  } else {
    await payload.create({ collection: 'push-subscriptions', data, overrideAccess: true })
  }

  return Response.json({ subscribed: true })
}
