import { createHash, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_IMAGES = 8
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

function authorized(req: Request) {
  const secret = process.env.PRODUCT_UPLOAD_SECRET
  const supplied = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!secret || !supplied) return false
  const expectedHash = createHash('sha256').update(secret).digest()
  const suppliedHash = createHash('sha256').update(supplied).digest()
  return timingSafeEqual(expectedHash, suppliedHash)
}

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function text(form: FormData, key: string, max = 500) {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ ok: false, error: 'Expected multipart form data.' }, { status: 400 })
  }

  const title = text(form, 'title', 120)
  const shortDescription = text(form, 'shortDescription', 240)
  const categorySlug = text(form, 'categorySlug', 100)
  const imageAlt = text(form, 'imageAlt', 240) || title
  const rawImages = form.getAll('images')
  const images = rawImages.filter((item): item is File => item instanceof File && item.size > 0)

  if (!title || !shortDescription || !categorySlug) {
    return Response.json({ ok: false, error: 'title, shortDescription, and categorySlug are required; nothing was created.' }, { status: 422 })
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug)) {
    return Response.json({ ok: false, error: 'categorySlug must be a valid existing category slug.' }, { status: 422 })
  }
  if (images.length < 1 || images.length > MAX_IMAGES || images.length !== rawImages.length) {
    return Response.json({ ok: false, error: `Attach 1–${MAX_IMAGES} valid image files; nothing was created.` }, { status: 422 })
  }
  for (const file of images) {
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      return Response.json({ ok: false, error: 'Images must be JPEG, PNG, WebP or AVIF and no larger than 10 MB each.' }, { status: 422 })
    }
  }

  const slug = slugify(title)
  if (!slug) return Response.json({ ok: false, error: 'Title cannot produce a valid slug.' }, { status: 422 })

  try {
    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length) {
      return Response.json({ ok: false, error: 'A product with this slug already exists. No duplicate was created.', existingId: existing.docs[0].id }, { status: 409 })
    }

    const categories = await payload.find({
      collection: 'categories',
      where: { and: [{ slug: { equals: categorySlug } }, { visible: { equals: true } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (!categories.docs.length) {
      return Response.json({ ok: false, error: 'The requested visible category does not exist. No product was created.' }, { status: 422 })
    }

    // Upload every supplied image in order. The first image becomes the primary product image.
    const mediaDocs: Array<{ id: number | string; alt: string }> = []
    for (let index = 0; index < images.length; index++) {
      const file = images[index]
      const media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: index === 0 ? imageAlt : `${imageAlt} — image ${index + 1}` },
        file: {
          data: Buffer.from(await file.arrayBuffer()),
          mimetype: file.type,
          name: file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120) || `product-${index + 1}.jpg`,
          size: file.size,
        },
      })
      mediaDocs.push({ id: media.id, alt: index === 0 ? imageAlt : `${imageAlt} — image ${index + 1}` })
    }

    const product = await payload.create({
      collection: 'products',
      overrideAccess: true,
      draft: false,
      data: {
        title,
        slug,
        shortDescription,
        category: categories.docs[0].id,
        images: mediaDocs.map((media) => ({ image: media.id, alt: media.alt })),
        priceMode: 'ask',
        currency: 'INR',
        status: 'published',
        _status: 'published',
        isDemo: false,
        seoTitle: title.slice(0, 70),
        seoDescription: shortDescription.slice(0, 160),
      },
    })

    // Verify the saved record has a title, category and all attached images before reporting success.
    const verified = await payload.findByID({
      collection: 'products',
      id: product.id,
      depth: 1,
      overrideAccess: true,
    })
    const savedImages = Array.isArray(verified.images) ? verified.images : []
    if (!verified.title || !verified.category || savedImages.length !== images.length || verified._status !== 'published') {
      return Response.json({ ok: false, error: 'Product was saved but verification failed. Check admin before retrying; duplicate protection is active.', productId: product.id }, { status: 500 })
    }

    return Response.json({
      ok: true,
      product: { id: verified.id, title: verified.title, slug: verified.slug, status: verified.status, imageCount: savedImages.length, category: typeof verified.category === 'object' ? verified.category.name : categorySlug },
      url: `${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/products/${verified.slug}`,
    }, { status: 201 })
  } catch (error) {
    console.error('[ai-product-upload] failed', error instanceof Error ? error.message : 'unknown error')
    return Response.json({ ok: false, error: 'Upload failed. Check server logs before retrying; do not retry blindly.' }, { status: 500 })
  }
}
