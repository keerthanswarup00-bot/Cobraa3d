import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Keep preview, development, and test deployments out of search engines.
 * This is intentionally based on deployment environment variables at build time,
 * never on the incoming request Host header.
 */
const isProductionBuild = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : process.env.NODE_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProductionBuild) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/next'],
    },
    sitemap: `${getServerSideURL().replace(/\\/$/, '')}/sitemap.xml`,
  }
}
