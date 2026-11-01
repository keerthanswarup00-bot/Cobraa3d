import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/product/ProductLink', () => ({
  ProductLink: ({ href, children }: { href: string; children: React.ReactNode }) => createElement('a', { href }, children),
}))

import { ProductDetail } from '@/components/ProductDetail'

const remote = 'https://abc.supabase.co/storage/v1/object/public/media/lamp.webp'
const remoteSecond = 'https://abc.supabase.co/storage/v1/object/public/media/lamp-2.webp'
const remoteRelated = 'https://abc.supabase.co/storage/v1/object/public/media/related.webp'
const local = '/api/media/file/lamp.webp'

function render(images: { url: string; alt: string }[], related: { slug: string; title: string; image?: { url: string; alt: string } }[] = []) {
  return renderToStaticMarkup(createElement(ProductDetail, {
    brandName: 'Cobraa 3D', siteURL: 'https://example.test', ctaLabel: 'Ask on WhatsApp', whatsappNumber: '+91 98765 43210', related,
    product: { title: 'Desk Lamp', slug: 'desk-lamp', images },
  }))
}

// Regression: product pages opened from a shared link rendered blank image boxes because next/image's optimizer
// rejects hosts that are not in images.remotePatterns, and cloud-storage uploads are served from such a host.
describe('product detail page images', () => {
  it('renders cloud-storage images directly instead of through the blocked optimizer', () => {
    const html = render([{ url: remote, alt: 'Lamp' }, { url: remoteSecond, alt: 'Lamp side' }], [{ slug: 'other', title: 'Other', image: { url: remoteRelated, alt: 'Other product' } }])
    expect(html).toContain(`src="${remote}"`)
    expect(html).toContain(`src="${remoteSecond}"`)
    expect(html).toContain(`src="${remoteRelated}"`)
    expect(html).toContain('alt="Other product"')
    expect(html).not.toContain('/_next/image?url=https%3A%2F%2Fabc.supabase.co')
  })

  it('still optimizes local uploads through next/image', () => {
    const html = render([{ url: local, alt: 'Lamp' }], [{ slug: 'other', title: 'Other', image: { url: local, alt: 'Other' } }])
    expect(html).toContain('/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Flamp.webp')
    expect(html).toContain('sizes="(max-width: 759px) 44vw, (max-width: 1399px) 22vw, 314px"')
  })

  it('shows the title placeholder only when a product truly has no photo', () => {
    expect(render([])).toContain('detail-image-empty')
    expect(render([{ url: remote, alt: 'Lamp' }])).not.toContain('detail-image-empty')
  })

  it('keeps a suggested product link visible when its photo is missing', () => {
    const html = render([{ url: remote, alt: 'Lamp' }], [{ slug: 'other', title: 'Other' }])
    expect(html).toContain('You may also like')
    expect(html).toContain('Other')
    expect(html).not.toContain('alt="Other"')
  })
})
