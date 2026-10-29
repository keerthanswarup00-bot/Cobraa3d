import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' , disallow: '/admin/' }, sitemap: `${getServerSideURL()}/sitemap.xml` }
}
