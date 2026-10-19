'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function SiteNavigation({ brandName, whatsappURL }: { brandName: string; whatsappURL?: string | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return <header className={`site-nav connect-nav${scrolled ? ' is-scrolled' : ''}`}>
    <Link href="/" className="site-nav-brand" aria-label={`${brandName} home`}>{brandName}</Link>
    <nav className={open ? 'site-nav-links is-open' : 'site-nav-links'} aria-label="Main navigation">
      <Link href="/products" onClick={() => setOpen(false)}>Products</Link>
      <Link href="/custom" onClick={() => setOpen(false)}>Custom</Link>
    </nav>
    <div className="site-nav-actions">
      {whatsappURL && <a className="nav-whatsapp" href={whatsappURL} target="_blank" rel="noopener noreferrer">Let’s go</a>}
      <button className="site-nav-menu" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
    </div>
  </header>
}
