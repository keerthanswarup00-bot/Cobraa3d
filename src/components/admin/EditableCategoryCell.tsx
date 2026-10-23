'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import type { DefaultCellComponentProps } from 'payload'

type CategoryOption = { id: number | string; name: string }
type ProductRow = {
  id?: number | string
  title?: string
  status?: 'draft' | 'published'
  _status?: 'draft' | 'published'
  category?: number | string | { id?: number | string } | null
}
type CategoriesResponse = { docs?: CategoryOption[] }

let categoryOptionsRequest: Promise<CategoryOption[]> | undefined

function loadCategoryOptions() {
  if (!categoryOptionsRequest) {
    categoryOptionsRequest = fetch('/api/categories?limit=1000&depth=0&sort=name', { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load categories')
        return response.json() as Promise<CategoriesResponse>
      })
      .then((data) => Array.isArray(data.docs) ? data.docs : [])
      .catch((error) => {
        categoryOptionsRequest = undefined
        throw error
      })
  }
  return categoryOptionsRequest
}

function getRelationID(value: ProductRow['category'] | unknown): string {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value && (typeof value.id === 'number' || typeof value.id === 'string')) return String(value.id)
  return ''
}

export function EditableCategoryCell({ cellData, className, rowData }: DefaultCellComponentProps) {
  const product = rowData as ProductRow
  const productID = product.id
  const productTitle = product.title || 'product'
  const productStatus = product._status || product.status || 'draft'
  const initialCategory = getRelationID(cellData ?? product.category)

  return (
    <EditableCategoryEditor
      key={`${String(productID)}:${initialCategory}`}
      className={className}
      productID={productID}
      productStatus={productStatus}
      productTitle={productTitle}
      initialCategory={initialCategory}
    />
  )
}

function EditableCategoryEditor({
  className,
  productID,
  productStatus,
  productTitle,
  initialCategory,
}: {
  className?: string
  productID?: number | string
  productStatus: 'draft' | 'published'
  productTitle: string
  initialCategory: string
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [category, setCategory] = useState(initialCategory)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let active = true
    loadCategoryOptions()
      .then((options) => { if (active) setCategories(options) })
      .catch(() => { if (active) setFeedback('Categories failed to load') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const saveCategory = async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCategory = event.target.value
    setCategory(nextCategory)
    setFeedback('')

    if ((typeof productID !== 'number' && typeof productID !== 'string') || !productID) {
      setFeedback('Product ID unavailable')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(String(productID))}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: nextCategory || null,
          status: productStatus,
          _status: productStatus,
        }),
      })

      if (!response.ok) throw new Error('Could not save category')
      setFeedback('Saved')
    } catch {
      setCategory(initialCategory)
      setFeedback('Save failed. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={className} onClick={(event) => event.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label className="sr-only" htmlFor={`category-${String(productID)}`}>Category for {productTitle}</label>
      <select
        id={`category-${String(productID)}`}
        value={category}
        disabled={loading || saving}
        onChange={saveCategory}
        aria-label={`Category for ${productTitle}`}
        style={{ maxWidth: 200, minWidth: 130 }}
      >
        <option value="">No Category</option>
        {categories.map((option) => <option key={String(option.id)} value={String(option.id)}>{option.name}</option>)}
      </select>
      <span aria-live="polite" role="status" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{loading ? 'Loading…' : saving ? 'Saving…' : feedback}</span>
    </div>
  )
}
