import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import React from 'react'
import { Bricolage_Grotesque, DM_Mono, DM_Sans, DM_Serif_Display } from 'next/font/google'
import localFont from 'next/font/local'
import { cn } from '@/utilities/ui'
import { getServerSideURL } from '@/utilities/getURL'
import { SiteNavigation } from '@/components/SiteNavigation'
import { buildGeneralMessage, buildWhatsAppUrl } from '@/lib/shared'
import { DEFAULT_SITE_DESCRIPTION, defaultShareImage } from '@/lib/siteMeta'
import './globals.css'
import '@/components/home/studio-home.css'
import '@/components/home/home-c3.css'
import '@/components/home/home-rework.css'
import '@/components/product/product-sheet.css'
import '@/components/Splash/splash.css'
import '@/components/site-navigation.css'

// Fonts are self-hosted and subset to the Latin + punctuation/currency ranges the
// site actually renders. The full Geist files ship several unused scripts and
// Instrument Serif was served as a raw TTF, which together put ~90 KiB of dead
// weight on the mobile critical path. Glyph shapes are unchanged.
const instrumentSerif = localFont({ src: '../../fonts/instrument-serif.woff2', weight: '400', style: 'normal', variable: '--font-instrument-serif', display: 'swap', preload: false })
const geistSans = localFont({ src: '../../fonts/geist-sans.woff2', weight: '100 900', style: 'normal', variable: '--font-geist-sans', display: 'swap', preload: true })
const geistMono = localFont({ src: '../../fonts/geist-mono.woff2', weight: '100 900', style: 'normal', variable: '--font-geist-mono', display: 'swap', preload: false, adjustFontFallback: false })
const bricolage = Bricolage_Grotesque({ weight: 'variable', axes: ['opsz'], subsets: ['latin'], display: 'swap', preload: false, variable: '--font-bricolage' })
const dmSans = DM_Sans({ weight: 'variable', axes: ['opsz'], subsets: ['latin'], display: 'swap', preload: true, variable: '--font-dm-sans' })
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap', preload: false, variable: '--font-dm-mono' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], display: 'swap', preload: false, variable: '--font-dm-serif' })

import { AccentScript } from '@/components/home/AccentScript'
import { Splash } from '@/components/Splash/Splash'
import { TrackClicks } from '@/components/analytics/TrackClicks'

export default async function RootLayout({ children, modal }: { children: React.ReactNode; modal?: React.ReactNode }) {
  const payload = await getPayload({ config })
  const settings = await getSiteSettings(0)
  const whatsappURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: buildGeneralMessage(settings.brandName) })
  return <html className={cn(geistSans.variable, geistMono.variable, instrumentSerif.variable, bricolage.variable, dmSans.variable, dmMono.variable, dmSerif.variable)} lang="en" suppressHydrationWarning>
    <head>
      <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
    </head>
    <body>
      <AccentScript />
      <Splash />
      <SiteNavigation brandName={settings.brandName || 'Cobraa 3D'} whatsappURL={whatsappURL} />
      {children}
      {modal}
      <TrackClicks />
    </body>
  </html>
}

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config })
  const settings = await getSiteSettings(1)
  const brand = settings.brandName || 'Cobraa 3D'
  const description = settings.seoDefaults?.description?.trim() || settings.hero?.description?.trim() || DEFAULT_SITE_DESCRIPTION
  const image = defaultShareImage(brand)
  // Pages that set their own openGraph (home, products) replace this; every other page inherits a proper preview.
  return {
    metadataBase: new URL(getServerSideURL()),
    title: settings.brandName,
    description,
    openGraph: { type: 'website', siteName: brand, title: settings.brandName, description, images: [image] },
    twitter: { card: 'summary_large_image', title: settings.brandName, description, images: [image.url] },
  }
}
