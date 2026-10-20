import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { Offers } from '@/collections/Offers'
import { Announcements } from '@/collections/Announcements'
import { EnquiryFiles } from '@/collections/EnquiryFiles'
import { consumeRateLimit, getClientIP } from '@/lib/rateLimit'

describe('public access controls', () => {
  it('filters inactive and out-of-window promotions from anonymous API reads', async () => {
    for (const collection of [Offers, Announcements]) {
      const access = collection.access?.read
      expect(typeof access).toBe('function')
      const where = await (access as (args: unknown) => unknown)({ req: { user: null } }) as any
      expect(where.and).toContainEqual({ active: { equals: true } })
      expect(where.and).toContainEqual({ or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: expect.any(String) } }] })
      expect(where.and).toContainEqual({ or: [{ endsAt: { exists: false } }, { endsAt: { greater_than_equal: expect.any(String) } }] })
    }
  })

  it('does not allow public reads or downloads of enquiry attachments', async () => {
    const read = EnquiryFiles.access?.read
    expect(typeof read).toBe('function')
    expect(await (read as (args: unknown) => unknown)({ req: { user: null } })).toBe(false)
    expect(await (read as (args: unknown) => unknown)({ req: { user: { role: 'editor' } } })).toBe(true)
  })
})

describe('shared rate limiting', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('uses the platform client IP on Vercel instead of caller-controlled forwarding headers', () => {
    vi.stubEnv('VERCEL', '1')
    expect(getClientIP(new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.44', 'x-vercel-forwarded-for': '198.51.100.20, 10.0.0.1' },
    }))).toBe('198.51.100.20')
    expect(getClientIP(new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.44' },
    }))).toBeNull()
  })

  it('shares a request window across separate function instances using the backing store', async () => {
    let sharedCount = 0
    const makePayloadInstance = () => {
      let statement = 0
      return { db: { drizzle: { execute: vi.fn(async () => {
        statement += 1
        return statement % 2 === 0 ? { rows: [{ count: ++sharedCount }] } : { rows: [] }
      }) } } } as unknown as Payload
    }
    const request = { namespace: 'track-test', ip: '198.51.100.77', limit: 1, windowMs: 60_000 }

    expect(await consumeRateLimit(makePayloadInstance(), request)).toBe(false)
    expect(await consumeRateLimit(makePayloadInstance(), request)).toBe(true)
  })
})
