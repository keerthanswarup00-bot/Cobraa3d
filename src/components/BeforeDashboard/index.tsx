import { getPayload, type PayloadRequest } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { ArrowUpRight, Bell, Boxes, Image as ImageIcon, MessageCircle, PackagePlus, Tag } from 'lucide-react'
import { CopyLinkButton } from './CopyLinkButton'
import { QRCodeDownloads } from './QRCodeDownloads'
import { FestiveModeButton } from './FestiveModeButton'
import { buildVCard, isActiveWithinWindow, type VCardSettings } from '@/lib/shared'
import React from 'react'

type Props = { req?: PayloadRequest }

const configuredBase = process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')

export default async function BeforeDashboard({ req }: Props) {
  const payload = req?.payload || await getPayload({ config })
  const [enquiries, drafts, products, offers, festiveOffers, festiveAnnouncements, printBed, settings, legal, pushSubscribers] = await Promise.all([
    payload.find({ collection: 'enquiries', where: { status: { equals: 'new' } }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'products', where: { status: { equals: 'draft' } }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'products', limit: 1000, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'offers', where: { active: { equals: true } }, limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'offers', where: { and: [{ style: { equals: 'festive' } }, { active: { equals: true } }] }, limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'announcements', where: { and: [{ type: { equals: 'festive' } }, { active: { equals: true } }] }, limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'print-bed', where: { visible: { equals: true } }, limit: 1, depth: 0, overrideAccess: true }),
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }),
    payload.findGlobal({ slug: 'legal-pages', depth: 0, overrideAccess: true }),
    payload.find({ collection: 'push-subscriptions', where: { and: [{ active: { equals: true } }, { isTest: { equals: false } }] }, limit: 0, overrideAccess: true }),
  ])
  const missing = products.docs.filter((p) => !p.images?.length || p.images.some((i) => !i.alt?.trim())).length
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const soon = offers.docs.filter((offer) => offer.endsAt && new Date(offer.endsAt).getTime() >= now && new Date(offer.endsAt).getTime() <= now + 7 * 86400000).length
  const siteURL = configuredBase ? (configuredBase.startsWith('http') ? configuredBase : `https://${configuredBase}`).replace(/\/$/, '') : ''
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
    ['WhatsApp number', Boolean(settingsData.whatsappNumber)], ['Maps link', Boolean(settingsData.mapsUrl)],
    ['Published product', products.docs.some((p) => p.status === 'published')], ['Hero products', Boolean(settingsData.hero?.featuredProducts?.length)],
    ['OG image', Boolean(settingsData.ogImage)], ['Privacy page', Boolean(legalData.privacy?.root?.children?.length)],
    ['Contact card details', Boolean(vcard.displayName && vcard.phone)], ['Print bed post', printBed.totalDocs > 0],
  ] as const
  const cards = [
    { label: 'New enquiries', count: enquiries.totalDocs, href: '/admin/collections/enquiries?where%5Bstatus%5D%5Bequals%5D=new', icon: MessageCircle, hint: 'Needs a reply', warning: enquiries.totalDocs > 0 },
    { label: 'Draft products', count: drafts.totalDocs, href: '/admin/collections/products?where%5Bstatus%5D%5Bequals%5D=draft', icon: Boxes, hint: 'Not published', warning: drafts.totalDocs > 0 },
    { label: 'Offers ending in 7 days', count: soon, href: '/admin/collections/offers', icon: Tag, hint: 'Review promotions', warning: soon > 0 },
    { label: 'Products missing images or alt text', count: missing, href: '/admin/collections/products', icon: ImageIcon, hint: 'Catalogue quality', warning: missing > 0 },
  ] as const
  const festiveActive = festiveOffers.docs.some((offer) => isActiveWithinWindow(offer)) || festiveAnnouncements.docs.some((item) => isActiveWithinWindow(item))

  return <main className="cobraa-dashboard">
    <header className="cobraa-welcome"><p className="cobraa-eyebrow">COBRAA 3D · STUDIO ADMIN</p><h1>Welcome back</h1><p>Manage products, enquiries and your storefront.</p></header>
    <section aria-labelledby="attention-heading"><div className="cobraa-section-heading"><div><h2 id="attention-heading">Operational summary</h2><p>A quick view of what needs attention.</p></div></div>
      <p className="cobraa-dashboard-push-count">Offer alerts: {pushSubscribers.totalDocs} active subscribers</p>
      <div className="cobraa-cards">{cards.map(({ label, count, href, icon: Icon, hint, warning }) => <Link className={`cobraa-card${warning ? ' is-warning' : ''}`} href={href} key={label}>
        <span className="cobraa-card-icon"><Icon size={17} aria-hidden="true" /></span><span className="cobraa-card-label">{label}</span><strong>{count}</strong><small>{hint}<ArrowUpRight size={13} aria-hidden="true" /></small>
      </Link>)}</div>
    </section>
    <section aria-labelledby="actions-heading"><div className="cobraa-section-heading"><div><h2 id="actions-heading">Quick actions</h2><p>Jump straight into your day-to-day work.</p></div></div><div className="cobraa-actions">
      <Link className="is-primary" href="/admin/collections/products/create"><PackagePlus size={16} aria-hidden="true" />Add product</Link>
      <Link href="/admin/collections/announcements/create"><Bell size={16} aria-hidden="true" />Add announcement</Link><Link href="/admin/collections/offers/create">Create offer</Link>
      <a href="/" target="_blank" rel="noreferrer">View site <ArrowUpRight size={14} aria-hidden="true" /></a>
      <Link href="/admin/collections/print-bed/create">Post on the print bed</Link><Link href="/admin/collections/enquiries?limit=25&sort=-createdAt">Open enquiry inbox</Link>
    </div></section>
    <div className="cobraa-dashboard-columns">
      <section className="cobraa-panel" aria-labelledby="festive-heading"><div className="cobraa-panel-heading"><div><p className="cobraa-eyebrow">PROMOTIONS</p><h2 id="festive-heading">Festive mode</h2></div></div>
        <p>Turn festive offers and announcements on or off together. Prepare the offer or announcement before switching this on.</p><FestiveModeButton enabled={festiveActive} />
      </section>
      <section className="cobraa-panel cobraa-checklist-panel" aria-labelledby="checklist-heading"><div className="cobraa-panel-heading"><div><p className="cobraa-eyebrow">STOREFRONT HEALTH</p><h2 id="checklist-heading">Publish checklist</h2></div></div><ul className="cobraa-checklist">{checklist.map(([label, complete]) => <li key={label}><span aria-hidden="true" className={complete ? 'is-ready' : ''}>{complete ? '✓' : '○'}</span>{label}<strong>{complete ? 'Ready' : 'Needs details'}</strong></li>)}</ul></section>
    </div>
    <section className="cobraa-share" aria-labelledby="share-heading"><div className="cobraa-share-copy"><p className="cobraa-eyebrow">STOREFRONT</p><h2 id="share-heading">Share your storefront</h2><p>Share a direct link or create a print-ready QR code. Tagged variants record whether a visit came from QR or NFC.</p>
      {siteURL ? <><code>{siteURL}</code><div className="cobraa-actions"><CopyLinkButton value={siteURL} /><a href={siteURL} target="_blank" rel="noreferrer">Open storefront <ArrowUpRight size={14} aria-hidden="true" /></a><Link href="/admin/globals/site-settings">Manage site settings</Link></div></> : <div className="cobraa-config-note">Configure the production storefront URL with <code>NEXT_PUBLIC_SERVER_URL</code> to enable sharing and QR downloads.</div>}
    </div>{siteURL && <QRCodeDownloads url={siteURL} />}</section>
    <details className="cobraa-secondary"><summary>Save to contacts test</summary><p>Preview the vCard generated from Site Settings.</p><pre className="cobraa-vcard-preview">{vcardString}</pre><a href={`data:text/vcard;charset=utf-8,${encodeURIComponent(vcardString)}`} download="cobraa-3d.vcf">Download contact card preview</a></details>
    <section className="cobraa-getting-started"><h2>Getting started</h2><ol><li>Add a product and its photos.</li><li>Set it to Published, then check the public product page.</li><li>Reply to new enquiries from the Enquiries inbox.</li></ol></section>
  </main>
}
