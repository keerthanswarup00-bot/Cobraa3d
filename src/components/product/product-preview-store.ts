'use client'

import type { ProductPreviewData } from '@/lib/productPreview'

/**
 * One tiny external store for the single product preview sheet. Product links
 * write the listing data here on tap; the stable host in the @modal layout
 * renders the sheet. Nothing in the route decides whether the shell exists.
 */
type ProductPreviewState = {
  open: boolean
  data: ProductPreviewData | null
  lastClosedSlug: string | null
}

const CLOSED: ProductPreviewState = { open: false, data: null, lastClosedSlug: null }

let state: ProductPreviewState = CLOSED
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function openProductPreview(data: ProductPreviewData) {
  state = { open: true, data, lastClosedSlug: null }
  emit()
}

export function closeProductPreview() {
  if (!state.open) return
  state = { ...state, open: false, lastClosedSlug: state.data?.slug ?? null }
  emit()
}

export function isProductPreviewOpenFor(slug: string): boolean {
  return state.open && state.data?.slug === slug
}

export function wasProductPreviewClosed(slug: string): boolean {
  return state.lastClosedSlug === slug
}

export function subscribeProductPreview(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getProductPreviewSnapshot(): ProductPreviewState {
  return state
}

export function getProductPreviewServerSnapshot(): ProductPreviewState {
  return CLOSED
}
