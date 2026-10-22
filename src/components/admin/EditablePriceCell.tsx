'use client'

import { useState, type FormEvent } from 'react'
import type { DefaultCellComponentProps } from 'payload'

type ProductRow = {
  id?: number | string
  title?: string
  status?: 'draft' | 'published'
  _status?: 'draft' | 'published'
}

export function EditablePriceCell({
  cellData,
  className,
  rowData,
}: DefaultCellComponentProps) {
  const product = rowData as ProductRow & { price?: number | null; salePrice?: number | null }
  const productID = product.id
  const productTitle = product.title || 'product'
  const productStatus = product._status || product.status || 'draft'
  const currentPrice = typeof cellData === 'number' ? String(cellData) : ''
  const currentOfferPrice = typeof product.salePrice === 'number' && Number.isFinite(product.salePrice) ? String(product.salePrice) : ''
  return <EditablePriceEditor key={`${String(productID)}:${currentPrice}:${currentOfferPrice}`} productID={productID} productTitle={productTitle} productStatus={productStatus} currentPrice={currentPrice} currentOfferPrice={currentOfferPrice} className={className} />
}

function EditablePriceEditor({
  productID,
  productTitle,
  productStatus,
  currentPrice,
  currentOfferPrice,
  className,
}: {
  productID?: number | string
  productTitle: string
  productStatus: 'draft' | 'published'
  currentPrice: string
  currentOfferPrice: string
  className?: string
}) {
  const [price, setPrice] = useState(currentPrice)
  const [salePrice, setSalePrice] = useState(currentOfferPrice)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const savePrice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setFeedback('')

    if (typeof productID !== 'number' && typeof productID !== 'string') {
      setFeedback('Product ID unavailable')
      return
    }

    const trimmedPrice = price.trim()
    const nextPrice = trimmedPrice === '' ? null : Number(trimmedPrice)
    const trimmedOffer = salePrice.trim()
    const nextOfferPrice = trimmedOffer === '' ? null : Number(trimmedOffer)

    if (nextPrice !== null && (!Number.isFinite(nextPrice) || nextPrice < 0)) {
      setFeedback('Enter a valid regular price')
      return
    }
    if (nextOfferPrice !== null && (!Number.isFinite(nextOfferPrice) || nextOfferPrice < 0)) {
      setFeedback('Enter a valid offer price')
      return
    }
    if (nextPrice != null && nextOfferPrice != null && nextOfferPrice >= nextPrice) {
      setFeedback('Offer price must be lower than the regular price')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(String(productID))}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: nextPrice,
          salePrice: nextOfferPrice,
          priceMode: nextPrice === null ? 'ask' : 'show',
          status: productStatus,
          _status: productStatus,
        }),
      })

      if (!response.ok) throw new Error('Could not save price')

      setFeedback('Saved')
    } catch {
      setFeedback('Save failed. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className={className}
      onClick={(event) => event.stopPropagation()}
      onSubmit={savePrice}
      style={{ alignItems: 'center', display: 'flex', gap: 6, flexWrap: 'wrap' }}
    >
      <label className="sr-only" htmlFor={`price-${String(productID)}`}>
        Regular price in INR for {productTitle}
      </label>
      <span aria-hidden="true">₹</span>
      <input
        id={`price-${String(productID)}`}
        min="0"
        onChange={(event) => setPrice(event.target.value)}
        placeholder="Ask"
        step="1"
        type="number"
        value={price}
        style={{ maxWidth: 92, minWidth: 68 }}
      />
      <input
        aria-label={`Offer price for ${productTitle}`}
        min="0"
        onChange={(event) => setSalePrice(event.target.value)}
        placeholder="Offer"
        step="1"
        type="number"
        value={salePrice}
        style={{ maxWidth: 92, minWidth: 68 }}
      />
      <button disabled={saving} type="submit">
        {saving ? 'Saving…' : 'Save'}
      </button>
      <span aria-live="polite" role="status" style={{ fontSize: 12 }}>
        {feedback}
      </span>
    </form>
  )
}
