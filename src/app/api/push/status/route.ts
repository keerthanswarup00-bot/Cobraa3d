import { getPayload } from 'payload'
import config from '@payload-config'
import { env } from '@/lib/env'
import { sameOriginRequest } from '@/lib/pushServer'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: 'Same-origin request required.' }, { status: 403 })
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !['admin', 'editor'].includes((user as { role?: string }).role || '')) {
    return Response.json({ error: 'Admin or editor access required.' }, { status: 403 })
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [subscribers, tests, recentSends] = await Promise.all([
    payload.find({ collection: 'push-subscriptions', where: { and: [{ active: { equals: true } }, { isTest: { equals: false } }] }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'push-subscriptions', where: { and: [{ active: { equals: true } }, { isTest: { equals: true } }] }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'push-notifications', where: { and: [{ status: { in: ['sending', 'sent'] } }, { sentAt: { greater_than_equal: since } }] }, limit: 0, overrideAccess: true }),
  ])
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.VAPID_PUBLIC_KEY
  return Response.json({
    subscriberCount: subscribers.totalDocs,
    testSubscriberCount: tests.totalDocs,
    sendsRemaining: Math.max(0, 2 - recentSends.totalDocs),
    configured: Boolean(publicKey && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT),
    publicKey: publicKey || null,
  })
}
