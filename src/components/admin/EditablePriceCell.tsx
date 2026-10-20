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
  const product = rowData as ProductRow
  const productID = product.id
  const productTitle = product.title || 'product'
  const productStatus = product._status || product.status || 'draft'
  const currentPrice = typeof cellData === 'number' ? String(cellData) : ''
  return <EditablePriceEditor key={`${String(productID)}:${currentPrice}`} productID={productID} productTitle={productTitle} productStatus={productStatus} currentPrice={currentPrice} className={className} />
}

function EditablePriceEditor({
  productID,
  productTitle,
  productStatus,
  currentPrice,
  className,
}: {
  productID?: number | string
  productTitle: string
  productStatus: 'draft' | 'published'
  currentPrice: string
  className?: string
}) {
  const [price, setPrice] = useState(currentPrice)
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
    if (nextPrice !== null && (!Number.isFinite(nextPrice) || nextPrice < 0)) {
      setFeedback('Enter a valid price')
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
      style={{ alignItems: 'center', display: 'flex', gap: 6 }}
    >
      <label className="sr-only" htmlFor={`price-${String(productID)}`}>
        Price in INR for {productTitle}
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
      <button disabled={saving} type="submit">
        {saving ? 'Saving…' : 'Save'}
      </button>
      <span aria-live="polite" role="status" style={{ fontSize: 12 }}>
        {feedback}
      </span>
    </form>
  )
}
