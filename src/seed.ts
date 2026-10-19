import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

// Local-only showcase records. Replace these text values and SVG paths with the
// approved product content before launch; never treat them as live inventory.
const demos = [
  { title: 'Personalised Nameplate', slug: 'personalised-nameplate', category: 'personalised-gifts', shortDescription: 'A personalised 3D-printed nameplate made with your name, preferred font and colour.', image: 'nameplate.svg', featured: true, personalisable: true },
  { title: 'Decorative LED Lamp', slug: 'decorative-led-lamp', category: 'home-decor', shortDescription: 'A sculptural 3D-printed lamp designed to add a warm, modern touch to your space.', image: 'led-lamp.svg', featured: true },
  { title: 'Custom Phone Stand', slug: 'custom-phone-stand', category: 'desk-accessories', shortDescription: 'A practical 3D-printed phone stand for your desk, bedside table or workspace.', image: 'phone-stand.svg', featured: true },
  { title: 'Kids Colouring Kit', slug: 'kids-colouring-kit', category: 'painting-kits', shortDescription: 'A creative colouring activity featuring 3D-printed designs ready to be brought to life with colour.', image: 'colouring-kit.svg', featured: false },
  { title: 'Custom 3D Creation', slug: 'custom-3d-creation', category: 'personalised-gifts', shortDescription: "Have an idea? Let's explore a personalised design or custom 3D-printed product made around your requirements.", image: 'custom-creation.svg', featured: false },
] as const

async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Demo seed disabled. Set ALLOW_DEMO_SEED=true in a local development environment only.')
  }
  const payload = await getPayload({ config })
  // Remove only exact records created by the previous local SAMPLE seed.
  for (let index = 1; index <= 6; index += 1) {
    const oldTitle = `SAMPLE Product ${String(index).padStart(2, '0')} — replace before launch`
    const old = await payload.find({ collection: 'products', where: { title: { equals: oldTitle } }, limit: 10, draft: true, overrideAccess: true })
    for (const item of old.docs) await payload.delete({ collection: 'products', id: item.id, overrideAccess: true, context: { disableRevalidate: true } })
    const oldCategory = `SAMPLE Category ${String(index).padStart(2, '0')} — replace before launch`
    const categories = await payload.find({ collection: 'categories', where: { name: { equals: oldCategory } }, limit: 10, overrideAccess: true })
    for (const item of categories.docs) await payload.delete({ collection: 'categories', id: item.id, overrideAccess: true, context: { disableRevalidate: true } })
  }
  const categoryNames: Record<string, string> = { 'personalised-gifts': 'Personalised Gifts', 'desk-accessories': 'Desk Accessories', 'painting-kits': 'Painting Kits', 'home-decor': 'Home Decor' }
  const categoryIDs: Record<string, number> = {}
  for (const [slug, name] of Object.entries(categoryNames)) {
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
    const category = found.docs[0] ?? await payload.create({ collection: 'categories', data: { name, slug, visible: true }, overrideAccess: true, context: { disableRevalidate: true } })
    categoryIDs[slug] = category.id
  }
  const { resolve } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const { dirname } = await import('node:path')
  const root = dirname(fileURLToPath(import.meta.url))
  for (const [index, demo] of demos.entries()) {
    const existing = await payload.find({ collection: 'products', where: { slug: { equals: demo.slug } }, limit: 1, draft: true, overrideAccess: true })
    if (existing.docs[0] && !existing.docs[0].isDemo) {
      throw new Error(`Refusing to replace non-demo product at slug "${demo.slug}". Choose a different slug or review the existing record manually.`)
    }
    const alt = `Temporary demo illustration for ${demo.title}; replace with the approved product photo.`
    const existingMedia = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1, overrideAccess: true })
    const media = existingMedia.docs[0] ?? await payload.create({ collection: 'media', data: { alt }, filePath: resolve(root, `../public/sample-images/${demo.image}`), overrideAccess: true, context: { disableRevalidate: true } })
    const data = {
      title: demo.title, slug: demo.slug, shortDescription: demo.shortDescription,
      category: categoryIDs[demo.category], images: [{ image: media.id, alt }],
      priceMode: 'ask' as const, currency: 'INR', availability: null,
      status: 'published' as const, isDemo: true, featured: demo.featured, personalisable: 'personalisable' in demo ? demo.personalisable : false,
      whatsappMessageOverride: "Hi Cobraa 3D, I'm interested in the {{title}}. Please share more details, available customisation options and pricing. {{url}}",
      sortOrder: index + 1,
    }
    if (existing.docs[0]) await payload.update({ collection: 'products', id: existing.docs[0].id, data, overrideAccess: true, context: { disableRevalidate: true } })
    else await payload.create({ collection: 'products', data, overrideAccess: true, context: { disableRevalidate: true } })
  }
  payload.logger.info('Upserted five local demo products. Replace records marked isDemo before launch.')
  process.exit(0)
}
seed().catch((error) => { console.error(error); process.exit(1) })
