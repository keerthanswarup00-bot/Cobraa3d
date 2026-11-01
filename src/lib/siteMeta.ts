import { SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH } from './shareImage-constants'

// Fallback for any page without its own description, until an editor fills in SEO and Sharing in Site Settings.
// Keep in step with the home page description (src/app/(frontend)/page.tsx).
export const DEFAULT_SITE_DESCRIPTION = '3D printing studio in Hoskote, Bengaluru. Custom 3D prints, 3D printed lamps, idols and gifts, made to order. Order on WhatsApp with delivery across India.'

/** Static 1200x630 brand image (public/share-default.jpg, built by scripts/make-og.mjs). */
export function defaultShareImage(alt: string) {
  return { url: '/share-default.jpg', width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT, type: 'image/jpeg', alt }
}

/** Open Graph + Twitter tags for a static page, so shared links show the page's own title and description. */
export function pageSocial({ title, description, path }: { title: string; description: string; path: string }) {
  const image = defaultShareImage('Cobraa 3D, 3D printing studio in Hoskote, Bengaluru')
  return {
    openGraph: { type: 'website' as const, siteName: 'Cobraa 3D', locale: 'en_IN', title, description, url: path, images: [image] },
    twitter: { card: 'summary_large_image' as const, title, description, images: [image.url] },
  }
}
