import type { SyntheticEvent } from 'react'

export function recoverProductPhoto(event: SyntheticEvent<HTMLImageElement>, ...fallbacks: (string | null | undefined)[]) {
  const image = event.currentTarget
  const candidates = fallbacks.filter(Boolean).map((url) => new URL(url!, image.baseURI).href)
  const failed = image.src
  const next = candidates.slice(candidates.lastIndexOf(failed) + 1).find((url) => url !== failed)

  if (!next) {
    image.style.visibility = 'hidden'
    return
  }

  image.removeAttribute('srcset')
  image.src = next
}
