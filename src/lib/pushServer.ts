import { env } from '@/lib/env'

const allowedExactHosts = new Set([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
])

export function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
    return allowedExactHosts.has(hostname)
      || (hostname.endsWith('.notify.windows.com') && hostname !== 'notify.windows.com')
      || (hostname.endsWith('.push.apple.com') && hostname !== 'push.apple.com')
  } catch {
    return false
  }
}

export function isSafePushURL(value: string, requestOrigin?: string): boolean {
  if (!value || value.startsWith('//') || value.includes('\\')) return false
  try {
    const base = requestOrigin || env.NEXT_PUBLIC_SITE_URL || 'https://cobraa.invalid'
    const url = new URL(value, base)
    if (url.username || url.password || !['http:', 'https:'].includes(url.protocol)) return false
    if (value.startsWith('/')) return url.origin === new URL(base).origin
    return url.origin === new URL(base).origin
  } catch {
    return false
  }
}

export function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false

  const allowedOrigins = new Set<string>()
  try {
    if (env.NEXT_PUBLIC_SITE_URL) allowedOrigins.add(new URL(env.NEXT_PUBLIC_SITE_URL).origin)
    if (process.env.VERCEL_URL) {
      const deploymentURL = process.env.VERCEL_URL.startsWith('http')
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`
      allowedOrigins.add(new URL(deploymentURL).origin)
    }
    if (allowedOrigins.size === 0) allowedOrigins.add(new URL(request.url).origin)
    return allowedOrigins.has(new URL(origin).origin)
  } catch {
    return false
  }
}

export async function readCappedJSON(request: Request, maxBytes = 4096): Promise<unknown | null> {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    return null
  }
}
