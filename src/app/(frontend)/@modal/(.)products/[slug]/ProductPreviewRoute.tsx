'use client'

import { useEffect, useRef } from 'react'
import type { ProductPreviewData } from '@/lib/productPreview'
import {
  isProductPreviewOpenFor,
  openProductPreview,
  wasProductPreviewClosed,
} from '@/components/product/product-preview-store'

/**
 * The intercepted page is only a route sync. When the listing already opened
 * the sheet from its card data, this does nothing. A soft navigation that did
 * not come from a card (for example a restored history entry) seeds the store
 * once so the stable host can render the sheet.
 */
export function ProductPreviewRoute({ preview }: { preview: ProductPreviewData }) {
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    if (isProductPreviewOpenFor(preview.slug) || wasProductPreviewClosed(preview.slug)) return
    openProductPreview(preview)
  }, [preview])

  return null
}
