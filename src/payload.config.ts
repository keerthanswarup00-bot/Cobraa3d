import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { s3Storage } from '@payloadcms/storage-s3'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, type PayloadRequest, type Plugin } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Offers } from './collections/Offers'
import { Announcements } from './collections/Announcements'
import { Enquiries } from './collections/Enquiries'
import { PrintBed } from './collections/PrintBed'
import { Media } from './collections/Media'
import { EnquiryFiles } from './collections/EnquiryFiles'
import { RequestRateLimits } from './collections/RequestRateLimits'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { WhatsappClicks } from './collections/WhatsappClicks'
import { SiteSettings } from './globals/SiteSettings'
import { LegalPages } from './globals/LegalPages'
import { getServerSideURL } from './utilities/getURL'
import { defaultLexical } from '@/fields/defaultLexical'
import { env, getConnectionString, isPostgres } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const cloudStorageConfigured = Boolean(env.S3_BUCKET && env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)
const storagePlugins: Plugin[] = cloudStorageConfigured ? [s3Storage({
  collections: { media: true },
  bucket: env.S3_BUCKET!,
  config: {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION || 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
  },
  clientUploads: true,
})] : []
if (cloudStorageConfigured && env.S3_PRIVATE_BUCKET) {
  storagePlugins.push(s3Storage({
    collections: { 'enquiry-files': { signedDownloads: true } },
    bucket: env.S3_PRIVATE_BUCKET,
    config: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION || 'auto',
      forcePathStyle: true,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
    },
  }))
}

export default buildConfig({
  endpoints: [{
    path: '/festive-mode', method: 'post',
    handler: async (req) => {
      if ((req.user as { role?: string } | null)?.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 })
      let requested: unknown
      try { requested = req.json ? (await req.json()).active : undefined } catch { return Response.json({ error: 'Send an active boolean.' }, { status: 400 }) }
      if (typeof requested !== 'boolean') return Response.json({ error: 'Send an active boolean.' }, { status: 400 })
      const [offers, announcements] = await Promise.all([
        req.payload.find({ collection: 'offers', where: { style: { equals: 'festive' } }, limit: 100, depth: 0, overrideAccess: true }),
        req.payload.find({ collection: 'announcements', where: { type: { equals: 'festive' } }, limit: 100, depth: 0, overrideAccess: true }),
      ])
      await Promise.all([
        ...offers.docs.map((offer) => req.payload.update({ collection: 'offers', id: offer.id, data: { active: requested }, overrideAccess: true })),
        ...announcements.docs.map((announcement) => req.payload.update({ collection: 'announcements', id: announcement.id, data: { active: requested }, overrideAccess: true })),
      ])
      return Response.json({ active: requested, updated: offers.docs.length + announcements.docs.length })
    },
  }],
  admin: {
    components: {
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: { baseDir: path.resolve(dirname) },
    user: Users.slug,
    livePreview: { breakpoints: [
      { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
      { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
      { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
    ] },
  },
  editor: defaultLexical,
  db: isPostgres
    ? postgresAdapter({ pool: { connectionString: getConnectionString()!, max: 3 }, push: false })
    : sqliteAdapter({ client: { url: env.DATABASE_URI || 'file:./cobraa3d.db' } }),
  collections: [
    { ...Products, admin: { ...Products.admin, group: 'Catalogue' } },
    { ...Categories, admin: { ...Categories.admin, group: 'Catalogue' } },
    { ...Offers, admin: { ...Offers.admin, group: 'Promotions' } },
    { ...Announcements, admin: { ...Announcements.admin, group: 'Promotions' } },
    { ...Enquiries, admin: { ...Enquiries.admin, group: 'Customers' } },
    EnquiryFiles,
    RequestRateLimits,
    { ...PrintBed, admin: { ...PrintBed.admin, group: 'Content' } },
    { ...Media, admin: { ...Media.admin, group: 'Content' } },
    { ...Users, admin: { ...Users.admin, group: 'Team' } },
    WhatsappClicks,
  ],
  cors: [process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000'].filter((v): v is string => Boolean(v)),
  csrf: [process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000'].filter((v): v is string => Boolean(v)),
  globals: [
    { ...SiteSettings, admin: { ...SiteSettings.admin, group: 'Website' } },
    { ...LegalPages, admin: { ...LegalPages.admin, group: 'Website' } },
  ],
  plugins: [
    ...storagePlugins,
    seoPlugin({ collections: ['products'], uploadsCollection: 'media' }),
    searchPlugin({ collections: ['products'], deleteDrafts: true }),
    redirectsPlugin({ collections: ['products'] }),
    importExportPlugin({ collections: [{ slug: 'enquiries', import: true, export: true }], defaultVersionStatus: 'draft' }),
  ],
  secret: env.PAYLOAD_SECRET,
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  jobs: {
    access: { run: ({ req }: { req: PayloadRequest }): boolean => {
      if (req.user) return true
      const secret = env.CRON_SECRET
      return Boolean(secret && req.headers.get('authorization') === `Bearer ${secret}`)
    } },
    tasks: [],
  },
})
