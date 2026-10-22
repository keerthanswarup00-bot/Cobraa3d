'use client'

import { useEffect } from 'react'

const SOURCE_KEY = 'cobraa-src'

/** Keeps the campaign that sent the visitor, for example a stall QR or a push. */
function readSource() {
  try {
    const stored = window.sessionStorage.getItem(SOURCE_KEY)
    return stored && stored.length <= 20 ? stored : ''
  } catch {
    return ''
  }
}

function storeSource(value: string) {
  const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20)
  if (!clean) return
  try { window.sessionStorage.setItem(SOURCE_KEY, clean) } catch { /* storage is optional */ }
}

export function TrackClicks() {
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('src')
    if (requested) storeSource(requested)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
      if (!target) return
      if (!target.href || !target.href.startsWith('https://wa.me/')) return
      try {
        const source = target.getAttribute('data-wa-source') || undefined
        const slug = target.getAttribute('data-wa-slug') || undefined
        if (!source && !slug) return
        const campaign = readSource()
        const label = [source, campaign].filter(Boolean).join('|')
        const payload = JSON.stringify({ source: label || undefined, slug })
        navigator.sendBeacon('/api/track', payload)
      } catch {
        // ignore
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return null
}
