'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X } from 'lucide-react'

const LINKS = [
  { key: 'home', label: 'Home' },
  { key: 'products', label: 'Products' },
  { key: 'custom', label: 'Custom orders' },
] as const

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function SiteNavigation({ brandName, whatsappURL }: { brandName: string; whatsappURL?: string | null }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)

  const closeMenu = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) lastFocusRef.current?.focus?.({ preventScroll: true })
  }, [])


  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8)
    const close = () => setOpen(false)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('popstate', close)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('popstate', close)
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/') return
    const sections = ['products', 'custom'].map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    if (!open) return

    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : menuButtonRef.current
    const scrollY = window.scrollY
    const { body, documentElement } = document
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    }
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 30)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }
      if (event.key !== 'Tab' || !menuPanelRef.current) return
      const items = Array.from(menuPanelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) {
        event.preventDefault()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const inside = menuPanelRef.current.contains(document.activeElement)
      if (!inside || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault()
        first.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.paddingRight = previous.paddingRight
      window.scrollTo(0, scrollY)
    }
  }, [open, closeMenu])

  const activeKey = pathname === '/'
    ? activeSection || 'home'
    : pathname.startsWith('/products')
      ? 'products'
      : pathname.startsWith('/custom')
        ? 'custom'
        : ''

  const hrefFor = (key: (typeof LINKS)[number]['key']) => key === 'home' ? '/' : key === 'products' ? '/products' : pathname === '/' ? '#custom' : '/#custom'

  const menu = open ? createPortal(
    <div
      id="site-menu"
      className="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      ref={menuPanelRef}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (!target.closest('a,button,input,select,textarea,label')) closeMenu()
      }}
    >
      <div className="site-menu-top">
        <Link href="/" className="site-menu-brand" onClick={() => closeMenu(false)}>Cobraa<i>.</i>3D</Link>
        <button ref={closeButtonRef} type="button" className="site-menu-close" aria-label="Close menu" onClick={() => closeMenu()}>
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <nav className="site-menu-links" aria-label="Main navigation">
        {LINKS.map((link, index) => (
          <Link key={link.key} href={hrefFor(link.key)} aria-current={activeKey === link.key ? 'page' : undefined} onClick={() => closeMenu(false)}>
            <span className="site-menu-index" aria-hidden="true">0{index + 1}</span>
            <span>{link.label}</span>
            <i aria-hidden="true" />
          </Link>
        ))}
        {whatsappURL && (
          <a className="site-menu-whatsapp" href={whatsappURL} target="_blank" rel="noopener noreferrer" data-wa-source="menu" onClick={() => closeMenu(false)}>
            <MessageCircle size={22} aria-hidden="true" />
            <span>Chat on WhatsApp</span>
          </a>
        )}
      </nav>
      <p className="site-menu-foot">Hoskote, Bengaluru · Printed to order</p>
    </div>,
    document.body,
  ) : null

  return <header className={`site-nav connect-nav${scrolled ? ' is-scrolled' : ''}`}>
    <div className="site-nav-inner">
      <Link href="/" className="site-nav-brand" aria-label={`${brandName} home`}>Cobraa<i>.</i>3D</Link>
      <nav className="site-nav-links" aria-label="Main navigation">
        {LINKS.map((link) => (
          <Link key={link.key} href={hrefFor(link.key)} aria-current={activeKey === link.key ? 'page' : undefined}>{link.label}</Link>
        ))}
      </nav>
      <div className="site-nav-actions">
        {whatsappURL && <a className="nav-whatsapp" href={whatsappURL} data-wa-source="nav" target="_blank" rel="noopener noreferrer">
          <MessageCircle className="nav-whatsapp-icon" size={15} aria-hidden="true" />
          <span className="nav-whatsapp-long">Chat on WhatsApp</span>
          <span className="nav-whatsapp-short">WhatsApp</span>
          <span className="nav-whatsapp-arrow" aria-hidden="true">↗</span>
        </a>}
        <button
          className="site-nav-menu"
          ref={menuButtonRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
        </button>
      </div>
    </div>
    {menu}
  </header>
}
