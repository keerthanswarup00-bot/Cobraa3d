import { flushSync } from 'react-dom'

export type ProductPhotoOrigin = {
  element: HTMLElement
  url: string
  index: number
}

function capturePhoto(
  element: HTMLElement,
  image: HTMLImageElement | null | undefined,
  index: number,
): ProductPhotoOrigin | undefined {
  if (!image?.naturalWidth || !image.currentSrc) return
  const { width, height, top, bottom } = element.getBoundingClientRect()
  if (!width || !height || bottom <= 0 || top >= window.innerHeight) return
  return { element, url: image.currentSrc, index }
}

export function getProductPhotoOrigin(link: HTMLAnchorElement, hasSecondPhoto: boolean) {
  const media = link.closest('.pc-card')?.querySelector<HTMLElement>('.pc-media')
  if (!media) return
  const secondary = hasSecondPhoto ? media.querySelector<HTMLImageElement>('img.b') : undefined
  const showingSecondary = Boolean(secondary?.naturalWidth && Number(getComputedStyle(secondary).opacity) > 0.5)
  return capturePhoto(media, showingSecondary ? secondary : media.querySelector<HTMLImageElement>('img.a'), showingSecondary ? 1 : 0)
}

export function getPreviewPhotoOrigin(gallery: HTMLElement | null, index: number) {
  if (!gallery) return
  return capturePhoto(gallery, gallery.querySelectorAll('img')[index], index)
}

export function canTransitionPreview() {
  return typeof document !== 'undefined'
    && typeof document.startViewTransition === 'function'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let activePreviewTransition: { animation: ViewTransition; clear: () => void } | undefined

export function clearPreviewPhotoTransition() {
  activePreviewTransition?.animation.skipTransition()
  activePreviewTransition?.clear()
}

/**
 * The preview uses a synchronous external store. Commit its change between
 * the browser's old and new snapshots so the actual photos form one pair.
 */
export function transitionPreviewPhoto(
  source: HTMLElement | undefined,
  update: () => void,
  getDestination: () => HTMLElement | null | undefined,
) {
  clearPreviewPhotoTransition()
  if (!canTransitionPreview()) {
    update()
    return
  }

  const root = document.documentElement
  root.dataset.productPreviewTransition = ''
  source?.classList.add('product-photo-source')
  let destination: HTMLElement | null | undefined
  const animation = document.startViewTransition(() => {
    source?.classList.remove('product-photo-source')
    flushSync(update)
    destination = getDestination()
    destination?.classList.add('product-photo-source')
  })

  const clear = () => {
    if (activePreviewTransition?.animation !== animation) return
    source?.classList.remove('product-photo-source')
    destination?.classList.remove('product-photo-source')
    delete root.dataset.productPreviewTransition
    activePreviewTransition = undefined
  }

  activePreviewTransition = { animation, clear }
  void animation.ready.catch(() => {})
  void animation.finished.then(clear, clear)
  return animation
}
