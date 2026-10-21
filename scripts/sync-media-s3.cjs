const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URI_MIGRATE })
  await c.connect()
  const { rows } = await c.query('SELECT filename, mime_type FROM media ORDER BY id')
  await c.end()

  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
  })

  const src = path.resolve(process.cwd(), 'public/media')
  let ok = 0, missing = 0, failed = 0
  for (const row of rows) {
    const file = path.join(src, row.filename)
    if (!fs.existsSync(file)) { missing++; console.warn('missing local file:', row.filename); continue }
    try {
      await s3.send(new PutObjectCommand({ Bucket: 'media', Key: row.filename, Body: fs.readFileSync(file), ContentType: row.mime_type || 'application/octet-stream' }))
      ok++
    } catch (e) { failed++; console.warn('upload failed:', row.filename, e.message) }
  }
  console.log(`Uploaded: ${ok}, missing: ${missing}, failed: ${failed}, total: ${rows.length}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
