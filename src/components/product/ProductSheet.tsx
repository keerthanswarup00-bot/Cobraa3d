'use client'

// The one phone preview sheet. It is mounted by ProductPreviewHost in the
// @modal layout, so the shell exists before any route data arrives.
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type UIEvent,
} from 'react'
import { motion, useDragControls, useReducedMotion } from 'motion/react'
import { ArrowRight, Share2, X } from 'lucide-react'
import type { ProductPreviewData } from '@/lib/productPreview'
import './product-sheet.css'

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'

function WhatsAppIcon() {
  return (
    <svg className="ps-wa-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.15-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 6.86 12.4 8.1 8.1 0 0 1-10.96 2.55l-.36-.22-3.05.89.9-2.97-.24-.38A8.1 8.1 0 0 1 12.04 3.8Zm-3.3 3.62c-.18 0-.46.07-.7.33-.24.26-.92.9-.92 2.19 0 1.28.94 2.52 1.07 2.7.13.17 1.82 2.9 4.5 3.95 2.22.87 2.68.7 3.16.65.48-.04 1.55-.63 1.77-1.24.22-.61.22-1.13.15-1.24-.07-.11-.26-.17-.55-.31-.28-.14-1.68-.83-1.94-.92-.26-.1-.45-.15-.64.14-.19.28-.73.92-.9 1.11-.16.19-.33.21-.61.07-.28-.14-1.19-.44-2.27-1.4-.84-.75-1.4-1.67-1.57-1.95-.16-.29-.02-.44.13-.58.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.49-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55Z"
      />
    </svg>
  )
}

function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    )
  }

  try {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(field)
    return Promise.resolve(copied)
  } catch {
    return Promise.resolve(false)
  }
}

/**
 * The sheet animates in once on mount and animates out through the host's
 * AnimatePresence. All close paths call onRequestClose, which closes the store;
 * the host navigates back after the exit animation finishes.
 */
export function ProductSheet({
  data,
  onRequestClose,
}: {
  data: ProductPreviewData
  onRequestClose: () => void
}) {
  const reduce = useReducedMotion()
  const controls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)
  const noticeTimer = useRef<number | null>(null)
  const titleId = useId()
  const [slide, setSlide] = useState(0)
  const [notice, setNotice] = useState('')
  const productHref = `/products/${encodeURIComponent(data.slug)}`
  const hasMultipleImages = data.images.length > 1

  const showNotice = useCallback((message: string) => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    setNotice(message)
    noticeTimer.current = window.setTimeout(() => setNotice(''), 1600)
  }, [])

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    },
    [],
  )

  const share = async () => {
    const url = `${window.location.origin}${productHref}`
    const payload = { title: data.title, text: data.description || data.title, url }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(payload)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    showNotice((await copyText(url)) ? 'Link copied' : 'Could not copy link')
  }

  const handleGalleryScroll = (event: UIEvent<HTMLDivElement>) => {
    const gallery = event.currentTarget
    if (!gallery.clientWidth) return
    const next = Math.round(gallery.scrollLeft / gallery.clientWidth)
    setSlide((current) => (current === next ? current : next))
  }

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    controls.start(event)
  }

  // Lock the page once while the sheet is mounted and put the listing back at
  // the exact scroll offset on close. position:fixed is what stops iOS Safari
  // from scrolling the page behind the sheet.
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const { body, documentElement } = document
    const scrollY = window.scrollY
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
    sheetRef.current?.focus({ preventScroll: true })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onRequestClose()
        return
      }
      if (event.key !== 'Tab' || !sheetRef.current) return
      const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) {
        event.preventDefault()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const inside = sheetRef.current.contains(document.activeElement)
      if (!inside || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.paddingRight = previous.paddingRight
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
      trigger?.focus?.({ preventScroll: true })
    }
  }, [onRequestClose])

  const sheetTransition = reduce
    ? { duration: 0.01 }
    : { duration: 0.28, ease: 'easeOut' as const }
  const backdropTransition = reduce
    ? { duration: 0.01 }
    : { duration: 0.15, ease: 'easeOut' as const }

  return (
    <>
      <motion.div
        key="backdrop"
        className="ps-backdrop"
        onClick={onRequestClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={backdropTransition}
      />
      <motion.div
        key="sheet"
        ref={sheetRef}
        className="ps-sheet"
        data-component="ProductSheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onRequestClose()
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={sheetTransition}
      >
        <div className="ps-media">
          <div className="ps-grab" onPointerDown={startDrag}>
            <span className="ps-handle" aria-hidden="true" />
          </div>

          <div className="ps-actions">
            <button type="button" className="ps-icon-btn" onClick={onRequestClose} aria-label="Close">
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className="ps-icon-btn" onClick={share} aria-label="Share">
              <Share2 size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {data.images.length > 0 ? (
            <div className="ps-gallery" onScroll={handleGalleryScroll} aria-label="Product photos">
              {data.images.map((image, index) => (
                <img
                  key={`${image.url}-${index}`}
                  className="ps-img"
                  src={image.url}
                  alt={image.alt || data.title}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                />
              ))}
            </div>
          ) : (
            <div className="ps-gallery ps-gallery-empty" aria-hidden="true" />
          )}

          {hasMultipleImages && (
            <div className="ps-dots" aria-hidden="true">
              {data.images.map((_, index) => (
                <span key={index} data-on={index === slide ? 'true' : 'false'} />
              ))}
            </div>
          )}
        </div>

        <div className="ps-body">
          <h2 id={titleId} className="ps-title">
            {data.title}
          </h2>
          {data.priceLabel && <p className="ps-price">{data.priceLabel}</p>}
          {data.description && <p className="ps-desc">{data.description}</p>}
        </div>

        {notice && (
          <p className="ps-notice" role="status">
            {notice}
          </p>
        )}

        <div className="ps-cta">
          <a className="ps-know" href={productHref}>
            <span>Know more</span>
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </a>
          <a className="ps-order" href={data.whatsappHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            <span>Place order</span>
          </a>
        </div>
      </motion.div>
    </>
  )
}
