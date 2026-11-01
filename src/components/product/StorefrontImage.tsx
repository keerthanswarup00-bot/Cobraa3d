'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

type StorefrontImageProps = Omit<ImageProps, 'src' | 'alt' | 'onError'> & {
  src: string
  alt: string
  fallbackSrc?: string
}

export function StorefrontImage({ src, alt, fallbackSrc, ...props }: StorefrontImageProps) {
  const fallback = fallbackSrc || ''
  const [attempt, setAttempt] = useState({ src, fallback, state: 'primary' as 'primary' | 'fallback' | 'failed' })
  const state = attempt.src === src && attempt.fallback === fallback ? attempt.state : 'primary'
  const currentSrc = state === 'fallback' && fallbackSrc ? fallbackSrc : src

  if (state === 'failed') {
    return (
      <span
        className={`storefront-image-fallback${props.fill ? ' is-fill' : ''}${props.className ? ` ${props.className}` : ''}`}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        style={props.fill ? undefined : { width: props.width, height: props.height }}
      />
    )
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (state === 'primary' && fallbackSrc && fallbackSrc !== src) setAttempt({ src, fallback, state: 'fallback' })
        else setAttempt({ src, fallback, state: 'failed' })
      }}
    />
  )
}
