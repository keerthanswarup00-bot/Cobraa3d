import { z } from 'zod'
import webPush from 'web-push'
import { getPayload } from 'payload'
import config from '@payload-config'
import { env } from '@/lib/env'
import { readCappedJSON, sameOriginRequest } from '@/lib/pushServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  notificationId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).max(40)]),
  mode: z.enum(['test', 'all']),
  cursor: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).nullable().optional(),
}).strict()

function publicKey() {
  return env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.VAPID_PUBLIC_KEY
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: 'Same-origin request required.' }, { status: 403 })
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !['admin', 'editor'].includes((user as { role?: string }).role || '')) {
    return Response.json({ error: 'Admin or editor access required.' }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await readCappedJSON(request))
  if (!parsed.success) return Response.json({ error: 'Invalid push send request.' }, { status: 400 })

  const vapidPublicKey = publicKey()
  if (!vapidPublicKey || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    return Response.json({ error: 'Push is not configured. Add the VAPID keys and subject to the server environment.' }, { status: 503 })
  }

  const { notificationId, mode } = parsed.data
  const clientCursor = parsed.data.cursor == null ? null : Number(parsed.data.cursor)
  const notificationResult = await payload.find({
    collection: 'push-notifications',
    where: { id: { equals: notificationId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const notification = notificationResult.docs[0]
  if (!notification) return Response.json({ error: 'Notification not found.' }, { status: 404 })
  if (!notification.title || !notification.body) return Response.json({ error: 'Add a title and body before sending.' }, { status: 400 })

  if (mode === 'all' && notification.status === 'sent') {
    return Response.json({ nextCursor: notification.lastCursor || null, sent: 0, failed: 0, done: true })
  }
  if (mode === 'test' && notification.status === 'sent') {
    return Response.json({ error: 'Sent notifications are read-only. Create a new notification to test another message.' }, { status: 409 })
  }

  if (mode === 'all' && notification.status !== 'sending') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recentSends = await payload.find({
      collection: 'push-notifications',
      where: { and: [{ status: { in: ['sent', 'sending'] } }, { sentAt: { greater_than_equal: since } }] },
      limit: 0,
      overrideAccess: true,
    })
    if (recentSends.totalDocs >= 2) {
      return Response.json({ error: 'The limit of two broadcasts in a rolling 24-hour period has been reached.' }, { status: 429 })
    }
    await payload.update({
      collection: 'push-notifications',
      id: notification.id,
      data: { status: 'sending', sentAt: new Date().toISOString(), sentCount: 0, failedCount: 0, lastCursor: null },
      overrideAccess: true,
    })
  }

  const configuredOrigin = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  let targetURL: URL
  try {
    targetURL = new URL(notification.url || '/', configuredOrigin)
  } catch {
    return Response.json({ error: 'The notification URL is invalid.' }, { status: 400 })
  }
  if (targetURL.origin !== new URL(configuredOrigin).origin || !['http:', 'https:'].includes(targetURL.protocol)) {
    return Response.json({ error: 'Notification URL must be relative or same-origin.' }, { status: 400 })
  }

  webPush.setVapidDetails(env.VAPID_SUBJECT, vapidPublicKey, env.VAPID_PRIVATE_KEY)
  const persistedCursor = mode === 'all' && notification.lastCursor ? Number(notification.lastCursor) : null
  let cursor = Math.max(clientCursor || 0, persistedCursor || 0) || null
  const result = await payload.find({
    collection: 'push-subscriptions',
    where: {
      and: [
        { active: { equals: true } },
        { isTest: { equals: mode === 'test' } },
        ...(cursor ? [{ id: { greater_than: cursor } }] : []),
      ],
    },
    sort: 'id',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  let sent = 0
  let failed = 0
  let persistedSent = notification.sentCount || 0
  let persistedFailed = notification.failedCount || 0
  for (let start = 0; start < result.docs.length; start += 10) {
    const batch = result.docs.slice(start, start + 10)
    const outcomes = await Promise.all(batch.map(async (subscription) => {
      try {
        await webPush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: '/icons/icon-192.png',
          data: { url: targetURL.pathname + targetURL.search + targetURL.hash },
        }))
        await payload.update({ collection: 'push-subscriptions', id: subscription.id, data: { lastError: null }, overrideAccess: true })
        return { sent: true }
      } catch (error) {
        const errorStatus = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : undefined
        const gone = errorStatus === 404 || errorStatus === 410
        await payload.update({
          collection: 'push-subscriptions',
          id: subscription.id,
          data: { ...(gone ? { active: false } : {}), lastError: gone ? 'Push subscription expired or was removed.' : `Push delivery failed${errorStatus ? ` (HTTP ${errorStatus})` : ''}.` },
          overrideAccess: true,
        })
        return { sent: false }
      }
    }))
    sent += outcomes.filter((outcome) => outcome.sent).length
    failed += outcomes.length - outcomes.filter((outcome) => outcome.sent).length
    cursor = Number(batch[batch.length - 1]!.id)
    if (mode === 'all') {
      const batchSent = outcomes.filter((outcome) => outcome.sent).length
      const batchFailed = outcomes.length - batchSent
      persistedSent += batchSent
      persistedFailed += batchFailed
      await payload.update({
        collection: 'push-notifications',
        id: notification.id,
        data: { lastCursor: String(cursor), sentCount: persistedSent, failedCount: persistedFailed },
        overrideAccess: true,
      })
    }
  }

  const done = result.docs.length < 100
  if (done && mode === 'all') {
    await payload.update({ collection: 'push-notifications', id: notification.id, data: { status: 'sent' }, overrideAccess: true })
  }
  if (done && mode === 'test') {
    await payload.update({ collection: 'push-notifications', id: notification.id, data: { testSentAt: new Date().toISOString() }, overrideAccess: true })
  }

  return Response.json({ nextCursor: cursor == null ? null : String(cursor), sent, failed, done })
}
