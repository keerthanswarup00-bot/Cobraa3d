export type PushSetupOptions = {
  publicKey: string
  source: string
  isTest?: boolean
}

export function decodeVapidKey(value: string): Uint8Array {
  const padded = value + '='.repeat((4 - value.length % 4) % 4)
  const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string }
    return body.error || `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

export async function subscribeToPush({ publicKey, source, isTest = false }: PushSetupOptions): Promise<PushSubscription> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Push alerts are not supported by this browser.')
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'denied' : 'Notification permission was not granted.')

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(publicKey),
  })
  const serialized = subscription.toJSON()
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
    throw new Error('The browser returned an incomplete push subscription.')
  }
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: { endpoint: serialized.endpoint, keys: serialized.keys },
      source,
      isTest,
    }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return subscription
}

export async function unsubscribeFromPush(subscription: PushSubscription): Promise<void> {
  const response = await fetch('/api/push/unsubscribe', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })
  if (!response.ok) throw new Error(await readError(response))
  if (!await subscription.unsubscribe()) throw new Error('The browser did not remove its push subscription.')
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.getRegistration('/')
  return registration?.pushManager.getSubscription() || null
}

export async function sendPushBatches(notificationId: number | string, mode: 'test' | 'all', onProgress?: (sent: number, failed: number) => void) {
  let cursor: string | null = null
  let totalSent = 0
  let totalFailed = 0
  let done = false
  while (!done) {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, mode, cursor }),
    })
    if (!response.ok) throw new Error(await readError(response))
    const result = await response.json() as { nextCursor: string | null; sent: number; failed: number; done: boolean }
    cursor = result.nextCursor
    totalSent += result.sent
    totalFailed += result.failed
    done = result.done
    onProgress?.(totalSent, totalFailed)
  }
  return { sent: totalSent, failed: totalFailed }
}
