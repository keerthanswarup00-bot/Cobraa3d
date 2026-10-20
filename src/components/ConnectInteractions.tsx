'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { X, MapPin, ChevronDown } from 'lucide-react'
import { getCloseButtonDestination } from '@/lib/shared'
import type { BrowserProduct } from '@/components/ProductsBrowser'
import { AccentPicker } from './AccentPicker'

export function ScrollProgress({ enabled, calmMode = false }: { enabled: boolean; calmMode?: boolean }) {
  const [progress, setProgress] = useState(0)
  const [layer, setLayer] = useState('LAYER 01 · EXPLORE')
  useEffect(() => {
    if (!enabled || calmMode || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 1)
      })
    }
    window.addEventListener('scroll', update, { passive: true }); update()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update) }
  }, [enabled, calmMode])
  useEffect(() => {
    const labels: Record<string, string> = { hero: 'EXPLORE', top: 'CONTACT', products: 'PRODUCTS', kits: 'PAINTING KITS', 'print-bed': 'PRINT BED', custom: 'CUSTOM', location: 'STUDIO' }
    const layerNumbers: Record<string, number> = { hero: 1, top: 2, products: 3, kits: 5, 'print-bed': 6, custom: 7, location: 10 }
    const update = () => {
      const id = document.body.dataset.section || 'top'
      const index = layerNumbers[id] || 1
      setLayer(`LAYER ${String(index).padStart(2, '0')} · ${labels[id] || 'EXPLORE'}`)
    }
    const observer = new MutationObserver(update)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-section'] }); update()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const update = () => { document.documentElement.dataset.pageHidden = String(document.visibilityState === 'hidden') }
    document.addEventListener('visibilitychange', update); update()
    return () => { document.removeEventListener('visibilitychange', update); delete document.documentElement.dataset.pageHidden }
  }, [])
  if (!enabled) return null
  return <><div className={`print-progress${calmMode ? ' is-calm' : ''}`} aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /><small>{progress >= .99 ? 'Done. Let’s make yours.' : 'Printing…'}</small></div>{!calmMode && <aside className="z-gauge" aria-hidden="true"><i style={{ top: `${progress * 100}%` }} /><b>{layer}</b></aside>}</>
}

export function ConnectHeader({ brandName, parentUrl, accentPicker = true, showSpool = true }: { brandName: string; parentUrl?: string | null; accentPicker?: boolean; showSpool?: boolean }) {
  const close = () => {
    const sameOriginHistory = (() => { try { return window.history.length > 1 && !!document.referrer && new URL(document.referrer).origin === window.location.origin } catch { return false } })()
    const target = getCloseButtonDestination({ sameOriginHistory, currentURL: window.location.href, parentUrl })
    if (target.kind === 'back') window.history.back()
    else if (target.kind === 'parent') window.location.assign(target.url)
    else window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <header className="connect-header"><Link href="/" aria-label={brandName} className="connect-wordmark">{brandName}</Link><div className="header-tools">{accentPicker && <AccentPicker />}{showSpool && <span className="filament-spool" aria-hidden="true" />}<button aria-label="Close page" onClick={close}><X size={18} /></button></div></header>
}

export function DismissibleAnnouncement({ id, message, href, dismissible }: { id: string; message: string; href?: string | null; dismissible?: boolean | null }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(!dismissible || localStorage.getItem(`cobraa-announcement-${id}`) !== 'dismissed'))
    return () => cancelAnimationFrame(frame)
  }, [id, dismissible])
  if (!visible) return null
  return <div className="announcement-bar">{href ? <a href={href}>{message}</a> : <span>{message}</span>}{dismissible && <button aria-label="Dismiss announcement" onClick={() => { localStorage.setItem(`cobraa-announcement-${id}`, 'dismissed'); setVisible(false) }}><X size={16} /></button>}</div>
}

export function HeroStage({ brandName, headline, description, ctaLabel, product, contoursEnabled, revealEnabled }: {
  brandName: string; headline: string; description?: string | null; ctaLabel: string; product?: BrowserProduct; contoursEnabled: boolean; revealEnabled: boolean
}) {
  // Keep as is in old form if needed? But we're removing these exports - let me just write minimal
  return null
}

export function QuickLinks({ items, contoursEnabled = false }: { items: { label: string; href: string }[]; contoursEnabled?: boolean }) {
  return null
}

export function CopyAddress({ address }: { address: string }) {
  return <button className="copy-address">{address}</button>
}

export function LazyMap({ url }: { url: string }) {
  return null
}

export function LazyPrintBedVideo({ url, caption }: { url: string; caption: string }) {
  return null
}

export function PaintingPlayground({ categoryHref }: { categoryHref: string }) {
  const [colour, setColour] = useState('#c6a15b')
  return <div className="paint-playground"><p>Illustrative colour playground · not a product</p><svg viewBox="0 0 220 150" role="img" aria-label="Illustrative 3D printed toy shape recoloured with the selected swatch"><ellipse cx="110" cy="132" rx="67" ry="10" fill="#080808" opacity=".08"/><path d="M47 91 79 39l31 18 31-18 32 52-25 34H72z" fill={colour} stroke="#080808" strokeWidth="2"/><circle cx="91" cy="84" r="5" fill="#080808"/><circle cx="129" cy="84" r="5" fill="#080808"/><path d="M96 104q14 11 28 0" fill="none" stroke="#080808" strokeWidth="3" strokeLinecap="round"/></svg><div className="paint-swatches" role="group" aria-label="Illustration colours">{['#c6a15b', '#e77b5b', '#6c9f93', '#8b83b2', '#f2f0e8'].map((hex) => <button key={hex} aria-label={`Colour ${hex}`} aria-pressed={colour === hex} onClick={() => setColour(hex)}><span style={{ background: hex }} /></button>)}</div><Link href={categoryHref}>Want a kit like this?</Link></div>
}

export function SurpriseMe({ products }: { products: BrowserProduct[] }) {
  return null
}

export function KeepExploring() {
  return null
}

export function TakeItWithYou({ brandName, shareURL, whatsappURL, hasVCard }: { brandName: string; shareURL: string; whatsappURL?: string | null; hasVCard: boolean }) {
  return null
}
