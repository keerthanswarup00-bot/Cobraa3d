import type { ProductPhotoOrigin } from './product-motion'

const arrivalKey = 'cobraa-product-arrival'

export function prepareProductArrival(href: string, image?: HTMLImageElement | null, fallback?: string, origin?: ProductPhotoOrigin) {
  const src = image?.naturalWidth ? image.currentSrc : fallback
  if (!src) return

  try {
    const path = new URL(href, location.href).pathname
    const source = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : origin?.element
    sessionStorage.setItem(arrivalKey, JSON.stringify({ path, src, shared: Boolean(source), expires: Date.now() + 30_000 }))
    if (source) {
      source.classList.add('product-photo-source')
      addEventListener('pageshow', () => source.classList.remove('product-photo-source'), { once: true })
    }
  } catch {
    // The destination can still load its full-size image normally.
  }
}

// Provide the cached photo before the server-rendered gallery can paint.
export const productArrivalScript = `(() => {
  const root = document.documentElement;
  addEventListener('pagereveal', (event) => {
    const galleryReady = root.hasAttribute('data-product-arrival')
      && Array.from(document.querySelectorAll('.detail-main-image[data-initial-photo]'))
        .some((element) => element.getBoundingClientRect().width > 0);
    if (!galleryReady) event.viewTransition?.skipTransition();
  });
  if (!/^\\/products\\/[^/]+\\/?$/.test(location.pathname)) return;
  root.dataset.productDetailRoute = location.pathname;
  try {
    const key = ${JSON.stringify(arrivalKey)};
    const value = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    if (!value) return;
    const cover = JSON.parse(value);
    if (cover.path !== location.pathname || cover.expires <= Date.now()) return;
    const url = new URL(cover.src, location.href);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
    root.style.setProperty('--product-arrival-cover', 'url(' + JSON.stringify(url.href) + ')');
    if (cover.shared) root.dataset.productArrival = '';
  } catch {}
})();`
