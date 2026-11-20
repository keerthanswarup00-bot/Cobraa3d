const catalogPositionKey = 'cobraa-catalog-position'

type CatalogPosition = { href: string; product: string; top: number; returnRequested?: boolean }

function readCatalogPosition(): CatalogPosition | undefined {
  try {
    const value = sessionStorage.getItem(catalogPositionKey)
    if (value) return JSON.parse(value)
  } catch {
    // Normal navigation still works without tab storage.
  }
}

export function rememberCatalogPosition(product: string) {
  if (location.pathname !== '/products') return
  const position: CatalogPosition = {
    href: location.pathname + location.search + location.hash,
    product: new URL(product, location.href).pathname,
    top: window.scrollY,
  }
  try {
    history.replaceState({ ...history.state, cobraaCatalogPosition: position }, '')
    sessionStorage.setItem(catalogPositionKey, JSON.stringify(position))
  } catch {
    // The browser can still restore scroll on Back.
  }
}

export function returnToCatalog() {
  const position = readCatalogPosition()
  if (!position || position.product !== location.pathname) return false

  try {
    sessionStorage.setItem(catalogPositionKey, JSON.stringify({ ...position, returnRequested: true }))
  } catch {
    // The saved filters can still be used when scroll cannot be restored.
  }
  location.assign(position.href)
  return true
}

export function restoreCatalogPosition(returning = false) {
  if (location.pathname !== '/products' || document.body.style.position === 'fixed') return
  const href = location.pathname + location.search + location.hash
  const saved = readCatalogPosition()
  const historyPosition: CatalogPosition | undefined = history.state?.cobraaCatalogPosition
  const useSaved = saved?.href === href && (returning || saved.returnRequested)
  const position = historyPosition?.href === href ? historyPosition : useSaved ? saved : undefined
  if (!position) return

  window.scrollTo({ top: position.top, behavior: 'instant' })
  try {
    // Mark the reconstructed entry as well, so subsequent browser Back works.
    history.replaceState({ ...history.state, cobraaCatalogPosition: position }, '')
    if (saved?.returnRequested) sessionStorage.setItem(catalogPositionKey, JSON.stringify({ ...saved, returnRequested: false }))
  } catch {
    // Scroll has already been restored for this visit.
  }
}

// A cached listing can paint before React resumes, and a streamed listing can
// paint while its scripts are still in flight. Restore before either paints.
export const catalogRestoreScript = `(() => {
  if (location.pathname !== '/products') return;
  let stop;
  function restore(returning) {
    stop?.();
    try {
      const href = location.pathname + location.search + location.hash;
      const saved = JSON.parse(sessionStorage.getItem(${JSON.stringify(catalogPositionKey)}) || 'null');
      const entry = history.state?.cobraaCatalogPosition;
      const position = entry?.href === href ? entry : saved?.href === href && (returning || saved.returnRequested) ? saved : null;
      if (!position || !Number.isFinite(position.top)) return;
      let frame;
      const observer = new MutationObserver(schedule);
      const timeout = setTimeout(clear, 12000);
      function clear() {
        observer.disconnect();
        cancelAnimationFrame(frame);
        clearTimeout(timeout);
        stop = undefined;
      }
      function settle() {
        if (location.pathname + location.search + location.hash !== href) return clear();
        const grid = document.querySelector('.pc-grid');
        const root = document.scrollingElement;
        if (!grid?.getBoundingClientRect().width || !root || document.body.style.position === 'fixed') return;
        if (root.scrollHeight - root.clientHeight + 1 < position.top) return;
        window.scrollTo({ top: position.top, behavior: 'instant' });
        clear();
      }
      function schedule() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(settle);
      }
      stop = clear;
      observer.observe(document.documentElement, { childList: true, attributes: true, subtree: true });
      schedule();
    } catch {}
  }
  const back = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  restore(back);
  addEventListener('pageshow', (event) => restore(event.persisted || back));
})();`
