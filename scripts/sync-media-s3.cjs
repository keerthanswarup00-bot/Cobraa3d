const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function main() {
  const connectionString = process.env.DATABASE_URI_MIGRATE
  const bucket = process.env.S3_BUCKET
  const endpoint = process.env.S3_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  const missing = [
    ['DATABASE_URI_MIGRATE', connectionString],
    ['S3_BUCKET', bucket],
    ['S3_ENDPOINT', endpoint],
    ['S3_ACCESS_KEY_ID', accessKeyId],
    ['S3_SECRET_ACCESS_KEY', secretAccessKey],
  ].filter(([, value]) => !value).map(([name]) => name)

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  const c = new Client({ connectionString })
  await c.connect()
  let rows
  try {
    ;({ rows } = await c.query('SELECT filename, mime_type FROM media ORDER BY id'))
  } finally {
    await c.end()
  }

  const s3 = new S3Client({
    endpoint,
    region: process.env.S3_REGION || 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })

  const src = path.resolve(process.cwd(), 'public/media')
  let ok = 0
  let missingFiles = 0
  let failed = 0

  for (const row of rows) {
    const file = path.join(src, row.filename)
    if (!fs.existsSync(file)) {
      missingFiles++
      console.warn('missing local file:', row.filename)
      continue
    }

    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: row.filename,
        Body: fs.readFileSync(file),
        ContentType: row.mime_type || 'application/octet-stream',
      }))
      ok++
    } catch (error) {
      failed++
      console.warn('upload failed:', row.filename, error instanceof Error ? error.message : 'Unknown upload error')
    }
  }

  console.log(`Uploaded: ${ok}, missing: ${missingFiles}, failed: ${failed}, total: ${rows.length}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Media sync failed')
  process.exitCode = 1
})
