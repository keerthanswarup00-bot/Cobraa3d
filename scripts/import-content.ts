import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const DIR = process.argv[2] || '/tmp/cobraa-export'

async function main() {
  if (!process.env.DATABASE_URI || !process.env.DATABASE_URI.startsWith('postgres')) {
    throw new Error('This script must run against the Postgres database (set DATABASE_URI to the postgres connection string).')
  }
  const meta = JSON.parse(await readFile(path.join(DIR, 'meta.json'), 'utf8'))
  const payload = await getPayload({ config })

  const catIdBySlug: Record<string, number | string> = {}
  for (const c of meta.categories) {
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: c.slug } }, limit: 1, overrideAccess: true, depth: 0 })
    if (existing.docs[0]) { catIdBySlug[c.slug] = existing.docs[0].id; continue }
    const created = await payload.create({ collection: 'categories', data: { name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder, visible: c.visible }, overrideAccess: true, context: { disableRevalidate: true } })
    catIdBySlug[c.slug] = created.id
  }
  console.log('Categories done:', Object.keys(catIdBySlug).length)

  const mediaIdByFilename: Record<string, number | string> = {}
  for (const m of meta.media) {
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: m.filename } }, limit: 1, overrideAccess: true, depth: 0 })
    if (existing.docs[0]) { mediaIdByFilename[m.filename] = existing.docs[0].id; continue }
    try {
      const filePath = path.join(DIR, 'media', m.filename)
      const data = await readFile(filePath)
      const created = await payload.create({
        collection: 'media',
        data: { alt: m.alt },
        file: { data, mimetype: m.mimeType, name: m.filename, size: data.length },
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      mediaIdByFilename[m.filename] = created.id
    } catch (e) {
      console.warn('media upload failed:', m.filename, (e as Error).message)
    }
  }
  console.log('Media done:', Object.keys(mediaIdByFilename).length)

  let made = 0
  for (const p of meta.products) {
    const existing = await payload.find({ collection: 'products', where: { slug: { equals: p.slug } }, limit: 1, overrideAccess: true, depth: 0 })
    if (existing.docs[0]) continue
    const images = (p.images || []).filter((row: any) => row.image && mediaIdByFilename[row.image]).map((row: any) => ({ image: mediaIdByFilename[row.image], alt: row.alt }))
    const data: any = {
      title: p.title, slug: p.slug, status: p.status, isDemo: p.isDemo,
      category: p.categorySlug ? catIdBySlug[p.categorySlug] : undefined,
      shortDescription: p.shortDescription, description: p.description,
      price: p.price, originalPrice: p.originalPrice, currency: p.currency, priceMode: p.priceMode,
      dimensions: p.dimensions, material: p.material, ageGroup: p.ageGroup, careNotes: p.careNotes, productionNote: p.productionNote,
      availability: p.availability, personalisable: p.personalisable, personalisationNotes: p.personalisationNotes,
      badges: p.badges, featured: p.featured,
      seasonalTags: p.seasonalTags, includedItems: p.includedItems, colourOptions: p.colourOptions,
      images, seoTitle: p.seoTitle, seoDescription: p.seoDescription, publishedAt: p.publishedAt, sortOrder: p.sortOrder,
    }
    try {
      await payload.create({ collection: 'products', data, overrideAccess: true, draft: p._status !== 'published', context: { disableRevalidate: true } })
      made += 1
    } catch (e) {
      console.warn('product create failed:', p.slug, (e as Error).message)
    }
  }
  console.log('Products created:', made)

  const s = meta.siteSettings
  const settingsData: any = { ...s }
  delete settingsData.id; delete settingsData.createdAt; delete settingsData.updatedAt
  delete settingsData.ogImage; delete settingsData.vcard?.photo; delete settingsData.studioPhotos
  if (s.ogImage && typeof s.ogImage === 'object' && mediaIdByFilename[s.ogImage.filename]) settingsData.ogImage = mediaIdByFilename[s.ogImage.filename]
  if (s.vcard?.photo && typeof s.vcard.photo === 'object' && mediaIdByFilename[s.vcard.photo.filename]) settingsData.vcard = { ...settingsData.vcard, photo: mediaIdByFilename[s.vcard.photo.filename] }
  if (Array.isArray(s.studioPhotos)) {
    settingsData.studioPhotos = s.studioPhotos.map((sp: any) => (sp && typeof sp === 'object' && mediaIdByFilename[sp.filename]) ? mediaIdByFilename[sp.filename] : null).filter(Boolean)
  }
  await payload.updateGlobal({ slug: 'site-settings', data: settingsData, overrideAccess: true, context: { disableRevalidate: true } })
  console.log('Site settings updated.')

  await payload.destroy()
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
