import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

async function seed() {
  const payload = await getPayload({ config })
  const placeholder = path.resolve(dirname, '../public/sample-images/neutral-placeholder.svg')
  const categoryIDs: number[] = []
  for (let index = 1; index <= 6; index += 1) {
    const name = `SAMPLE Category ${String(index).padStart(2, '0')} — replace before launch`
    const existing = await payload.find({ collection: 'categories', where: { name: { equals: name } }, limit: 1 })
    const category = existing.docs[0] ?? await payload.create({ collection: 'categories', data: { name, slug: `sample-category-${String(index).padStart(2, '0')}`, visible: false, sortOrder: index }, context: { disableRevalidate: true } })
    categoryIDs.push(category.id)
  }

  const mediaResult = await payload.create({ collection: 'media', data: { alt: 'SAMPLE placeholder image — replace before launch' }, filePath: placeholder, context: { disableRevalidate: true } })
  for (let index = 1; index <= 6; index += 1) {
    const title = `SAMPLE Product ${String(index).padStart(2, '0')} — replace before launch`
    const existing = await payload.find({ collection: 'products', where: { title: { equals: title } }, limit: 1, draft: true })
    if (!existing.docs[0]) await payload.create({ collection: 'products', draft: true, data: {
      title, slug: `sample-product-${String(index).padStart(2, '0')}`, shortDescription: 'Sample content only. Replace with verified product information.',
      category: categoryIDs[index - 1], images: [{ image: mediaResult.id, alt: 'SAMPLE placeholder image — replace before launch' }],
      priceMode: 'ask', availability: 'made_to_order', status: 'draft', sortOrder: index,
    }, context: { disableRevalidate: true } })
  }

  const sampleOffer = await payload.find({ collection: 'offers', where: { title: { equals: 'SAMPLE offer — inactive' } }, limit: 1 })
  if (!sampleOffer.docs[0]) await payload.create({ collection: 'offers', data: { title: 'SAMPLE offer — inactive', description: 'Example only. Replace or delete before launch.', active: false }, context: { disableRevalidate: true } })
  const sampleAnnouncement = await payload.find({ collection: 'announcements', where: { message: { equals: 'SAMPLE announcement — inactive' } }, limit: 1 })
  if (!sampleAnnouncement.docs[0]) await payload.create({ collection: 'announcements', data: { message: 'SAMPLE announcement — inactive', active: false, dismissible: true, type: 'info' }, context: { disableRevalidate: true } })
  payload.logger.info('Sample records created. Replace or remove all SAMPLE content before launch.')
  process.exit(0)
}

seed().catch((error) => { console.error(error); process.exit(1) })
