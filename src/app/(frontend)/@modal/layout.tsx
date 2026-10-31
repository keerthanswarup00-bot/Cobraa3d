import type { ReactNode } from 'react'
import { ProductPreviewHost } from '@/components/product/ProductPreviewHost'

/**
 * The @modal slot layout is the one stable place for the preview shell. It is
 * mounted for every frontend page, so opening a product never waits for the
 * intercepted route or a second modal component to hydrate.
 */
export default function ModalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ProductPreviewHost />
    </>
  )
}
