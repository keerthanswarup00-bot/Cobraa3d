import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProductDetail } from '@/components/ProductDetail'

const remote = 'https://abc.supabase.co/storage/v1/object/public/media/lamp.webp'
const remoteSecond = 'https://abc.supabase.co/storage/v1/object/public/media/lamp-2.webp'
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
    const html = render([{ url: remote, alt: 'Lamp' }, { url: remoteSecond, alt: 'Lamp side' }], [{ slug: 'other', title: 'Other', image: { url: remote, alt: 'Other' } }])
    expect(html).toContain(`src="${remote}"`)
    expect(html).toContain(`src="${remoteSecond}"`)
    expect(html).not.toContain('/_next/image?url=https%3A%2F%2Fabc.supabase.co')
  })

  it('still optimizes local uploads through next/image', () => {
    const html = render([{ url: local, alt: 'Lamp' }])
    expect(html).toContain('/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Flamp.webp')
  })

  it('shows the title placeholder only when a product truly has no photo', () => {
    expect(render([])).toContain('detail-image-empty')
    expect(render([{ url: remote, alt: 'Lamp' }])).not.toContain('detail-image-empty')
  })
})
