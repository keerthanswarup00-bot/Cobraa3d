import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createClient } = require('@libsql/client')

const LOCAL = process.env.LOCAL_SQLITE || 'file:./cobraa3d.db'

async function main() {
  if (!process.env.DATABASE_URI?.startsWith('postgres')) throw new Error('Run against Postgres DATABASE_URI')
  const local = createClient({ url: LOCAL })
  const prod = await getPayload({ config })

  const prods = await local.execute('SELECT id, slug FROM products')
  const images = await local.execute('SELECT _parent_id, _order, image_id, alt FROM products_images ORDER BY _parent_id, _order')
  const mediaRows = await local.execute('SELECT id, filename FROM media')
  const localMedia = new Map<number, string>()
  for (const r of mediaRows.rows) localMedia.set(Number(r.id), String(r.filename))

  const prodMedia = await prod.find({ collection: 'media', limit: 1000, pagination: false, depth: 0, overrideAccess: true })
  const prodMediaByFilename = new Map<string, number | string>()
  const norm = (s: string) => s.replace(/-(\d+)(\.[a-z0-9]+)$/i, '$2')
  for (const m of prodMedia.docs as any[]) if (m.filename) {
    prodMediaByFilename.set(m.filename, m.id)
    prodMediaByFilename.set(norm(m.filename), m.id)
  }

  const byProduct = new Map<number, any[]>()
  for (const r of images.rows) {
    const pid = Number(r._parent_id)
    const filename = localMedia.get(Number(r.image_id))
    const prodId = filename ? prodMediaByFilename.get(filename) : undefined
    if (!prodId) continue
    if (!byProduct.has(pid)) byProduct.set(pid, [])
    byProduct.get(pid)!.push({ image: prodId, alt: String(r.alt || '') })
  }

  let updated = 0, skipped = 0
  for (const p of prods.rows) {
    const rows = byProduct.get(Number(p.id))
    if (!rows || !rows.length) { skipped++; continue }
    const slug = String(p.slug)
    const existing = await prod.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })
    const doc = existing.docs[0] as any
    if (!doc) { skipped++; continue }
    if (doc.images && doc.images.length) { skipped++; continue }
    await prod.update({ collection: 'products', id: doc.id, data: { images: rows }, overrideAccess: true, draft: doc._status !== 'published', context: { disableRevalidate: true } })
    updated++
  }
  console.log('Products updated with images:', updated, 'skipped:', skipped)
  await prod.destroy()
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
