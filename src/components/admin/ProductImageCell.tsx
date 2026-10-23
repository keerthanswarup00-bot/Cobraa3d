'use client'

import { useEffect, useState } from 'react'
import type { DefaultCellComponentProps } from 'payload'

type ProductPhoto = { image?: number | string | { id?: number | string; url?: string | null; alt?: string | null } | null }

export function ProductImageCell({ cellData, className }: DefaultCellComponentProps) {
  const photos = Array.isArray(cellData) ? cellData as ProductPhoto[] : []
  const image = photos[0]?.image
  const [url, setUrl] = useState(typeof image === 'object' && image ? image.url || '' : '')
  const alt = typeof image === 'object' && image ? image.alt || 'Product image' : 'Product image'

  useEffect(() => {
    const id = typeof image === 'object' && image ? image.id : image
    if (!id || url) return
    let active = true
    fetch(`/api/media/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : null)
      .then((media: { url?: string | null } | null) => { if (active && media?.url) setUrl(media.url) })
      .catch(() => {})
    return () => { active = false }
  }, [image, url])

  return <div className={className} style={{ alignItems: 'center', display: 'flex', minHeight: 48 }}>
    {url ? <img src={url} alt={alt} width={42} height={42} style={{ borderRadius: 5, objectFit: 'cover' }} /> : <span aria-label="No product image" style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>—</span>}
  </div>
}
