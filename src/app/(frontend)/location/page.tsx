import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import type { Media } from '@/payload-types'
import { buildWhatsAppUrl } from '@/lib/shared'
export const metadata: Metadata = { title: 'About Cobraa 3D | Hoskote, Bengaluru', description: 'Meet Cobraa 3D, a 3D printing studio in Hoskote, Bengaluru. Products are printed in PLA, hand finished and shipped across India.', alternates: { canonical: '/location' } }
const richText = (value: unknown): string => { if (!value || typeof value !== 'object') return ''; const node = value as { text?: string; children?: unknown[] }; return [node.text || '', ...(node.children || []).map(richText)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() }
export default async function LocationPage() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 2 })
  const photos = (settings.studioPhotos || []).map((value) => typeof value === 'object' ? value as Media : null).filter((value): value is Media => Boolean(value?.url))
  const phone = (settings.phone || settings.whatsappNumber || '').trim()
  const phoneHref = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : null
  const whatsappURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: `Hi ${settings.brandName || 'Cobraa 3D'}, I would like to know more about your products.` })
  const address = settings.showFullAddress && settings.address?.trim() ? settings.address.trim() : 'Hoskote, Bengaluru'
  const story = richText(settings.brandStory) || `${settings.brandName || 'Cobraa 3D'} is a 3D printing studio in Hoskote, Bengaluru. Products are printed in PLA and hand finished.`
  return <main className="store-page location-page">
    <p className="section-eyebrow">THE STUDIO</p>
    <h1>About {settings.brandName || 'Cobraa 3D'}</h1>
    <p>{story}</p>
    <h2>How we make our products</h2>
    <p>Each piece is 3D printed in PLA, then hand finished. We ship across India.</p>
    <address>{address}{settings.openingHours && <><br />{settings.openingHours}</>}</address>
    <div className="route-actions">
      {settings.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer">Open directions</a>}
      {phoneHref && <a href={phoneHref}>Call {phone}</a>}
      {whatsappURL && <a href={whatsappURL} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
      {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
      {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
    </div>
    {photos.length > 0 && <div className="location-route-photos">{photos.map((photo) => <Image key={photo.id} src={photo.url!} alt={photo.alt || 'Cobraa 3D studio'} width={600} height={450} />)}</div>}
  </main>
}
