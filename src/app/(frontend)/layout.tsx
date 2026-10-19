import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import localFont from 'next/font/local'
import { cn } from '@/utilities/ui'
import { getServerSideURL } from '@/utilities/getURL'
import './globals.css'

const instrumentSerif = localFont({ src: '../../../public/fonts/instrument-serif-regular.ttf', weight: '400', style: 'normal', variable: '--font-instrument-serif', display: 'swap' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html className={cn(GeistSans.variable, GeistMono.variable, instrumentSerif.variable)} lang="en" suppressHydrationWarning>
    <head><link href="/favicon.svg" rel="icon" type="image/svg+xml" /></head>
    <body>{children}</body>
  </html>
}

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 1 })
  const description = undefined
  return {
    metadataBase: new URL(getServerSideURL()),
    title: settings.brandName,
    description,
    openGraph: { title: settings.brandName, description },
  }
}
