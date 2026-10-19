import type { PayloadRequest } from 'payload'
import Link from 'next/link'
import { CopyLinkButton } from './CopyLinkButton'
import React from 'react'

type Props = { req: PayloadRequest }

const base = process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'http://localhost:3000'

export default async function BeforeDashboard({ req }: Props) {
  const payload = req.payload
  const [enquiries, drafts, products, offers] = await Promise.all([
    payload.find({ collection: 'enquiries', where: { status: { equals: 'new' } }, limit: 0, overrideAccess: false, req }),
    payload.find({ collection: 'products', where: { status: { equals: 'draft' } }, limit: 0, overrideAccess: false, req }),
    payload.find({ collection: 'products', limit: 1000, depth: 0, overrideAccess: false, req }),
    payload.find({ collection: 'offers', where: { active: { equals: true } }, limit: 100, depth: 0, overrideAccess: false, req }),
  ])
  const missing = products.docs.filter((p) => !p.images?.length || p.images.some((i) => !i.alt?.trim())).length
  // Server-rendered attention count; time is intentionally evaluated once per dashboard request.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const soon = offers.docs.filter((offer) => offer.endsAt && new Date(offer.endsAt).getTime() >= now && new Date(offer.endsAt).getTime() <= now + 7 * 86400000).length
  const siteURL = base.startsWith('http') ? base : `https://${base}`
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
    </div></section>
    <section className="cobraa-share"><h2>Share your site</h2><p>Copy your site link, or use the tagged links for QR and NFC tracking.</p><code>{siteURL}</code><div className="cobraa-actions"><CopyLinkButton value={siteURL} /><a href={`${siteURL}?src=qr`}>QR tracking link</a><a href={`${siteURL}?src=nfc`}>NFC-ready link</a><Link href="/admin/globals/site-settings">Manage site settings</Link></div></section>
    <section><h2>Getting started</h2><ol><li>Add a product and its photos.</li><li>Set it to Published, then check the public product page.</li><li>Reply to new enquiries from the Enquiries inbox.</li></ol></section>
  </main>
}
