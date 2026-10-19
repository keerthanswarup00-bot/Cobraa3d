'use client'

import { useFormFields } from '@payloadcms/ui'
import { buildWhatsAppUrl } from '@/lib/shared'

function externalURL(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null } catch { return null }
}

export function SettingsLinkTests() {
  const fields = useFormFields(([allFields]) => allFields)
  const number = fields.whatsappNumber?.value
  const maps = externalURL(fields.mapsUrl?.value)
  const whatsapp = buildWhatsAppUrl({ number: typeof number === 'string' ? number : null, message: 'WhatsApp link test from Cobraa 3D admin.' })
  const social = Object.entries(fields).filter(([path, field]) => /^socialLinks\.\d+\.url$/.test(path) && typeof field.value === 'string' && field.value.trim())
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBlock: 12 }}>
    {whatsapp && <a className="btn btn--style-secondary" href={whatsapp} target="_blank" rel="noopener noreferrer">Test WhatsApp number</a>}
    {maps && <a className="btn btn--style-secondary" href={maps} target="_blank" rel="noopener noreferrer">Test maps link</a>}
    {social.map(([path, field]) => { const url = externalURL(field.value); return url ? <a className="btn btn--style-secondary" key={path} href={url} target="_blank" rel="noopener noreferrer">Test social link {Number(path.match(/\d+/)?.[0] || 0) + 1}</a> : null })}
  </div>
}
