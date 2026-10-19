import { getPayload, type PayloadRequest } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { CopyLinkButton } from './CopyLinkButton'
import { QRCodeDownloads } from './QRCodeDownloads'
import { FestiveModeButton } from './FestiveModeButton'
import { buildVCard, isActiveWithinWindow, type VCardSettings } from '@/lib/shared'
import React from 'react'

type Props = { req?: PayloadRequest }

const base = process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'http://localhost:3000'

export default async function BeforeDashboard({ req }: Props) {
  const payload = req?.payload || await getPayload({ config })
  const [enquiries, drafts, products, offers, festiveOffers, festiveAnnouncements, printBed, settings, legal] = await Promise.all([
    payload.find({ collection: 'enquiries', where: { status: { equals: 'new' } }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'products', where: { status: { equals: 'draft' } }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'products', limit: 1000, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'offers', where: { active: { equals: true } }, limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'offers', where: { and: [{ style: { equals: 'festive' } }, { active: { equals: true } }] }, limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'announcements', where: { and: [{ type: { equals: 'festive' } }, { active: { equals: true } }] }, limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'print-bed', where: { visible: { equals: true } }, limit: 1, depth: 0, overrideAccess: true }),
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }),
    payload.findGlobal({ slug: 'legal-pages', depth: 0, overrideAccess: true }),
  ])
  const missing = products.docs.filter((p) => !p.images?.length || p.images.some((i) => !i.alt?.trim())).length
  // Server-rendered attention count; time is intentionally evaluated once per dashboard request.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const soon = offers.docs.filter((offer) => offer.endsAt && new Date(offer.endsAt).getTime() >= now && new Date(offer.endsAt).getTime() <= now + 7 * 86400000).length
  const siteURL = base.startsWith('http') ? base : `https://${base}`
  const settingsData = settings as unknown as {
    whatsappNumber?: string | null; mapsUrl?: string | null; hero?: { featuredProducts?: unknown[] | null } | null
    ogImage?: unknown; vcard?: Omit<VCardSettings, 'photo'> & { photo?: string | { url?: string | null } | null } | null
  }
  const legalData = legal as { privacy?: { root?: { children?: unknown[] } } | null }
  const vcard = settingsData.vcard || {}
  const photoValue: unknown = vcard.photo
  const photoURL = typeof photoValue === 'object' && photoValue !== null && 'url' in photoValue && typeof photoValue.url === 'string' ? photoValue.url : typeof photoValue === 'string' ? photoValue : undefined
  const vcardString = buildVCard({ ...vcard, photo: photoURL })
  const checklist = [
    ['WhatsApp number', Boolean(settingsData.whatsappNumber)],
    ['Maps link', Boolean(settingsData.mapsUrl)],
    ['Published product', products.docs.some((p) => p.status === 'published')],
    ['Hero products', Boolean(settingsData.hero?.featuredProducts?.length)],
    ['OG image', Boolean(settingsData.ogImage)],
    ['Privacy page', Boolean(legalData.privacy?.root?.children?.length)],
    ['Contact card details', Boolean(vcard.displayName && vcard.phone)],
    ['Print bed post', printBed.totalDocs > 0],
  ] as const
  const cards = [
    ['New enquiries', enquiries.totalDocs, '/admin/collections/enquiries?where%5Bstatus%5D%5Bequals%5D=new'],
    ['Draft products', drafts.totalDocs, '/admin/collections/products?where%5Bstatus%5D%5Bequals%5D=draft'],
    ['Offers ending in 7 days', soon, '/admin/collections/offers'],
    ['Products missing images or alt text', missing, '/admin/collections/products'],
  ] as const
  return <main className="cobraa-dashboard">
    <header><p className="cobraa-eyebrow">COBRAA 3D · STUDIO ADMIN</p><h1>Welcome back</h1><p>Keep your catalogue, enquiries and updates moving.</p></header>
    <section><h2>Things that need attention</h2><div className="cobraa-cards">{cards.map(([label, count, href]) => <Link className="cobraa-card" href={href} key={label}><strong>{count}</strong><span>{label}</span><small>Open list →</small></Link>)}</div></section>
    <section><h2>Quick actions</h2><div className="cobraa-actions">
      <Link href="/admin/collections/products/create">Add product</Link><Link href="/admin/collections/announcements/create">Add announcement</Link><Link href="/admin/collections/offers/create">Create offer</Link><a href="/" target="_blank" rel="noreferrer">View site ↗</a>
      <Link href="/admin/collections/print-bed/create">Post on the print bed</Link><Link href="/admin/collections/enquiries?limit=25&sort=-createdAt">Open enquiry inbox</Link>
    </div></section>
    <section><h2>Festive mode</h2><p>Turn all festive offers and announcements on or off together. Add the offer or announcement first.</p><FestiveModeButton enabled={festiveOffers.docs.some((offer) => isActiveWithinWindow(offer)) || festiveAnnouncements.docs.some((item) => isActiveWithinWindow(item))} /></section>
    <section className="cobraa-share"><h2>Share your site</h2><p>Copy your site link, or create a printable QR code. Tagged variants record whether a visit came from QR or NFC.</p><code>{siteURL}</code><div className="cobraa-actions"><CopyLinkButton value={siteURL} /><CopyLinkButton value={`${siteURL}?src=nfc`} /><Link href="/admin/globals/site-settings">Manage site settings</Link></div><QRCodeDownloads url={siteURL} /></section>
    <section><h2>Publish checklist</h2><ul className="cobraa-checklist">{checklist.map(([label, complete]) => <li key={label}><span aria-hidden="true">{complete ? '✓' : '○'}</span> {label} <strong>{complete ? 'Ready' : 'Needs details'}</strong></li>)}</ul></section>
    <section><h2>Save to contacts test</h2><p>Preview the vCard generated from Site Settings.</p><details><summary>Show vCard preview</summary><pre className="cobraa-vcard-preview">{vcardString}</pre></details><a href={`data:text/vcard;charset=utf-8,${encodeURIComponent(vcardString)}`} download="cobraa-3d.vcf">Download contact card preview</a></section>
    <section><h2>Getting started</h2><ol><li>Add a product and its photos.</li><li>Set it to Published, then check the public product page.</li><li>Reply to new enquiries from the Enquiries inbox.</li></ol></section>
  </main>
}
