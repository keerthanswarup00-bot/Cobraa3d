/** 1.91:1, the shape WhatsApp, iMessage, Facebook, LinkedIn and X all show as a full-width preview card. */
export const SHARE_IMAGE_WIDTH = 1200
export const SHARE_IMAGE_HEIGHT = 630
/** The site's off-white page colour, so the preview feels like the shop rather than a pasted photo. */
export const SHARE_IMAGE_BACKGROUND = '#f6f5f1'

export function getProductShareVersion(updatedAt?: string | null): number {
  const version = Date.parse(updatedAt || '')
  return Number.isFinite(version) ? version : 0
}

export function getProductShareImageURL(baseURL: string, slug: string, updatedAt?: string | null): string {
  return `${baseURL.replace(/\/$/, '')}/products/${encodeURIComponent(slug)}/share.jpg?v=${getProductShareVersion(updatedAt)}`
}
