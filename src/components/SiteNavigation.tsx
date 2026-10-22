'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function SiteNavigation({ brandName, whatsappURL }: { brandName: string; whatsappURL?: string | null }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (pathname !== '/') return
    const sections = ['products', 'custom'].map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id) }), { rootMargin: '-45% 0px -50% 0px' })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [pathname])

  const productsHref = '/products'
  const customHref = pathname === '/' ? '#custom' : '/#custom'

  return <header className={`site-nav connect-nav${scrolled ? ' is-scrolled' : ''}`}>
    <Link href="/" className="site-nav-brand" aria-label={`${brandName} home`}>Cobraa<i>.</i>3D</Link>
    <nav className={open ? 'site-nav-links is-open' : 'site-nav-links'} aria-label="Main navigation">
      <Link href={productsHref} aria-current={pathname === '/products' || pathname.startsWith('/products/') ? 'page' : undefined} onClick={() => setOpen(false)}>Products</Link>
      <Link href={customHref} aria-current={pathname === '/' && active === 'custom' ? 'page' : undefined} onClick={() => setOpen(false)}>Custom</Link>
    </nav>
    <div className="site-nav-actions">
      {whatsappURL && <a className="nav-whatsapp" href={whatsappURL} data-wa-source="nav" target="_blank" rel="noopener noreferrer">Chat on WhatsApp <span aria-hidden="true">↗</span></a>}
      <button className="site-nav-menu" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
    </div>
  </header>
}
