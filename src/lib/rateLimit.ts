import { createHmac } from 'node:crypto'
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { env } from '@/lib/env'

const RETAIN_MS = 24 * 60 * 60 * 1000

/** On Vercel, use its overwritten, trusted client-IP header. Locally, use the
 * dev server's forwarded header when present, then a single local bucket. */
export function getClientIP(request: Request): string | null {
  if (process.env.VERCEL === '1') {
    return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')?.trim()
      || null
  }

  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

/** Atomically consume one request from a fixed-window counter in the shared
 * Payload database. HMAC keeps raw client IPs out of stored limiter keys. */
export async function consumeRateLimit(
  payload: Payload,
  input: { namespace: string; ip: string; limit: number; windowMs: number },
): Promise<boolean> {
  const key = createHmac('sha256', env.PAYLOAD_SECRET)
    .update(`${input.namespace}:${input.ip}`)
    .digest('hex')
  const now = Date.now()

  await payload.db.drizzle.execute(sql`
    DELETE FROM "request_rate_limits"
    WHERE "window_start" <= ${now - RETAIN_MS} AND "key" <> ${key}
  `)

  const result = await payload.db.drizzle.execute(sql`
    INSERT INTO "request_rate_limits" ("key", "window_start", "count")
    VALUES (${key}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "window_start" = CASE
        WHEN "request_rate_limits"."window_start" <= ${now - input.windowMs}
        THEN ${now}
        ELSE "request_rate_limits"."window_start"
      END,
      "count" = CASE
        WHEN "request_rate_limits"."window_start" <= ${now - input.windowMs}
        THEN 1
        ELSE "request_rate_limits"."count" + 1
      END
    RETURNING "count"
  `)

  const rows = (result as unknown as { rows?: Array<{ count: number | string }> }).rows
  if (!rows?.length) throw new Error('Rate limit counter did not return a count.')
  return Number(rows[0]!.count) > input.limit
}
