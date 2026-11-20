import type { SyntheticEvent } from 'react'

// These published photos are also available in the storefront's media archive.
const archivedPhotos = new Map([
  ['WhatsApp Image 2026-10-19 at 22.35.05-1', 'ganesha-3d-printed-idol.jpg'],
  ['WhatsApp Image 2026-10-19 at 22.35.06 (1)-1', 'animal-colouring-kit.jpg'],
  ['WhatsApp Image 2026-10-19 at 22.35.07-1', 'unicorn-colouring-kit.jpg'],
  ['WhatsApp Image 2026-10-19 at 22.35.08 (1)-1', 'hanuman-ji-idol-cross-legged-pose.jpg'],
  ['WhatsApp Image 2026-10-19 at 22.35.08 (2)-1', 'hanuman-ji-idol-meditation-pose.jpg'],
  ['WhatsApp Image 2026-10-19 at 22.35.08-1', 'character-colouring-kit.jpg'],
  ['Warm Ribbed Lamp Interior-1', 'wave-ribbed-tripod-lamp.webp'],
])

function archivedPhoto(url: URL) {
  const prefix = '/storage/v1/object/public/media/'
  if (!url.hostname.endsWith('.supabase.co') || !url.pathname.startsWith(prefix)) return
  const stem = decodeURIComponent(url.pathname.slice(prefix.length)).replace(/(?:-\d+x\d+)?\.(?:jpe?g|webp)$/i, '')
  const file = archivedPhotos.get(stem)
  return file && new URL(`/product-photo-backups/${file}`, window.location.origin).href
}

export function recoverProductPhoto(
  event: SyntheticEvent<HTMLImageElement>,
  source: string | undefined,
  ...fallbacks: (string | null | undefined)[]
) {
  const image = event.currentTarget
  const archive = archivedPhoto(new URL(source ?? image.src, image.baseURI))
  const candidates = [...new Set([archive, ...fallbacks].flatMap((url) => url ? [new URL(url, image.baseURI).href] : []))]
  const next = candidates[candidates.lastIndexOf(image.src) + 1]

  if (!next) {
    image.style.visibility = 'hidden'
    return
  }

  image.removeAttribute('srcset')
  image.src = next
}
