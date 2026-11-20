'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { ProductPreviewData } from '@/lib/productPreview'
import { isProductPreviewOpenFor, openProductPreview } from './product-preview-store'
import { getProductPhotoOrigin, transitionPreviewPhoto } from './product-motion'
import { rememberCatalogPosition } from './catalog-position'
import { prepareProductArrival } from './product-arrival'

type ProductLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  /** Listing data used to open the preview immediately. */
  preview?: ProductPreviewData | null
}

export function ProductLink({
  href,
  preview,
  onClick,
  target,
  prefetch,
  scroll,
  ...rest
}: ProductLinkProps) {
  const isMobile = useIsMobile()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (target && target !== '_self') return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    rememberCatalogPosition(href)
    if (isMobile) {
      if (!preview) return
      event.preventDefault()
      const origin = preview.images.length ? getProductPhotoOrigin(event.currentTarget, preview.images.length > 1) : undefined
      const open = () => openProductPreview(preview, origin)
      const transition = origin && transitionPreviewPhoto(origin.element, open, () => document.querySelector<HTMLElement>('.ps-gallery'))
      if (!origin) open()
      const navigate = () => {
        if (isProductPreviewOpenFor(preview.slug)) {
          // Give the preview its own history URL. "Know more" replaces this
          // entry with the canonical product URL in a new document.
          const previewUrl = new URL(href, location.href)
          previewUrl.searchParams.set('preview', '1')
          history.pushState(null, '', previewUrl)
        }
      }
      if (transition) void transition.updateCallbackDone.then(navigate, navigate)
      else navigate()
      return
    }

    event.preventDefault()
    const photo = event.currentTarget.closest('.pc-card')?.querySelector<HTMLImageElement>('.pc-media img.a')
    prepareProductArrival(href, photo, undefined, getProductPhotoOrigin(event.currentTarget, false))
    window.location.assign(href)
  }

  return (
    <Link
      {...rest}
      href={href}
      target={target}
      prefetch={isMobile && !preview ? prefetch : false}
      scroll={isMobile ? scroll : true}
      onClick={handleClick}
    />
  )
}
