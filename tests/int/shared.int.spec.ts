import { describe, expect, it } from 'vitest'
import {
  buildNameplateMessage,
  buildCustomerReplyUrl,
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
} from '@/lib/shared'

describe('shared business helpers', () => {
  it('encodes WhatsApp messages and normalizes the configured number to digits', () => {
    expect(buildWhatsAppUrl({ number: '+91 98765 43210', message: 'Hi & hello' })).toBe('https://wa.me/919876543210?text=Hi%20%26%20hello')
    expect(buildWhatsAppUrl({ number: '12abc', message: 'Hi' })).toBeNull()
    expect(buildWhatsAppUrl({ number: '+91 abc 98765 43210', message: 'Hi' })).toBeNull()
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
    expect(message).toContain('https://example.test/products/sample-kit')
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
      expect(message).toContain(`https://cobraa3d.example/products/${slug}`)
      expect(message).not.toContain('Ask for price')
      const url = buildWhatsAppUrl({ number: '+91 98765 43210', message })
      expect(url).toContain('https://wa.me/919876543210?text=')
      expect(new URL(url!).searchParams.get('text')).toBe(message)
    }
    expect(buildWhatsAppUrl({ number: null, message: 'test' })).toBeNull()
  })

  it('includes a public image URL as text in product enquiries', () => {
    const message = buildProductMessage({ title: 'A', images: [{ image: { url: 'https://cdn.test/a.jpg' } }] })
    expect(message).toContain('Product image: https://cdn.test/a.jpg')
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

  it('chooses a safe close destination from same-origin history, parent, or top', () => {
    expect(getCloseButtonDestination({ sameOriginHistory: true, currentURL: 'https://site.test', parentUrl: 'https://parent.test' })).toEqual({ kind: 'back' })
    expect(getCloseButtonDestination({ sameOriginHistory: false, currentURL: 'https://site.test', parentUrl: 'https://parent.test/path' })).toEqual({ kind: 'parent', url: 'https://parent.test/path' })
    expect(getCloseButtonDestination({ sameOriginHistory: false, currentURL: 'https://site.test' })).toEqual({ kind: 'top' })
  })
})
