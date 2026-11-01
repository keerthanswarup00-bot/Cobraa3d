'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

type ProductImageProps = {
  src?: string | null
  slug: string
  alt: string
  sizes: string
  className?: string
  imageClassName?: string
  loading?: ImageProps['loading']
  preload?: boolean
  unoptimized?: boolean
  quality?: number
  decoding?: ImageProps['decoding']
}

function ProductImageFallback() {
  return (
    <span className="product-image-fallback" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" focusable="false">
        <path d="M9 12h14l-2.2-6H11.2L9 12Z" />
        <path d="M12 12v4.5a4 4 0 0 0 8 0V12M16 20.5V25m-5 2h10" />
      </svg>
    </span>
  )
}

export function ProductImage({
  src,
  slug,
  alt,
  sizes,
  className,
  imageClassName,
  loading,
  preload = false,
  unoptimized,
  quality = 75,
  decoding = 'async',
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const classNames = ['product-image-frame', className].filter(Boolean).join(' ')

  return (
    <div className={classNames}>
      {!src || failedSrc === src ? (
        <ProductImageFallback />
      ) : (
        <Image
          className={imageClassName}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          {...(preload ? { preload: true } : loading ? { loading } : {})}
          {...(unoptimized ? { unoptimized: true } : {})}
          decoding={decoding}
          onError={() => {
            setFailedSrc(src)
            console.warn(`Product image fallback used for slug "${slug}".`)
          }}
        />
      )}
    </div>
  )
}
