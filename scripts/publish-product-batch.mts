import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '@payload-config'

type BatchProduct = {
  title: string
  slug: string
  category: string
  description: string
  fullDescription: string
  price: number | null
  priceMode: 'show' | 'ask'
  images: Array<{ path: string; alt: string }>
}

type BatchManifest = {
  products: BatchProduct[]
  appendImages: Array<{ productSlug: string; image: { path: string; alt: string } }>
  setLampPrices: string[]
}

const manifestPath = process.argv.find((arg) => arg.startsWith('--manifest='))?.slice('--manifest='.length)
const apply = process.argv.includes('--apply')
if (!manifestPath) throw new Error('Pass --manifest=<path>. Use --apply to write changes; otherwise this is a dry run.')
if (!process.env.DATABASE_URI?.startsWith('postgres')) throw new Error('Set DATABASE_URI to the authorized production Postgres connection.')
if (apply && ![process.env.S3_BUCKET, process.env.S3_ENDPOINT, process.env.S3_ACCESS_KEY_ID, process.env.S3_SECRET_ACCESS_KEY].every(Boolean)) {
  throw new Error('S3 storage is not configured. Refusing to publish products with media that would only have local URLs.')
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(path.resolve(manifestPath), 'utf8')) as BatchManifest
const payload = await getPayload({ config })
const mediaCache = new Map<string, any>()
let uploads = 0
let creates = 0
let updates = 0

function lexical(text: string) {
  return {
    root: {
      type: 'root',
      children: text.split(/\n\s*\n/).filter(Boolean).map((paragraph) => ({
        type: 'paragraph', children: [{ type: 'text', text: paragraph, version: 1 }],
        direction: null, format: '', indent: 0, version: 1,
      })),
      direction: null, format: '', indent: 0, version: 1,
    },
  }
}

function contentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.png') return 'image/png'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.webp') return 'image/webp'
  throw new Error(`Unsupported image format: ${filePath}`)
}

async function findCategory(slug: string) {
  const result = await payload.find({
    collection: 'categories', where: { slug: { equals: slug } }, limit: 1,
    depth: 0, overrideAccess: true,
  })
  const category = result.docs[0]
  if (!category) throw new Error(`Production category is missing: ${slug}`)
  return category
}

async function resolveMedia(image: { path: string; alt: string }, dryRun: boolean) {
  const resolvedPath = path.resolve(image.path)
  const cacheKey = `${resolvedPath}\n${image.alt}`
  if (mediaCache.has(cacheKey)) return mediaCache.get(cacheKey)
  const existing = await payload.find({
    collection: 'media', where: { alt: { equals: image.alt } }, limit: 1,
    depth: 0, overrideAccess: true,
  })
  if (existing.docs[0]) {
    mediaCache.set(cacheKey, existing.docs[0])
    return existing.docs[0]
  }
  if (dryRun) {
    console.log(`[media] would upload ${path.basename(resolvedPath)}`)
    const placeholder = { id: `dry:${cacheKey}`, alt: image.alt }
    mediaCache.set(cacheKey, placeholder)
    return placeholder
  }
  const bytes = await readFile(resolvedPath)
  const media = await payload.create({
    collection: 'media', data: { alt: image.alt },
    file: { data: bytes, mimetype: contentType(resolvedPath), name: path.basename(resolvedPath), size: bytes.byteLength },
    overrideAccess: true, context: { disableRevalidate: true },
  })
  uploads += 1
  mediaCache.set(cacheKey, media)
  console.log(`[media] uploaded ${path.basename(resolvedPath)}`)
  return media
}

async function addProduct(product: BatchProduct, dryRun: boolean) {
  if (product.description.length > 240) throw new Error(`Description exceeds 240 characters: ${product.title}`)
  const [category, existingResult] = await Promise.all([
    findCategory(product.category),
    payload.find({ collection: 'products', where: { slug: { equals: product.slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true }),
  ])
  const existing = existingResult.docs[0] as any
  const wantedMedia = []
  for (const image of product.images) wantedMedia.push(await resolveMedia(image, dryRun))
  const knownImageIds = new Set((existing?.images || []).map((row: any) => String(typeof row.image === 'object' ? row.image.id : row.image)))
  const rows = [...(existing?.images || [])]
  for (let i = 0; i < wantedMedia.length; i += 1) {
    const media = wantedMedia[i]
    if (!knownImageIds.has(String(media.id))) rows.push({ image: media.id, alt: product.images[i].alt })
  }
  const data: Record<string, unknown> = {
    title: product.title,
    slug: product.slug,
    status: 'published',
    _status: 'published',
    isDemo: false,
    category: category.id,
    shortDescription: product.description,
    description: lexical(product.fullDescription),
    priceMode: product.priceMode,
    currency: 'INR',
    images: rows,
    seoTitle: `${product.title} | Cobraa 3D`,
    seoDescription: product.description,
    availability: null,
  }
  if (product.price != null || !existing) data.price = product.price
  if (dryRun) {
    console.log(`[product] would ${existing ? 'update' : 'create'} ${product.slug} (${product.images.length} image${product.images.length === 1 ? '' : 's'})`)
    return
  }
  if (existing) {
    await payload.update({ collection: 'products', id: existing.id, data, overrideAccess: true, draft: false, context: { disableRevalidate: true } })
    updates += 1
    console.log(`[product] updated ${product.slug}`)
  } else {
    await payload.create({ collection: 'products', data, overrideAccess: true, draft: false, context: { disableRevalidate: true } })
    creates += 1
    console.log(`[product] published ${product.slug}`)
  }
}

async function appendImage(productSlug: string, image: { path: string; alt: string }, dryRun: boolean) {
  const result = await payload.find({ collection: 'products', where: { slug: { equals: productSlug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })
  const product = result.docs[0] as any
  if (!product) throw new Error(`Production product not found for photo: ${productSlug}`)
  const media = await resolveMedia(image, dryRun)
  const currentRows = product.images || []
  if (currentRows.some((row: any) => row.alt === image.alt || String(typeof row.image === 'object' ? row.image.id : row.image) === String(media.id))) {
    console.log(`[image] already attached to ${productSlug}`)
    return
  }
  if (dryRun) {
    console.log(`[image] would append ${path.basename(image.path)} to ${productSlug}`)
    return
  }
  await payload.update({ collection: 'products', id: product.id, data: { images: [...currentRows, { image: media.id, alt: image.alt }] }, overrideAccess: true, draft: false, context: { disableRevalidate: true } })
  updates += 1
  console.log(`[image] appended to ${productSlug}`)
}

try {
  for (const product of manifest.products) await addProduct(product, !apply)
  for (const item of manifest.appendImages) await appendImage(item.productSlug, item.image, !apply)
  for (const slug of manifest.setLampPrices) {
    const result = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })
    const product = result.docs[0] as any
    if (!product) {
      const plannedProduct = manifest.products.find((item) => item.slug === slug)
      if (!apply && plannedProduct?.price === 300) {
        console.log(`[price] new lamp will publish at ₹300: ${slug}`)
        continue
      }
      throw new Error(`Lamp product not found for price sync: ${slug}`)
    }
    if (product.price === 300 && product.status === 'published' && product._status === 'published') {
      console.log(`[price] already ₹300: ${slug}`)
      continue
    }
    if (!apply) {
      console.log(`[price] would set ₹300 and publish ${slug}`)
      continue
    }
    await payload.update({ collection: 'products', id: product.id, data: { price: 300, status: 'published', _status: 'published', isDemo: false }, overrideAccess: true, draft: false, context: { disableRevalidate: true } })
    updates += 1
    console.log(`[price] set ₹300: ${slug}`)
  }
  console.log(`[done] ${apply ? 'applied' : 'dry run'}; uploads=${uploads}, creates=${creates}, updates=${updates}`)
} finally {
  await payload.destroy()
}
