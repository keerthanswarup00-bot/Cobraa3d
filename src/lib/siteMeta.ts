import { SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH } from './shareImage-constants'

// Same sentence the home page shows as its hero fallback, so the link preview and the page say the same thing
// until an editor fills in SEO and Sharing in Site Settings.
export const DEFAULT_SITE_DESCRIPTION = 'Colouring kits, thoughtful gifts and playful designs made to bring imagination to life.'

/** Static 1200x630 brand image (public/share-default.jpg, built by scripts/make-og.mjs). */
export function defaultShareImage(alt: string) {
  return { url: '/share-default.jpg', width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT, type: 'image/jpeg', alt }
}
