import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import React from 'react'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Bricolage_Grotesque, DM_Mono, DM_Sans, DM_Serif_Display } from 'next/font/google'
import localFont from 'next/font/local'
import { cn } from '@/utilities/ui'
import { getServerSideURL } from '@/utilities/getURL'
import { SiteNavigation } from '@/components/SiteNavigation'
import { buildWhatsAppUrl } from '@/lib/shared'
import './globals.css'
import '@/components/home/studio-home.css'
import '@/components/home/home-c3.css'
import '@/components/product/product-sheet.css'
import '@/components/Splash/splash.css'
import '@/components/site-navigation.css'

const instrumentSerif = localFont({ src: '../../../public/fonts/instrument-serif-regular.ttf', weight: '400', style: 'normal', variable: '--font-instrument-serif', display: 'swap' })
const bricolage = Bricolage_Grotesque({ weight: 'variable', axes: ['opsz'], subsets: ['latin'], display: 'swap', preload: true, variable: '--font-bricolage' })
const dmSans = DM_Sans({ weight: 'variable', axes: ['opsz'], subsets: ['latin'], display: 'swap', preload: true, variable: '--font-dm-sans' })
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap', preload: false, variable: '--font-dm-mono' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], display: 'swap', preload: false, variable: '--font-dm-serif' })

import { AccentScript } from '@/components/home/AccentScript'
import { Splash } from '@/components/Splash/Splash'
import { TrackClicks } from '@/components/analytics/TrackClicks'

export default async function RootLayout({ children, modal }: { children: React.ReactNode; modal?: React.ReactNode }) {
  const payload = await getPayload({ config })
  const settings = await getSiteSettings(0)
  const whatsappURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: 'Hi Cobraa 3D, I found your connect page and would like to know more about your products.' })
  return <html className={cn(GeistSans.variable, GeistMono.variable, instrumentSerif.variable, bricolage.variable, dmSans.variable, dmMono.variable, dmSerif.variable)} lang="en" suppressHydrationWarning>
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
  const description = undefined
  return {
    metadataBase: new URL(getServerSideURL()),
    title: settings.brandName,
    description,
    openGraph: { title: settings.brandName, description },
  }
}
