import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = process.argv[2] || '/tmp/cobraa-export'
const MEDIA_SRC = path.resolve(process.cwd(), 'public/media')

async function main() {
  const payload = await getPayload({ config })
  await mkdir(OUT, { recursive: true })
  await mkdir(path.join(OUT, 'media'), { recursive: true })

  const categories = await payload.find({ collection: 'categories', limit: 1000, pagination: false, depth: 0, overrideAccess: true })
  const products = await payload.find({ collection: 'products', limit: 1000, pagination: false, depth: 0, overrideAccess: true, draft: true })
  const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })

  const meta = {
    categories: categories.docs.map((c: any) => ({
      name: c.name, slug: c.slug, description: c.description ?? null, sortOrder: c.sortOrder ?? 0, visible: c.visible ?? true, coverImageId: (c.coverImage && typeof c.coverImage === 'object') ? c.coverImage.id : c.coverImage ?? null,
    })),
    products: products.docs.map((p: any) => ({
      title: p.title, slug: p.slug, status: p.status, _status: p._status, isDemo: p.isDemo ?? false,
      categorySlug: p.category && typeof p.category === 'object' ? p.category.slug : null,
      shortDescription: p.shortDescription ?? null, description: p.description ?? null,
      price: p.price ?? null, originalPrice: p.originalPrice ?? null, currency: p.currency ?? 'INR', priceMode: p.priceMode ?? 'ask',
      dimensions: p.dimensions ?? null, material: p.material ?? null, ageGroup: p.ageGroup ?? null,
      careNotes: p.careNotes ?? null, productionNote: p.productionNote ?? null,
      availability: p.availability ?? null, personalisable: p.personalisable ?? false, personalisationNotes: p.personalisationNotes ?? null,
      badges: p.badges ?? [], featured: p.featured ?? false, seasonalTags: p.seasonalTags ?? [],
      includedItems: p.includedItems ?? [], colourOptions: p.colourOptions ?? [],
      images: (p.images ?? []).map((row: any) => ({ image: row.image && typeof row.image === 'object' ? row.image.filename : null, imageId: row.image && typeof row.image === 'object' ? row.image.id : row.image, alt: row.alt })),
      seoTitle: p.seoTitle ?? null, seoDescription: p.seoDescription ?? null,
      publishedAt: p.publishedAt ?? null, sortOrder: p.sortOrder ?? 0,
    })),
    media: [] as any[],
    siteSettings,
  }

  const media = await payload.find({ collection: 'media', limit: 1000, pagination: false, depth: 0, overrideAccess: true })
  for (const m of media.docs as any[]) {
    if (!m.filename) continue
    meta.media.push({ id: m.id, filename: m.filename, alt: m.alt, caption: m.caption ?? null, mimeType: m.mimeType, filesize: m.filesize })
    const src = path.join(MEDIA_SRC, m.filename)
    const dest = path.join(OUT, 'media', m.filename)
    try { await writeFile(dest, await (await import('node:fs/promises')).readFile(src)) } catch { console.warn('missing media file:', m.filename) }
  }

  await writeFile(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2))
  console.log('Exported:', meta.categories.length, 'categories,', meta.products.length, 'products,', meta.media.length, 'media')
  await payload.destroy()
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
