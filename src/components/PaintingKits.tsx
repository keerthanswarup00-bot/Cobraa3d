'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PaintingPlayground } from './ConnectInteractions'

export function PaintingKits({ kidsCategory, adultsCategory, kidsDescription, adultsDescription, schoolEnquiryURL }: {
  kidsCategory?: string; adultsCategory?: string; kidsDescription: string; adultsDescription: string; schoolEnquiryURL?: string | null
}) {
  const [tab, setTab] = useState<'kids' | 'adults'>('kids')
  const kidsHref = kidsCategory ? `/products?category=${encodeURIComponent(kidsCategory)}` : '/products'
  const adultsHref = adultsCategory ? `/products?category=${encodeURIComponent(adultsCategory)}` : '/products'
  const description = tab === 'kids' ? kidsDescription : adultsDescription
  const href = tab === 'kids' ? kidsHref : adultsHref
  return <div className="kits-panel">
    <div className="kit-tabs" role="tablist" aria-label="Painting kit audience">
      <button id="kids-kit-tab" role="tab" aria-selected={tab === 'kids'} aria-controls="kit-panel" onClick={() => setTab('kids')}>Kids</button>
      <button id="adults-kit-tab" role="tab" aria-selected={tab === 'adults'} aria-controls="kit-panel" onClick={() => setTab('adults')}>Adults</button>
    </div>
    <div id="kit-panel" role="tabpanel" aria-labelledby={tab === 'kids' ? 'kids-kit-tab' : 'adults-kit-tab'} className="kit-content">
      <div><h3>{tab === 'kids' ? 'Kids’ painting kits' : 'Adult painting kits'}</h3><p>{description}</p><div className="kit-actions"><Link href={href}>{tab === 'kids' ? 'Explore Kids’ Kits' : 'Explore Adult Kits'}</Link>{tab === 'kids' && schoolEnquiryURL && <a href={schoolEnquiryURL} target="_blank" rel="noopener noreferrer">Enquire for Schools & Preschools</a>}</div></div>
      <PaintingPlayground categoryHref={href} />
    </div>
  </div>
}
