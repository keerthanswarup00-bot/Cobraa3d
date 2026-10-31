'use client'

import { useSyncExternalStore } from 'react'

/**
 * Phone / touch layout: narrow viewport AND a coarse primary pointer.
 * The coarse-pointer check keeps a narrow desktop window on the full page instead
 * of opening the mobile preview sheet.
 */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px) and (pointer: coarse)'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}

  const media = window.matchMedia(MOBILE_MEDIA_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

// SSR and the first client render always report false, so the server markup is
// the normal desktop link. The store updates immediately after hydration.
function getServerSnapshot() {
  return false
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
