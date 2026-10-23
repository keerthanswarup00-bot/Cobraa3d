import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'
import { consumeRateLimit, getClientIP } from '@/lib/rateLimit'
import { isAllowedPushEndpoint, readCappedJSON, sameOriginRequest } from '@/lib/pushServer'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  endpoint: z.string().url().max(2048).refine(isAllowedPushEndpoint, 'Push endpoint host is not supported.'),
}).strict()

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: 'Same-origin request required.' }, { status: 403 })
  const ip = getClientIP(request)
  if (!ip) return Response.json({ error: 'Client address unavailable.' }, { status: 400 })
  const payload = await getPayload({ config })
  if (await consumeRateLimit(payload, { namespace: 'push-unsubscribe', ip, limit: 10, windowMs: 60_000 })) {
    return Response.json({ error: 'Too many unsubscribe requests. Try again shortly.' }, { status: 429 })
  }
  const parsed = bodySchema.safeParse(await readCappedJSON(request))
  if (!parsed.success) return Response.json({ error: 'Invalid push endpoint.' }, { status: 400 })

  const existing = await payload.find({
    collection: 'push-subscriptions',
    where: { endpoint: { equals: parsed.data.endpoint } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.update({ collection: 'push-subscriptions', id: existing.docs[0].id, data: { active: false }, overrideAccess: true })
  }
  return Response.json({ unsubscribed: true })
}
