'use client'

import { useEffect } from 'react'

export function TrackClicks() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
      if (!target) return
      if (!target.href || !target.href.startsWith('https://wa.me/')) return
      try {
        const source = target.getAttribute('data-wa-source') || undefined
        const slug = target.getAttribute('data-wa-slug') || undefined
        if (!source && !slug) return
        const payload = JSON.stringify({ source, slug })
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
