import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export const alt = 'Cobraa 3D product and studio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

export default async function OpenGraphImage() {
  const payload = await getPayload({ config })
  const [{ docs }, settings] = await Promise.all([
    payload.find({ collection: 'products', where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }] }, sort: 'featured', limit: 12, depth: 2 }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])
  const product = docs.find((item) => item.images?.length)
  const image = product?.images?.[0]?.image
  const photo = typeof image === 'object' && image?.url ? new URL(image.url, getServerSideURL()).toString() : undefined
  return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', padding: 64, background: '#f6f5f1', color: '#080808', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden' }}>
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .2 }} viewBox="0 0 1200 630"><path d="M-30 170C140 30 300 290 500 130S850 20 1240 170M-20 220C140 80 300 340 520 180S870 70 1240 220M-20 270C150 130 320 390 540 230S880 120 1240 270M-20 320C150 180 320 440 550 280S900 170 1240 320" fill="none" stroke="#807e77" strokeWidth="2" /></svg>
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 48 }}>
      <div style={{ display: 'flex', width: '52%', flexDirection: 'column', justifyContent: 'center' }}><div style={{ fontSize: 22, letterSpacing: 8, textTransform: 'uppercase' }}>{settings.brandName}</div><div style={{ marginTop: 36, maxWidth: 600, fontSize: 54, lineHeight: 1.05, letterSpacing: -2 }}>{settings.hero?.headline || settings.tagline || 'Creative 3D prints and ideas'}</div><div style={{ marginTop: 28, fontSize: 22, color: '#555' }}>Products · DIY kits · Custom gifts</div></div>
      <div style={{ display: 'flex', width: '42%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 8, overflow: 'hidden', background: '#e7e5e0' }}>{photo ? <img src={photo} alt={product?.title || settings.brandName} width="480" height="500" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 28, color: '#777' }}>{settings.brandName}</div>}</div>
    </div>
  </div>, size)
}
