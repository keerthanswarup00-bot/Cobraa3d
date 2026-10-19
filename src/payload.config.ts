import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
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
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { LegalPages } from './globals/LegalPages'
import { getServerSideURL } from './utilities/getURL'
import { defaultLexical } from '@/fields/defaultLexical'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const databaseURL = process.env.DATABASE_URL
const usePostgres = Boolean(databaseURL?.startsWith('postgres'))

const cloudStorageConfigured = Boolean(process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)
const storagePlugins: Plugin[] = cloudStorageConfigured ? [s3Storage({
  collections: { media: true },
  bucket: process.env.S3_BUCKET!,
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
  },
})] : []

export default buildConfig({
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
  db: usePostgres
    ? postgresAdapter({ pool: { connectionString: databaseURL } })
    : sqliteAdapter({ client: { url: databaseURL || 'file:./cobraa3d.db' } }),
  collections: [
    { ...Products, admin: { ...Products.admin, group: 'Catalogue' } },
    { ...Categories, admin: { ...Categories.admin, group: 'Catalogue' } },
    { ...Offers, admin: { ...Offers.admin, group: 'Promotions' } },
    { ...Announcements, admin: { ...Announcements.admin, group: 'Promotions' } },
    { ...Enquiries, admin: { ...Enquiries.admin, group: 'Enquiries' } },
    { ...PrintBed, admin: { ...PrintBed.admin, group: 'Site' } },
    { ...Media, admin: { ...Media.admin, group: 'Site' } },
    { ...Users, admin: { ...Users.admin, group: 'Team' } },
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [SiteSettings, LegalPages],
  plugins: [
    ...storagePlugins,
    seoPlugin({ collections: ['products'], uploadsCollection: 'media' }),
    searchPlugin({ collections: ['products'], deleteDrafts: true }),
    redirectsPlugin({ collections: ['products'] }),
    importExportPlugin({ collections: [{ slug: 'enquiries', import: true, export: true }], defaultVersionStatus: 'draft' }),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  jobs: {
    access: { run: ({ req }: { req: PayloadRequest }): boolean => {
      if (req.user) return true
      const secret = process.env.CRON_SECRET
      return Boolean(secret && req.headers.get('authorization') === `Bearer ${secret}`)
    } },
    tasks: [],
  },
})
