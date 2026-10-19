'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { X, MapPin, ChevronDown } from 'lucide-react'
import { getCloseButtonDestination } from '@/lib/shared'
import type { BrowserProduct } from '@/components/ProductsBrowser'

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

const accents = [
  { name: 'Marigold', value: '#9A742E' }, { name: 'Ocean', value: '#245D8F' },
  { name: 'Forest', value: '#26734D' }, { name: 'Clay', value: '#A53B32' },
  { name: 'Iris', value: '#695093' }, { name: 'Teal', value: '#146D73' },
]
export function AccentPicker() {
  const [selected, setSelected] = useState(accents[0]!.value)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('cobraa-accent')
    const initial = accents.find((accent) => accent.value === saved)?.value || accents[0]!.value
    document.documentElement.style.setProperty('--accent', initial)
    const frame = requestAnimationFrame(() => setSelected(initial))
    return () => cancelAnimationFrame(frame)
  }, [])
  const pick = (value: string) => { setSelected(value); document.documentElement.style.setProperty('--accent', value); localStorage.setItem('cobraa-accent', value); setOpen(false); if (navigator.vibrate) navigator.vibrate(8) }
  return <div className="accent-picker"><button type="button" className="accent-trigger" aria-label="Filament accent colours" aria-expanded={open} onClick={() => setOpen(!open)}><span style={{ '--swatch': selected } as React.CSSProperties} /></button>{open && <div className="accent-options" role="group" aria-label="Choose an accent colour">{accents.map((accent) => <button key={accent.value} type="button" className="accent-option" aria-label={`${accent.name} accent`} aria-pressed={selected === accent.value} onClick={() => pick(accent.value)}><span style={{ '--swatch': accent.value } as React.CSSProperties} /></button>)}</div>}</div>
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
  const [reveal, setReveal] = useState(false)
  const stageRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seen = sessionStorage.getItem('cobraa-hero-reveal') === 'done'
    if (!revealEnabled || reduced || seen) {
      const frame = requestAnimationFrame(() => setReveal(false))
      return () => cancelAnimationFrame(frame)
    }
    const frame = requestAnimationFrame(() => setReveal(true))
    const finish = () => { sessionStorage.setItem('cobraa-hero-reveal', 'done'); setReveal(false) }
    const onScroll = () => { if (window.scrollY > 0) finish() }
    const onTap = () => finish()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', onTap, { once: true })
    const timer = window.setTimeout(finish, 1450)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); document.removeEventListener('pointerdown', onTap); window.clearTimeout(timer) }
  }, [revealEnabled])
  const image = product?.images?.[0]
  const media = image && typeof image.image === 'object' && !product?.isDemo ? image.image : undefined
  const moveContour = (event: PointerEvent<HTMLElement>) => {
    if ((!contoursEnabled && !revealEnabled) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const capabilities = navigator as Navigator & { deviceMemory?: number }
    const now = performance.now()
    const last = Number(event.currentTarget.dataset.lastContourFrame || 0)
    if (now - last < 33) return
    event.currentTarget.dataset.lastContourFrame = String(now)
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    event.currentTarget.style.setProperty('--nozzle-x', `${(x / rect.width) * 100}%`)
    const lowPower = (capabilities.deviceMemory != null && capabilities.deviceMemory <= 2) || (navigator.hardwareConcurrency != null && navigator.hardwareConcurrency <= 2)
    if (contoursEnabled && !lowPower) {
      event.currentTarget.style.setProperty('--pointer-x', `${(x / rect.width) * 100}%`)
      event.currentTarget.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height) * 100}%`)
    }
  }
  return <section id="hero" ref={stageRef} className={`hero-stage ${reveal ? 'hero-reveal' : ''}`} onPointerMove={moveContour}>
    {contoursEnabled && <div className="hero-contours" aria-hidden="true" />}
    {revealEnabled && <><span className="nozzle-rail" aria-hidden="true" /><span className="nozzle-head" aria-hidden="true" /></>}
    <div className="hero-copy"><p className="hero-eyebrow">{brandName}</p><h1>{headline}</h1>{description && <p>{description}</p>}<a className="hero-cta" href="#products">{ctaLabel}<ChevronDown size={16} /></a></div>
    <div className="hero-object-wrap" aria-label={media ? image?.alt || product?.title : 'Studio product'}>
      {media?.url ? <Image className="hero-product-image" src={media.url} alt={image?.alt || product?.title || ''} fill sizes="(max-width: 760px) 88vw, 44vw" preload /> : <div className="hero-object-placeholder"><span>{product?.isDemo ? 'DEMO PRODUCT · PHOTO PLACEHOLDER' : 'PRODUCT PHOTO TO BE ADDED'}</span><small>{product?.isDemo ? 'Not a product photograph' : 'Illustrative placeholder · not a product photograph'}</small></div>}
      {reveal && <span className="nozzle-line" aria-hidden="true" />}
    </div>
  </section>
}

export function QuickLinks({ items, contoursEnabled = false }: { items: { label: string; href: string }[]; contoursEnabled?: boolean }) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section'))
    const sectionLabels: Record<string, string> = { hero: 'EXPLORE', top: 'CONTACT', products: 'PRODUCTS', kits: 'PAINTING KITS', festive: 'SEASONAL', 'print-bed': 'PRINT BED', custom: 'CUSTOM', location: 'STUDIO' }
    sections.forEach((section, index) => { const name = sectionLabels[section.id] || (section.classList.contains('bulk-card') ? 'BULK' : section.classList.contains('how-it-works') ? 'HOW IT WORKS' : 'LAYER'); section.dataset.layer = `LAYER ${String(index + 1).padStart(2, '0')} / ${name}`; section.classList.add('layer-marked') })
    const targets = items.filter((item) => item.href.startsWith('#')).map((item) => document.querySelector(item.href)).filter((node): node is Element => !!node)
    document.body.dataset.topography = String(contoursEnabled)
    const layerObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('layer-visible') }), { rootMargin: '0px 0px -15% 0px', threshold: .05 })
    sections.forEach((section) => layerObserver.observe(section))
    const observer = new IntersectionObserver((entries) => { const current = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (current) { setActive(`#${current.target.id}`); document.body.dataset.section = current.target.id } }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .25, .5] })
    targets.forEach((target) => observer.observe(target))
    return () => { observer.disconnect(); layerObserver.disconnect(); sections.forEach((section) => { section.classList.remove('layer-marked', 'layer-visible'); delete section.dataset.layer }); delete document.body.dataset.topography; delete document.body.dataset.section }
  }, [items, contoursEnabled])
  return <><div className="scroll-topography" aria-hidden="true" /><nav className="quick-links" aria-label="Page sections">{items.map((item) => <a key={item.href} className={active === item.href ? 'active' : ''} href={item.href}>{item.label}</a>)}</nav></>
}

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  return <button className="copy-address" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }}>{copied ? 'Address copied' : 'Copy address'}</button>
}

export function LazyMap({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  if (!open) return <button className="map-loader" onClick={() => setOpen(true)}><MapPin size={16} /> Show map</button>
  return <iframe className="location-map" src={url} loading="lazy" title="Map to the studio" referrerPolicy="no-referrer-when-downgrade" />
}

export function LazyPrintBedVideo({ url, caption }: { url: string; caption: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setReady(true); observer.disconnect() } }, { rootMargin: '120px' })
    observer.observe(video)
    const visibility = () => { if (document.visibilityState === 'hidden') video.pause() }
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  return <video ref={ref} src={ready ? url : undefined} controls muted loop playsInline preload="none" aria-label={caption} />
}

export function PaintingPlayground({ categoryHref }: { categoryHref: string }) {
  const [colour, setColour] = useState('#c6a15b')
  return <div className="paint-playground"><p>Illustrative colour playground · not a product</p><svg viewBox="0 0 220 150" role="img" aria-label="Illustrative 3D printed toy shape recoloured with the selected swatch"><ellipse cx="110" cy="132" rx="67" ry="10" fill="#080808" opacity=".08"/><path d="M47 91 79 39l31 18 31-18 32 52-25 34H72z" fill={colour} stroke="#080808" strokeWidth="2"/><circle cx="91" cy="84" r="5" fill="#080808"/><circle cx="129" cy="84" r="5" fill="#080808"/><path d="M96 104q14 11 28 0" fill="none" stroke="#080808" strokeWidth="3" strokeLinecap="round"/></svg><div className="paint-swatches" role="group" aria-label="Illustration colours">{['#c6a15b', '#e77b5b', '#6c9f93', '#8b83b2', '#f2f0e8'].map((hex) => <button key={hex} aria-label={`Colour ${hex}`} aria-pressed={colour === hex} onClick={() => setColour(hex)}><span style={{ background: hex }} /></button>)}</div><Link href={categoryHref}>Want a kit like this?</Link></div>
}

export function SurpriseMe({ products }: { products: BrowserProduct[] }) {
  const router = useRouter()
  const [animating, setAnimating] = useState(false)
  const surprise = () => { if (!products.length) return; const item = products[Math.floor(Math.random() * products.length)]; setAnimating(true); if (navigator.vibrate) navigator.vibrate(8); window.setTimeout(() => router.push(`/products/${item.slug}`), 160) }
  return <div className="surprise-box"><button onClick={surprise} disabled={animating}>Surprise me <span className={animating ? 'shuffle-turn' : ''} aria-hidden="true">↻</span></button></div>
}

export function KeepExploring() {
  return <section className="keep-exploring"><p>That’s the latest layer.</p><button onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>Back to the top ↑</button></section>
}

export function TakeItWithYou({ brandName, shareURL, whatsappURL, hasVCard }: { brandName: string; shareURL: string; whatsappURL?: string | null; hasVCard: boolean }) {
  const [copied, setCopied] = useState(false)
  const [printed, setPrinted] = useState(false)
  const objectRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = objectRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setPrinted(true); observer.disconnect() } }, { threshold: .4 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: brandName, url: shareURL }) } catch { /* User cancelled the native share sheet. */ }; return }
    try { await navigator.clipboard.writeText(shareURL); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) }
  }
  return <div className="take-with-you"><span ref={objectRef} className={`footer-print-object${printed ? ' is-printed' : ''}`} aria-hidden="true"><i /><i /><i /></span><p>Take it with you</p><div>{hasVCard && <button type="button" onClick={() => document.getElementById('save-contact')?.click()}>Save {brandName} to contacts</button>}<button type="button" onClick={share}>{copied ? 'Link copied' : 'Share this page'}</button>{whatsappURL && <a href={whatsappURL} target="_blank" rel="noopener noreferrer">Send to a friend on WhatsApp</a>}</div><small>If your browser offers it, use “Add to Home Screen” from its share or menu options.</small></div>
}
