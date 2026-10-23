#!/usr/bin/env node
/**
 * Create or update products through the Payload admin REST API.
 *
 * This works against local or production without touching the database
 * directly, and it triggers Payload's normal revalidation hooks.
 *
 * Required environment variables (or pass --env-file):
 *   PAYLOAD_SERVER_URL       e.g. https://cobraa3d.com
 *   PAYLOAD_ADMIN_EMAIL      admin account email
 *   PAYLOAD_ADMIN_PASSWORD   admin account password
 *
 * NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_SERVER_URL are used as URL fallbacks.
 *
 * Examples:
 *   node --env-file=.env.production scripts/publish-product.mjs --manifest ./product.json
 *   node scripts/publish-product.mjs --url http://localhost:3000 \
 *     --env-file=.env --manifest ./product.json --dry-run
 *
 * Single product:
 *   node scripts/publish-product.mjs --url http://localhost:3000 \
 *     --title "Glowing Ghost Tree Lamp" \
 *     --description "A glowing ghost lamp on a black tree stand." \
 *     --price 299 --category lamps-lighting \
 *     --image "/path/to/image.png" --alt "Glowing ghost lamp" \
 *     --status published
 *
 * Manifest shape:
 *   {
 *     "products": [
 *       {
 *         "title": "Glowing Ghost Tree Lamp",
 *         "description": "Short description (max 240 chars)",
 *         "price": 299,
 *         "salePrice": null,
 *         "priceMode": "show",
 *         "category": "lamps-lighting",
 *         "createCategory": false,
 *         "status": "published",
 *         "featured": false,
 *         "images": [{ "path": "/path/to/image.png", "alt": "Glowing ghost lamp" }]
 *       }
 *     ]
 *   }
 */
import dotenv from 'dotenv'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const args = { images: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith('--')) continue
    const [flag, inline] = value.slice(2).split('=')
    const next = inline ?? argv[index + 1]
    const take = () => {
      if (inline == null) index += 1
      return next
    }
    switch (flag) {
      case 'manifest': args.manifest = take(); break
      case 'env-file': args.envFile = take(); break
      case 'url': args.url = take(); break
      case 'title': args.title = take(); break
      case 'description': args.description = take(); break
      case 'price': args.price = Number(take()); break
      case 'sale-price': args.salePrice = Number(take()); break
      case 'category': args.category = take(); break
      case 'image': args.images.push({ path: take() }); break
      case 'alt': args.alt = take(); break
      case 'status': args.status = take(); break
      case 'slug': args.slug = take(); break
      case 'dry-run': args.dryRun = true; break
      default: throw new Error(`Unknown flag: --${flag}`)
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
if (args.envFile) dotenv.config({ path: path.resolve(args.envFile), override: false })

const baseURL = (args.url || process.env.PAYLOAD_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
const email = process.env.PAYLOAD_ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD

if (!email || !password) {
  throw new Error('Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD (or BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD).')
}

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mimeType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.webp': return 'image/webp'
    case '.gif': return 'image/gif'
    case '.svg': return 'image/svg+xml'
    case '.avif': return 'image/avif'
    default: return 'application/octet-stream'
  }
}

async function request(endpoint, { method = 'GET', token, body, headers = {} } = {}) {
  const response = await fetch(`${baseURL}${endpoint}`, {
    method,
    headers: {
      ...(token ? { Authorization: `JWT ${token}` } : {}),
      ...headers,
    },
    body,
  })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) {
    const message = typeof data === 'string' ? data : JSON.stringify(data)
    throw new Error(`${method} ${endpoint} -> ${response.status}: ${message}`)
  }
  return data
}

async function login() {
  const result = await request('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!result?.token) throw new Error('Login succeeded but no token was returned.')
  return result.token
}

async function findCategory(token, value, createIfMissing) {
  const categories = await request('/api/categories?limit=200&depth=0', { token })
  const wanted = String(value).trim().toLowerCase()
  const match = categories.docs.find((category) =>
    String(category.slug).toLowerCase() === wanted || String(category.name).toLowerCase() === wanted,
  )
  if (match) return match
  if (!createIfMissing) {
    const available = categories.docs.map((category) => `${category.name} (${category.slug})`).join(', ')
    throw new Error(`Category "${value}" not found. Available: ${available || 'none'}. Set "createCategory": true to create it.`)
  }
  return request('/api/categories', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: value, slug: slugify(value), visible: true }),
  })
}

async function uploadMedia(token, image, fallbackAlt, dryRun) {
  if (!image?.path) throw new Error('Each image needs a "path".')
  const alt = image.alt || fallbackAlt
  if (!alt) throw new Error(`Image "${image.path}" needs alt text.`)
  const query = new URLSearchParams({ 'where[alt][equals]': alt, limit: '1', depth: '0' })
  const existing = await request(`/api/media?${query}`, { token })
  if (existing.docs?.[0]) {
    console.log(`[media] reuse ${existing.docs[0].id} (${alt})`)
    return existing.docs[0]
  }
  if (dryRun) {
    console.log(`[media] would upload ${image.path} (${alt})`)
    return { id: 'DRY_RUN', alt }
  }
  const buffer = await fs.readFile(image.path)
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: mimeType(image.path) }), path.basename(image.path))
  form.append('_payload', JSON.stringify({ alt }))
  const media = await request('/api/media', { method: 'POST', token, body: form })
  console.log(`[media] uploaded ${media.id} (${alt})`)
  return media
}

async function upsertProduct(token, product, dryRun) {
  if (!product.title) throw new Error('Product title is required.')
  if (String(product.description || '').length > 240) {
    throw new Error(`"${product.title}" description is ${String(product.description).length} characters; the admin limit is 240.`)
  }
  if (product.price != null && (!Number.isFinite(Number(product.price)) || Number(product.price) < 0)) {
    throw new Error(`"${product.title}" has an invalid price.`)
  }

  const slug = product.slug || slugify(product.title)
  const status = product.status || 'published'
  const images = (product.images?.length ? product.images : product.image ? [{ path: product.image, alt: product.alt }] : [])
  const uploaded = []
  for (const image of images) uploaded.push(await uploadMedia(token, image, product.alt, dryRun))

  const category = product.category
    ? await findCategory(token, product.category, Boolean(product.createCategory))
    : null

  const data = {
    title: product.title,
    slug,
    shortDescription: product.description || '',
    ...(product.price != null ? { price: Number(product.price) } : {}),
    ...(product.salePrice != null ? { salePrice: Number(product.salePrice) } : {}),
    priceMode: product.priceMode || (product.price != null ? 'show' : 'ask'),
    currency: product.currency || 'INR',
    status,
    _status: status,
    ...(category ? { category: category.id } : {}),
    images: uploaded.map((media) => ({ image: media.id, alt: media.alt || product.alt || product.title })),
    ...(product.featured != null ? { featured: Boolean(product.featured) } : {}),
    ...(product.isDemo != null ? { isDemo: Boolean(product.isDemo) } : {}),
  }

  const existing = await request(`/api/products?${new URLSearchParams({ 'where[slug][equals]': slug, limit: '1', depth: '0', draft: 'true' })}`, { token })
  if (dryRun) {
    console.log(`[product] would ${existing.docs?.[0] ? 'update' : 'create'} ${slug}`)
    return { id: existing.docs?.[0]?.id || 'DRY_RUN', slug }
  }
  const existingDoc = existing.docs?.[0]
  const result = existingDoc
    ? await request(`/api/products/${existingDoc.id}`, {
        method: 'PATCH',
        token,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    : await request('/api/products', {
        method: 'POST',
        token,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
  const id = result?.id ?? result?.doc?.id ?? existingDoc?.id
  const savedSlug = result?.slug ?? result?.doc?.slug ?? data.slug
  console.log(`[product] ${existingDoc ? 'updated' : 'created'} ${id} (${status})`)
  return { id, slug: savedSlug }
}

async function loadProducts() {
  if (args.manifest) {
    const contents = await fs.readFile(path.resolve(args.manifest), 'utf8')
    const parsed = JSON.parse(contents)
    return Array.isArray(parsed) ? parsed : parsed.products || [parsed]
  }
  if (!args.title) throw new Error('Pass --manifest <file> or at least --title.')
  return [{
    title: args.title,
    description: args.description,
    price: args.price,
    salePrice: args.salePrice,
    category: args.category,
    status: args.status,
    slug: args.slug,
    images: args.images.length ? args.images.map((image) => ({ ...image, alt: args.alt })) : undefined,
    alt: args.alt,
  }]
}

const token = await login()
console.log(`[auth] connected to ${baseURL}`)
const products = await loadProducts()
for (const product of products) {
  const result = await upsertProduct(token, product, args.dryRun)
  if (!args.dryRun && result.slug) {
    console.log(`[url] ${baseURL}/admin/collections/products/${result.id}`)
    console.log(`[url] ${baseURL}/products/${result.slug}`)
  }
}
console.log(`[done] ${products.length} product${products.length === 1 ? '' : 's'}${args.dryRun ? ' (dry run)' : ''}`)
