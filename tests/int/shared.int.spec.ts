import { describe, expect, it } from 'vitest'
import {
  buildNameplateMessage,
  buildCustomerReplyUrl,
  buildGeneralMessage,
  getCloseButtonDestination,
  buildProductMessage,
  buildVCard,
  buildWhatsAppUrl,
  formatPrice,
  getActiveAnnouncement,
  getActiveOffer,
  getLatestPrintBed,
  getVisibleCategories,
  isExperienceEnabled,
  isRemoteImage,
} from '@/lib/shared'
import { getDisplayPrice } from '@/lib/pricing'
import { getProductShareImageURL, getProductShareVersion } from '@/lib/shareImage-constants'

describe('shared business helpers', () => {
  it('encodes WhatsApp messages and normalizes the configured number to digits', () => {
    expect(buildWhatsAppUrl({ number: '+91 98765 43210', message: 'Hi & hello' })).toBe('https://wa.me/919876543210?text=Hi%20%26%20hello')
    expect(buildWhatsAppUrl({ number: '12abc', message: 'Hi' })).toBeNull()
    expect(buildWhatsAppUrl({ number: '+91 abc 98765 43210', message: 'Hi' })).toBeNull()
  })

  it('uses the product updatedAt timestamp as the shared image and enquiry-link version', () => {
    const updatedAt = '2026-10-24T09:55:35.667Z'
    const version = Date.parse(updatedAt)
    expect(getProductShareVersion(updatedAt)).toBe(version)
    expect(getProductShareVersion('invalid')).toBe(0)
    expect(getProductShareImageURL('https://shop.test/', 'lamp', updatedAt)).toBe(`https://shop.test/products/lamp/share.jpg?v=${version}`)
    const message = buildProductMessage(
      { title: 'Lamp', slug: 'lamp', updatedAt },
      { baseURL: 'https://shop.test' },
    )
    expect(message.endsWith(`https://shop.test/products/lamp?v=${version}`)).toBe(true)
  })

  it('builds customer-number reply messages for enquiries', () => {
    const url = buildCustomerReplyUrl({ phone: '+91 98765 43210', name: 'Asha', productTitle: 'Desk stand' })
    expect(url).toContain('https://wa.me/919876543210?text=')
    expect(new URL(url!).searchParams.get('text')).toBe('Hi Asha, thanks for your enquiry about Desk stand. How can we help?')
    expect(buildCustomerReplyUrl({ phone: 'nope' })).toBeNull()
  })

  it('builds product messages from templates without implying an attachment', () => {
    const message = buildProductMessage(
      { title: 'SAMPLE Kit', slug: 'sample-kit', priceMode: 'ask', ageGroup: 'Kids', personalisable: true, badges: ['festive'] },
      { quantity: 3, colour: 'Black', kind: 'bulk', baseURL: 'https://example.test/' },
      { productMessageTemplate: 'Hello {{title}}: {{price}} {{url}}' },
    )
    expect(message).toContain('SAMPLE Kit')
    expect(message).toContain('Ask for price')
    expect(message).toContain('https://example.test/products/sample-kit?v=0')
    expect(message).toContain('Quantity: 3')
    expect(message).toContain('Colour: Black')
    expect(message).toContain('bulk pricing')
    expect(message).toContain('recommended age group')
    expect(message).toContain('personalised')
    expect(message).toContain('currently available')
    expect(message).not.toContain('attached')
  })

  it('builds product-specific demo enquiries with the detail URL and safe URL encoding', () => {
    const products = [
      ['Personalised Nameplate', 'personalised-nameplate'],
      ['Decorative LED Lamp', 'decorative-led-lamp'],
      ['Custom Phone Stand', 'custom-phone-stand'],
      ['Kids Colouring Kit', 'kids-colouring-kit'],
      ['Custom 3D Creation', 'custom-3d-creation'],
    ] as const
    for (const [title, slug] of products) {
      const message = buildProductMessage({
        title, slug, isDemo: true, priceMode: 'ask',
        whatsappMessageOverride: "Hi Cobraa 3D, I'm interested in the {{title}}. Please share more details, available customisation options and pricing. {{url}}",
      }, { baseURL: 'https://cobraa3d.example' })
      expect(message).toContain(`the ${title}`)
      expect(message).toContain(`https://cobraa3d.example/products/${slug}?v=0`)
      expect(message).not.toContain('Ask for price')
      const url = buildWhatsAppUrl({ number: '+91 98765 43210', message })
      expect(url).toContain('https://wa.me/919876543210?text=')
      expect(new URL(url!).searchParams.get('text')).toBe(message)
    }
    expect(buildWhatsAppUrl({ number: null, message: 'test' })).toBeNull()
  })

  it('versions product enquiry links when the product is updated', () => {
    const message = buildProductMessage(
      { title: 'Sample', slug: 'sample', updatedAt: '2026-10-25T00:00:00.000Z', price: 1250, priceMode: 'show' },
      { baseURL: 'https://example.test' },
    )
    expect(message).toContain("Hi, I'm interested in Sample.")
    expect(message).toContain('https://example.test/products/sample?v=1792886400000')
  })

  it('does not include a raw image URL in product enquiries', () => {
    const message = buildProductMessage({ title: 'A', images: [{ image: { url: 'https://cdn.test/a.jpg' } }] })
    expect(message).not.toContain('cdn.test')
    expect(message).not.toContain('Product image')
  })

  it('never puts the raw storage image URL in a product enquiry', () => {
    const message = buildProductMessage({ title: 'A', slug: 'a', images: [{ image: { url: 'https://abc.supabase.co/storage/v1/object/public/media/a.webp' } }] }, { baseURL: 'https://shop.test' })
    expect(message).not.toContain('supabase')
    expect(message).not.toContain('.webp')
    expect(message).not.toContain('Product image')
  })

  it('writes a clean default product message with the product link on its own last line', () => {
    const message = buildProductMessage({ title: 'Cute Ghost Cat Figurine', slug: 'cute-ghost-cat-figurine', price: 299, priceMode: 'show', currency: 'INR' }, { baseURL: 'https://shop.test/' })
    expect(message).toBe("Hi, I'm interested in Cute Ghost Cat Figurine.\nPrice: ₹299.00\n\nhttps://shop.test/products/cute-ghost-cat-figurine?v=0")
  })

  it('places chosen quantity and colour above the product link', () => {
    const message = buildProductMessage({ title: 'Lamp', slug: 'lamp', priceMode: 'ask' }, { baseURL: 'https://shop.test', quantity: 2, colour: 'Black' })
    expect(message).toBe("Hi, I'm interested in Lamp.\nPrice: Ask for price\nQuantity: 2\nColour: Black\n\nhttps://shop.test/products/lamp?v=0")
    expect(message.endsWith('https://shop.test/products/lamp?v=0')).toBe(true)
  })

  it('keeps older custom templates working and appends the chosen options after them', () => {
    const message = buildProductMessage({ title: 'Lamp', slug: 'lamp', priceMode: 'ask' }, { baseURL: 'https://shop.test', colour: 'Black' }, { messageTemplates: { product: 'Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}' } })
    expect(message).toBe('Hi, I would like to enquire about Lamp. Price: Ask for price. https://shop.test/products/lamp?v=0\n\nColour: Black')
  })

  it('does not mangle product names that contain replacement-pattern characters', () => {
    const message = buildProductMessage({ title: 'Mug $& Co $1', slug: 'mug', priceMode: 'ask' }, { baseURL: 'https://shop.test' })
    expect(message).toContain('Mug $& Co $1')
  })

  it('opens general WhatsApp chats with a clean brand greeting', () => {
    expect(buildGeneralMessage('Cobraa 3D')).toBe("Hi Cobraa 3D, I'd like to know more about your products.")
    expect(buildGeneralMessage('  ')).toBe("Hi, I'd like to know more about your products.")
    expect(buildGeneralMessage(null)).not.toMatch(/connect page/i)
  })

  it('only returns offers and announcements in their active date window', () => {
    const now = new Date('2026-10-19T12:00:00.000Z')
    expect(getActiveOffer([{ active: true, startsAt: '2026-10-19T11:00:00Z', endsAt: '2026-10-19T13:00:00Z' }, { active: false }], now)?.active).toBe(true)
    expect(getActiveOffer([{ active: true, startsAt: '2026-10-20T00:00:00Z' }], now)).toBeUndefined()
    expect(getActiveAnnouncement([{ active: true, priority: 1 }, { active: true, priority: 4 }], now)?.priority).toBe(4)
  })

  it('shows only visible categories with at least one published product', () => {
    const categories = [{ id: 1, visible: true }, { id: 2, visible: true }, { id: 3, visible: false }]
    const products = [{ category: 1, status: 'published', _status: 'published' }, { category: 2, status: 'draft', _status: 'draft' }]
    expect(getVisibleCategories(categories, products)).toEqual([categories[0]])
  })

  it('formats missing prices as Ask for price', () => {
    expect(formatPrice()).toBe('Ask for price')
    expect(formatPrice(250, 'ask')).toBe('Ask for price')
    expect(formatPrice(250, 'show', 'INR')).toBe('₹250.00')
  })

  it('applies valid sale pricing only when an active offer matches the product', () => {
    const now = new Date('2026-10-19T12:00:00.000Z')
    const product = { id: 7, price: 2500, salePrice: 2000, priceMode: 'show' as const, currency: 'INR' }
    const offer = { title: 'Festive launch', discountText: '20% off', active: true, startsAt: '2026-10-18T00:00:00Z', endsAt: '2026-10-20T00:00:00Z', applicableProducts: [7] }
    const display = getDisplayPrice(product, offer, now)
    expect(display.hasOffer).toBe(true)
    expect(display.showOffer).toBe(true)
    expect(display.priceLabel).toBe('₹2,000.00')
    expect(display.regularPriceLabel).toBe('₹2,500.00')
    expect(display.badge).toBe('-20%')
    expect(getDisplayPrice({ ...product, salePrice: 3000 }, offer, now).showOffer).toBe(false)
    expect(getDisplayPrice({ ...product, salePrice: 2000 }, { ...offer, active: false }, now).showOffer).toBe(false)
  })

  it('builds a nameplate enquiry URL and a valid vCard', () => {
    const url = buildNameplateMessage({ text: 'A & B', font: 'Sans', colour: 'Black', size: 'small' }, { whatsappNumber: '919876543210' })
    expect(url).toContain('https://wa.me/919876543210?text=')
    const card = buildVCard({ displayName: 'Studio, Name', organisation: 'Cobraa 3D', phone: '+919876543210', email: 'hello@example.test', note: 'Line 1\nLine 2' })
    expect(card).toContain('BEGIN:VCARD\r\nVERSION:3.0')
    expect(card).toContain('FN:Studio\\, Name')
    expect(card).toContain('NOTE:Line 1\\nLine 2')
    expect(card).toContain('END:VCARD\r\n')
  })

  it('lets Calm mode disable non-essential motion while keeping useful features', () => {
    const experience = { calmMode: true, heroPrintReveal: true, contourField: true, scrollGauge: true, nameplateStudio: true }
    expect(isExperienceEnabled(experience, 'heroPrintReveal')).toBe(false)
    expect(isExperienceEnabled(experience, 'contourField')).toBe(false)
    expect(isExperienceEnabled(experience, 'scrollGauge')).toBe(false)
    expect(isExperienceEnabled(experience, 'nameplateStudio')).toBe(true)
    expect(isExperienceEnabled({ calmMode: false, nameplateStudio: false }, 'nameplateStudio')).toBe(false)
  })

  it('returns only visible Print Bed posts that are not in the future, newest first', () => {
    const now = new Date('2026-10-19T12:00:00Z')
    const posts = [
      { id: 'old', visible: true, postedAt: '2026-10-18T12:00:00Z' },
      { id: 'new', visible: true, postedAt: '2026-10-19T11:00:00Z' },
      { id: 'future', visible: true, postedAt: '2026-10-20T11:00:00Z' },
      { id: 'hidden', visible: false, postedAt: '2026-10-19T11:30:00Z' },
    ]
    expect(getLatestPrintBed(posts, now).map(({ id }) => id)).toEqual(['new', 'old'])
  })

  it('treats only absolute media URLs as remote images that must skip the image optimizer', () => {
    expect(isRemoteImage('https://abc.supabase.co/storage/v1/object/public/media/lamp.webp')).toBe(true)
    expect(isRemoteImage('http://localhost:3000/api/media/file/lamp.webp')).toBe(true)
    expect(isRemoteImage('/api/media/file/lamp.webp')).toBe(false)
    expect(isRemoteImage('/sample-images/led-lamp.svg')).toBe(false)
  })

  it('chooses a safe close destination from same-origin history, parent, or top', () => {
    expect(getCloseButtonDestination({ sameOriginHistory: true, currentURL: 'https://site.test', parentUrl: 'https://parent.test' })).toEqual({ kind: 'back' })
    expect(getCloseButtonDestination({ sameOriginHistory: false, currentURL: 'https://site.test', parentUrl: 'https://parent.test/path' })).toEqual({ kind: 'parent', url: 'https://parent.test/path' })
    expect(getCloseButtonDestination({ sameOriginHistory: false, currentURL: 'https://site.test' })).toEqual({ kind: 'top' })
  })
})
