import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import React from 'react'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
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

const bricolage = Bricolage_Grotesque({ weight: 'variable', axes: ['opsz'], subsets: ['latin'], display: 'swap', preload: false, variable: '--font-bricolage' })
const dmSans = DM_Sans({ weight: 'variable', axes: ['opsz'], subsets: ['latin'], display: 'swap', preload: true, variable: '--font-dm-sans' })

import { AccentScript } from '@/components/home/AccentScript'
import { Splash } from '@/components/Splash/Splash'
import { TrackClicks } from '@/components/analytics/TrackClicks'

export default async function RootLayout({ children, modal }: { children: React.ReactNode; modal?: React.ReactNode }) {
  const payload = await getPayload({ config })
  const settings = await getSiteSettings(0)
  const whatsappURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: buildGeneralMessage(settings.brandName) })
  return <html className={cn(bricolage.variable, dmSans.variable)} lang="en" suppressHydrationWarning>
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
