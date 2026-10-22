'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'

export function SiteNavigation({ brandName, whatsappURL }: { brandName: string; whatsappURL?: string | null }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const headerRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)

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

  /* An open menu closes on Escape, on a tap outside it, and hands focus back. */
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuRef.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && headerRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const customHref = pathname === '/' ? '#custom' : '/#custom'

  return <header className={`site-nav connect-nav${scrolled ? ' is-scrolled' : ''}`} ref={headerRef}>
    <Link href="/" className="site-nav-brand" aria-label={`${brandName} home`}>Cobraa<i>.</i>3D</Link>
    <nav className={open ? 'site-nav-links is-open' : 'site-nav-links'} aria-label="Main navigation">
      <Link href={productsHref} aria-current={pathname === '/products' || pathname.startsWith('/products/') ? 'page' : undefined} onClick={() => setOpen(false)}>Products</Link>
      <Link href={customHref} aria-current={pathname === '/' && active === 'custom' ? 'page' : undefined} onClick={() => setOpen(false)}>Custom</Link>
    </nav>
    <div className="site-nav-actions">
      {whatsappURL && <a className="nav-whatsapp" href={whatsappURL} data-wa-source="nav" target="_blank" rel="noopener noreferrer">
        <MessageCircle className="nav-whatsapp-icon" size={15} aria-hidden="true" />
        <span className="nav-whatsapp-long">Chat on WhatsApp</span>
        <span className="nav-whatsapp-short">WhatsApp</span>
        <span className="nav-whatsapp-arrow" aria-hidden="true">↗</span>
      </a>}
      <button className="site-nav-menu" ref={menuRef} type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
    </div>
  </header>
}
