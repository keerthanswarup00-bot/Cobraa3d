import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import type { Media } from '@/payload-types'
export const metadata: Metadata = { title: 'About & Location', alternates: { canonical: '/location' } }
const richText = (value: unknown): string => { if (!value || typeof value !== 'object') return ''; const node = value as { text?: string; children?: unknown[] }; return [node.text || '', ...(node.children || []).map(richText)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() }
export default async function LocationPage() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 2 })
  const photos = (settings.studioPhotos || []).map((value) => typeof value === 'object' ? value as Media : null).filter((value): value is Media => Boolean(value?.url))
  return <main className="store-page location-page"><p className="section-eyebrow">THE STUDIO</p><h1>{settings.brandName || 'Cobraa 3D'}</h1>{richText(settings.brandStory) && <p>{richText(settings.brandStory)}</p>}<address>{settings.showFullAddress && settings.address ? settings.address : 'Hoskote, Bengaluru'}{settings.openingHours && <><br />{settings.openingHours}</>}</address><div className="route-actions">{settings.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer">Open directions</a>}{settings.phone && <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`}>Call</a>}{settings.email && <a href={`mailto:${settings.email}`}>Email</a>}{settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}</div>{photos.length > 0 && <div className="location-route-photos">{photos.map((photo) => <Image key={photo.id} src={photo.url!} alt={photo.alt || ''} width={600} height={450} />)}</div>}</main>
}
