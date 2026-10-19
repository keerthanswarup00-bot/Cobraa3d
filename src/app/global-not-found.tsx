import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { GeistSans } from 'geist/font/sans'
import { buildWhatsAppUrl } from '@/lib/shared'
import './(frontend)/globals.css'

export const dynamic = 'force-dynamic'

export default async function GlobalNotFound() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const helpURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: `Hi, I was looking for a page on the ${settings.brandName} website and need a hand.` })
  return <html lang="en" className={GeistSans.className}><body><main className="layer-shift-page"><p className="section-eyebrow">404 · Layer shift</p><h1>Layer shift. This page didn’t print right.</h1><p>Let’s get you back to the right layer.</p><Link className="hero-cta" href="/">Back to {settings.brandName}</Link>{helpURL && <a className="direct-whatsapp" href={helpURL} target="_blank" rel="noopener noreferrer">Ask us on WhatsApp</a>}</main></body></html>
}
