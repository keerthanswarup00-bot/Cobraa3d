import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import React from 'react'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import localFont from 'next/font/local'
import { cn } from '@/utilities/ui'
import { getServerSideURL } from '@/utilities/getURL'
import { SiteNavigation } from '@/components/SiteNavigation'
import { buildWhatsAppUrl } from '@/lib/shared'
import './globals.css'

const instrumentSerif = localFont({ src: '../../../public/fonts/instrument-serif-regular.ttf', weight: '400', style: 'normal', variable: '--font-instrument-serif', display: 'swap' })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config })
  const settings = await getSiteSettings(0)
  const whatsappURL = buildWhatsAppUrl({ number: settings.whatsappNumber, message: 'Hi Cobraa 3D, I found your connect page and would like to know more about your products.' })
  return <html className={cn(GeistSans.variable, GeistMono.variable, instrumentSerif.variable)} lang="en" suppressHydrationWarning>
    <head><link href="/favicon.svg" rel="icon" type="image/svg+xml" /></head>
    <body><SiteNavigation brandName={settings.brandName || 'Cobraa 3D'} whatsappURL={whatsappURL} />{children}</body>
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
