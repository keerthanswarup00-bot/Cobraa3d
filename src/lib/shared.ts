import type { Payload } from 'payload'

export type WhatsAppSettings = {
  whatsappNumber?: string | null
  productMessageTemplate?: string | null
  messageTemplates?: { product?: string | null }
}
export type ProductMessageInput = {
  title: string
  slug?: string | null
  price?: number | null
  priceMode?: 'show' | 'ask' | null
  currency?: string | null
  whatsappMessageOverride?: string | null
  ageGroup?: string | null
  personalisable?: boolean | null
  isDemo?: boolean | null
  badges?: string[] | null
  images?: Array<{ alt?: string | null; image?: { url?: string | null } | string | number | null }> | null
}
export type ProductMessageOptions = { quantity?: number; colour?: string; kind?: 'custom' | 'bulk' | 'product'; baseURL?: string }

export function buildWhatsAppUrl({ message, number }: { message: string; number?: string | null }): string | null {
  if (number && !/^\+?[\d\s().-]+$/.test(number)) return null
  const digits = number?.replace(/\D/g, '')
  if (!digits || digits.length < 8 || digits.length > 15) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildCustomerReplyUrl(input: { phone?: string | null; name?: string | null; productTitle?: string | null }): string | null {
  if (!input.phone) return null
  const subject = input.productTitle ? ` about ${input.productTitle}` : ' about your enquiry'
  return buildWhatsAppUrl({ number: input.phone, message: `Hi ${input.name?.trim() || 'there'}, thanks for your enquiry${subject}. How can we help?` })
}

function displayPrice(product: ProductMessageInput): string {
  const price = formatPrice(product.price, product.priceMode, product.currency || 'INR')
  return product.isDemo ? `${price} (sample price for local testing only)` : price
}

export function formatPrice(price?: number | null, priceMode?: string | null, currency = 'INR'): string {
  if (priceMode === 'ask' || price == null || !Number.isFinite(price)) return 'Ask for price'
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(price)
  } catch {
    return `${currency} ${price.toFixed(2)}`
  }
}

export function buildProductMessage(
  product: ProductMessageInput,
  options: ProductMessageOptions = {},
  settings: WhatsAppSettings = {},
): string {
  const firstImage = product.images?.[0]?.image
  const imageUrl = typeof firstImage === 'object' && firstImage ? firstImage.url || '' : ''
  const url = options.baseURL && product.slug ? `${options.baseURL.replace(/\/$/, '')}/products/${encodeURIComponent(product.slug)}` : ''
  const template = product.whatsappMessageOverride || settings.messageTemplates?.product || settings.productMessageTemplate || 'Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}'
  let message = template
    .replaceAll('{{title}}', product.title)
    .replaceAll('{{price}}', displayPrice(product))
    .replaceAll('{{url}}', url)
    .replaceAll('{{imageUrl}}', imageUrl)

  const details: string[] = []
  if (options.quantity && options.quantity > 1) details.push(`Quantity: ${Math.floor(options.quantity)}`)
  if (options.colour) details.push(`Colour: ${options.colour}`)
  if (options.kind === 'bulk') details.push('Please let me know about quantity and bulk pricing.')
  if (imageUrl) details.push(`Product image: ${imageUrl}`)
  if (product.ageGroup?.toLowerCase().includes('kid')) details.push('Could you tell me the recommended age group for this kit?')
  if (product.personalisable || product.badges?.includes('customisable')) details.push('Can this product be personalised?')
  if (product.badges?.includes('festive')) details.push('Is this product currently available?')
  if (details.length) message += `\n\n${details.join('\n')}`
  return message.trim()
}

export type DatedActive = { active?: boolean | null; startsAt?: string | null; endsAt?: string | null; priority?: number | null }
export function isActiveWithinWindow(item: DatedActive, now = new Date()): boolean {
  return Boolean(item.active) && (!item.startsAt || new Date(item.startsAt).getTime() <= now.getTime()) && (!item.endsAt || new Date(item.endsAt).getTime() >= now.getTime())
}

export function getActiveOffer<T extends DatedActive>(offers: T[], now = new Date()): T | undefined {
  return offers.filter((offer) => isActiveWithinWindow(offer, now))[0]
}

export function getActiveAnnouncement<T extends DatedActive>(announcements: T[], now = new Date()): T | undefined {
  return announcements.filter((item) => isActiveWithinWindow(item, now)).sort((a, b) => (b.priority || 0) - (a.priority || 0))[0]
}

export type CategoryVisibilityInput = { id?: number | string; visible?: boolean | null }
export type PublishedCategoryProduct = { category?: number | string | { id?: number | string } | null; status?: string | null; _status?: string | null }
export function getVisibleCategories<C extends CategoryVisibilityInput>(categories: C[], products: PublishedCategoryProduct[]): C[] {
  const linkedIDs = new Set(products.filter((product) => product.status === 'published' && product._status === 'published').map((product) => {
    if (typeof product.category === 'object' && product.category) return product.category.id
    return product.category
  }).filter((id): id is number | string => id !== undefined && id !== null).map((id) => String(id).trim()))
  return categories.filter((category) => category.visible === true && category.id != null && linkedIDs.has(String(category.id).trim()))
}

export function getLatestPrintBed<T extends { visible?: boolean | null; postedAt?: string | null }>(posts: T[], now = new Date(), limit = 6): T[] {
  return posts.filter((post) => post.visible === true && (!post.postedAt || new Date(post.postedAt).getTime() <= now.getTime()))
    .sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime()).slice(0, limit)
}

export type VCardSettings = { displayName?: string | null; organisation?: string | null; phone?: string | null; email?: string | null; website?: string | null; photo?: string | null; note?: string | null }
function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}
export function buildVCard(settings: VCardSettings): string {
  const name = escapeVCard(settings.displayName?.trim() || '')
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${name}`]
  if (settings.organisation?.trim()) lines.push(`ORG:${escapeVCard(settings.organisation.trim())}`)
  if (settings.phone?.trim()) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(settings.phone.trim())}`)
  if (settings.email?.trim()) lines.push(`EMAIL:${escapeVCard(settings.email.trim())}`)
  if (settings.website?.trim()) lines.push(`URL:${escapeVCard(settings.website.trim())}`)
  if (settings.photo?.trim()) lines.push(`PHOTO;VALUE=URI:${escapeVCard(settings.photo.trim())}`)
  if (settings.note?.trim()) lines.push(`NOTE:${escapeVCard(settings.note.trim())}`)
  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}

export function buildNameplateMessage(
  input: { text: string; font: string; colour: string; size?: string },
  settings: { whatsappNumber?: string | null; nameplateMessageTemplate?: string | null },
): string | null {
  const details = [
    `Nameplate text: ${input.text.trim()}`,
    `Font: ${input.font}`,
    `Colour: ${input.colour}`,
    input.size ? `Size: ${input.size}` : '',
  ].filter(Boolean)
  const template = settings.nameplateMessageTemplate || 'Hi, I would like to enquire about a custom nameplate.\n{{details}}'
  return buildWhatsAppUrl({ number: settings.whatsappNumber, message: template.replaceAll('{{details}}', details.join('\n')) })
}

const calmSuppressedEffects = new Set(['heroPrintReveal', 'contourField', 'scrollGauge', 'filamentSpool', 'filamentProgress', 'paintPlaygroundMotion', 'layerWipe'])
export function isExperienceEnabled(experience: Record<string, boolean | null | undefined> | null | undefined, effect: string): boolean {
  if (!experience || experience[effect] === false) return false
  if (experience.calmMode && calmSuppressedEffects.has(effect)) return false
  return true
}

export async function findVisibleCategories(payload: Payload) {
  const [{ docs: categories }, { docs: products }] = await Promise.all([
    payload.find({ collection: 'categories', where: { visible: { equals: true } }, sort: 'sortOrder', depth: 0 }),
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, limit: 1000, depth: 0 }),
  ])
  return getVisibleCategories(categories as CategoryVisibilityInput[], products as PublishedCategoryProduct[])
}

export function getCloseButtonDestination(input: { sameOriginHistory: boolean; currentURL: string; parentUrl?: string | null }): { kind: 'back' } | { kind: 'parent'; url: string } | { kind: 'top' } {
  if (input.sameOriginHistory) return { kind: 'back' }
  try {
    const current = new URL(input.currentURL)
    const parent = input.parentUrl ? new URL(input.parentUrl, current) : undefined
    if (parent) return { kind: 'parent', url: parent.toString() }
  } catch {
    // An invalid configured parent URL falls back to scrolling to the top.
  }
  return { kind: 'top' }
}
