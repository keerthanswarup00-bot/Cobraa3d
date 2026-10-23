import { describe, expect, it } from 'vitest'
import { isAllowedPushEndpoint, isSafePushURL, readCappedJSON } from '@/lib/pushServer'

describe('push security validation', () => {
  it('accepts only HTTPS endpoints on approved push-service hosts', () => {
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/token')).toBe(true)
    expect(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/token')).toBe(true)
    expect(isAllowedPushEndpoint('https://tenant.notify.windows.com/wpush/token')).toBe(true)
    expect(isAllowedPushEndpoint('https://web.push.apple.com/QWERTY')).toBe(true)
    expect(isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/token')).toBe(false)
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com.attacker.test/token')).toBe(false)
    expect(isAllowedPushEndpoint('https://tenant.notify.windows.com.attacker.test/token')).toBe(false)
    expect(isAllowedPushEndpoint('https://localhost/token')).toBe(false)
  })

  it('allows relative and same-origin notification URLs only', () => {
    const origin = 'https://cobraa.example'
    expect(isSafePushURL('/', origin)).toBe(true)
    expect(isSafePushURL('/products/desk?src=push', origin)).toBe(true)
    expect(isSafePushURL('https://cobraa.example/offers', origin)).toBe(true)
    expect(isSafePushURL('//attacker.example/path', origin)).toBe(false)
    expect(isSafePushURL('https://attacker.example/path', origin)).toBe(false)
    expect(isSafePushURL('javascript:alert(1)', origin)).toBe(false)
  })

  it('rejects request bodies above the configured cap', async () => {
    const oversized = new Request('https://site.example/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ payload: 'x'.repeat(100) }),
    })
    expect(await readCappedJSON(oversized, 32)).toBeNull()

    const valid = new Request('https://site.example/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ ok: true }),
    })
    expect(await readCappedJSON(valid, 32)).toEqual({ ok: true })
  })
})
