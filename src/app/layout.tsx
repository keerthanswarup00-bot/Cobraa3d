import type React from 'react'

/**
 * The public site and the Payload admin each render their own <html>/<body>
 * document (see `(frontend)/layout.tsx` and `(payload)/admin/layout.tsx`).
 *
 * Keeping the two route trees as separate root layouts makes Next.js merge
 * their client-reference manifests, which pulls the full Payload admin UI
 * bundle into every storefront page. This passthrough keeps a single root
 * layout so each tree gets its own manifest and client chunks.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
