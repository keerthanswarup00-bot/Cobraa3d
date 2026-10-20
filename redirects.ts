import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  return [
    internetExplorerRedirect,
    {
      source: '/painting-kits',
      destination: '/products',
      permanent: true,
    },
    {
      source: '/categories/:slug*',
      destination: '/products',
      permanent: true,
    },
  ]
}
