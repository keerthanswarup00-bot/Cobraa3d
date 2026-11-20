import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/utilities/getSiteSettings'

export const metadata: Metadata = {
  title: 'Shipping and delivery',
  alternates: { canonical: '/shipping-and-delivery-policy' },
}

export default async function ShippingAndDeliveryPage() {
  const { deliveryLine } = await getSiteSettings()
  return (
    <main className="public-copy-page">
      <p className="public-copy-breadcrumb"><Link href="/products">← All products</Link></p>
      <article className="public-copy-article">
        <h1>Shipping and delivery</h1>
        {deliveryLine?.trim() && <p>{deliveryLine}</p>}
        <p>Include your delivery PIN code in your WhatsApp enquiry so we can discuss shipping for your order.</p>
      </article>
    </main>
  )
}
