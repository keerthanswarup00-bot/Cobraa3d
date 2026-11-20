'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { flushSync } from 'react-dom'
import { AnimatePresence } from 'motion/react'
import { ProductSheet } from './ProductSheet'
import { canTransitionPreview, getPreviewPhotoOrigin, transitionPreviewPhoto } from './product-motion'
import { restoreCatalogPosition } from './catalog-position'
import {
  closeProductPreview,
  getProductPreviewServerSnapshot,
  getProductPreviewSnapshot,
  subscribeProductPreview,
} from './product-preview-store'

/**
 * The frontend layout keeps the preview mounted independently of the intercepted
 * route. The route can seed the store without restarting the sheet animation.
 */
export function ProductPreviewHost() {
  const router = useRouter()
  const pathname = usePathname()
  const snapshot = useSyncExternalStore(
    subscribeProductPreview,
    getProductPreviewSnapshot,
    getProductPreviewServerSnapshot,
  )
  const navigateBack = useRef(false)
  const closing = useRef(false)
  // The store keeps the last product data after closing, so AnimatePresence can
  // finish the exit animation before the preview is removed.
  const visible = snapshot.open && Boolean(snapshot.data)
  const native = Boolean(snapshot.origin?.element && canTransitionPreview())
  useEffect(() => {
    const root = document.documentElement
    const arrivalPath = root.dataset.productDetailRoute
    if (arrivalPath && arrivalPath !== pathname) {
      delete root.dataset.productDetailRoute
      delete root.dataset.productArrival
      root.style.removeProperty('--product-arrival-cover')
    }
  }, [pathname])

  const handleExitComplete = useCallback(() => {
    closing.current = false
    const shouldGoBack = navigateBack.current
    navigateBack.current = false
    if (location.pathname === '/products') restoreCatalogPosition(true)
    else if (shouldGoBack) router.back()
  }, [router])

  const close = useCallback((shouldGoBack: boolean) => {
    const current = getProductPreviewSnapshot()
    if (!current.open || closing.current) return
    closing.current = true
    navigateBack.current = shouldGoBack

    const card = current.origin?.element
    if (!card || !canTransitionPreview()) {
      closeProductPreview()
      return
    }

    const gallery = document.querySelector<HTMLElement>('.ps-gallery')
    const index = gallery?.clientWidth ? Math.round(gallery.scrollLeft / gallery.clientWidth) : -1
    const photo = card.isConnected && current.origin?.index === index ? getPreviewPhotoOrigin(gallery, index) : undefined
    const transition = transitionPreviewPhoto(photo?.element, closeProductPreview, () => photo ? card : undefined)
    if (transition) void transition.finished.then(handleExitComplete, handleExitComplete)
    else handleExitComplete()
  }, [handleExitComplete])

  const requestClose = useCallback(() => close(true), [close])

  useEffect(() => {
    const onPopState = () => {
      navigateBack.current = false
      close(false)
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || location.pathname !== '/products') return
      closing.current = false
      flushSync(closeProductPreview)
      requestAnimationFrame(() => restoreCatalogPosition(true))
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [close])

  const sheet = visible && snapshot.data ? (
    <ProductSheet key={snapshot.data.slug} data={snapshot.data} origin={snapshot.origin} native={native} onRequestClose={requestClose} />
  ) : null

  return native ? sheet : <AnimatePresence onExitComplete={handleExitComplete}>{sheet}</AnimatePresence>
}
