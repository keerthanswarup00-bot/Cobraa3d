'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'motion/react'
import { ProductSheet } from './ProductSheet'
import {
  closeProductPreview,
  getProductPreviewServerSnapshot,
  getProductPreviewSnapshot,
  subscribeProductPreview,
} from './product-preview-store'

/**
 * The single, stable host for the phone preview sheet. It lives in the @modal
 * layout, so the shell is already mounted when a product link opens it. The
 * intercepted route only seeds the store and never owns the sheet.
 */
export function ProductPreviewHost() {
  const router = useRouter()
  const snapshot = useSyncExternalStore(
    subscribeProductPreview,
    getProductPreviewSnapshot,
    getProductPreviewServerSnapshot,
  )
  const navigateBack = useRef(false)
  // The store keeps the last product data after closing, so AnimatePresence can
  // finish the slide-down before the sheet is removed.
  const visible = snapshot.open && Boolean(snapshot.data)

  // A browser back or iOS swipe-back leaves the intercepted route. Close the
  // sheet without pushing another history entry.
  useEffect(() => {
    const onPopState = () => {
      if (getProductPreviewSnapshot().open) closeProductPreview()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const requestClose = useCallback(() => {
    navigateBack.current = true
    closeProductPreview()
  }, [])

  const handleExitComplete = useCallback(() => {
    if (!navigateBack.current) return
    navigateBack.current = false
    router.back()
  }, [router])

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && snapshot.data ? (
        <ProductSheet key={snapshot.data.slug} data={snapshot.data} onRequestClose={requestClose} />
      ) : null}
    </AnimatePresence>
  )
}
