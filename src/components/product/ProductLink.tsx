'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent, PointerEvent } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { ProductPreviewData } from '@/lib/productPreview'
import { openProductPreview } from './product-preview-store'

type ProductLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  /** Listing data used to open the phone sheet immediately on tap. */
  preview?: ProductPreviewData | null
}

/**
 * Product links use the intercepted route on phones. When the listing already
 * has the preview data, the tap opens the sheet from that data and pushes the
 * URL at the same time; the intercepted page is only a route sync. Desktop
 * clicks hard-navigate to the real product page and bypass interception.
 */
export function ProductLink({
  href,
  preview,
  onClick,
  onPointerDown,
  target,
  prefetch,
  scroll,
  ...rest
}: ProductLinkProps) {
  const isMobile = useIsMobile()
  const router = useRouter()

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return
    if (!isMobile || !preview) return
    router.prefetch(href)
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (target && target !== '_self') return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    if (isMobile) {
      if (!preview) return
      event.preventDefault()
      openProductPreview(preview)
      router.push(href, { scroll: false })
      return
    }

    event.preventDefault()
    window.location.assign(href)
  }

  return (
    <Link
      {...rest}
      href={href}
      target={target}
      prefetch={isMobile ? prefetch : false}
      scroll={isMobile ? scroll : true}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    />
  )
}
