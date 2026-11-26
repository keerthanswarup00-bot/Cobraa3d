import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { AccentScript } from '@/components/home/AccentScript'
import './viewer.css'

const geist = localFont({
  src: '../../../fonts/geist-sans.woff2',
  weight: '100 900',
  display: 'swap',
})

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`guide-body ${geist.className}`}>
        <AccentScript />
        {children}
      </body>
    </html>
  )
}
