import { z } from 'zod'

const serverSchema = z.object({
  DATABASE_URI: z.string().optional(),
  DATABASE_URI_MIGRATE: z.string().optional(),
  PAYLOAD_SECRET: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  MIGRATING: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
})

const parsed = serverSchema.safeParse({
  DATABASE_URI: process.env.DATABASE_URI || process.env.DATABASE_URL,
  DATABASE_URI_MIGRATE: process.env.DATABASE_URI_MIGRATE,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_REGION: process.env.S3_REGION,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  MIGRATING: process.env.MIGRATING,
  NODE_ENV: process.env.NODE_ENV,
})

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
  throw new Error(`Missing or invalid environment variables: ${missing}`)
}

export const env = parsed.data
export const isPostgres = Boolean(env.DATABASE_URI?.startsWith('postgres'))
export const getConnectionString = () => {
  if (process.env.MIGRATING === '1' && env.DATABASE_URI_MIGRATE) {
    return env.DATABASE_URI_MIGRATE
  }
  return env.DATABASE_URI
}
