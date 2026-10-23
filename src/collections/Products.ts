import type { CollectionConfig, Where } from 'payload'
import { slugField } from 'payload'
import { editorAccess } from '../access/roles'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'
import { generatePreviewPath } from '../utilities/generatePreviewPath'

export const Products: CollectionConfig = {
  slug: 'products',
  defaultSort: '-updatedAt',
  access: {
    create: editorAccess,
    delete: editorAccess,
    read: ({ req }) => req.user ? true : ({ and: [
      { status: { equals: 'published' } }, { _status: { equals: 'published' } },
      ...(process.env.NODE_ENV === 'production' ? [{ isDemo: { not_equals: true } }] : []),
    ] } as Where),
    update: editorAccess,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['images', 'title', 'category', 'price', 'salePrice', 'status', 'updatedAt'],
    listSearchableFields: ['title', 'shortDescription', 'material', 'slug'],
    pagination: { defaultLimit: 20 },
    livePreview: { url: ({ data, req }) => generatePreviewPath({ slug: data?.slug, collection: 'products', req }) },
    preview: (data, { req }) => generatePreviewPath({ slug: data?.slug as string, collection: 'products', req }),
  },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Overview', fields: [
        { name: 'title', type: 'text', required: true, admin: { description: 'Product name customers will see.' } },
        { name: 'shortDescription', label: 'Description', type: 'textarea', maxLength: 240, admin: { description: 'The description shown on product cards. Keep it under 240 characters.' } },
        { name: 'category', type: 'relationship', relationTo: 'categories', admin: { description: 'Choose a catalogue category for this product.', components: { Cell: '/components/admin/EditableCategoryCell#EditableCategoryCell' } } },
        { name: 'price', type: 'number', min: 0, admin: {
          description: 'Enter the price in INR. Leave blank to show “Ask for price”.',
          components: { Cell: '/components/admin/EditablePriceCell#EditablePriceCell' },
        } },
        { name: 'salePrice', type: 'number', min: 0, admin: { description: 'Optional one-time offer price for active seasonal promotions. It must be lower than the regular price.' }, validate: (value: unknown, { data }: { data?: { price?: number | null } }) => {
          if (value == null || value === '') return true
          if (typeof value !== 'number' || !Number.isFinite(value)) return 'Enter a valid offer price.'
          if (typeof data?.price === 'number' && Number.isFinite(data.price) && value >= data.price) return 'Offer price must be lower than the regular price.'
          if (typeof data?.price !== 'number' || !Number.isFinite(data.price)) return 'Choose a regular price before setting an offer price.'
          return true
        } },
      ] },
      { label: 'More details', fields: [
        slugField({ name: 'slug', required: false }),
        { name: 'status', type: 'select', defaultValue: 'draft', admin: { description: 'Published makes the product visible on the storefront. Keep this in sync with the publish button.' }, options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }] },
        { name: 'isDemo', type: 'checkbox', defaultValue: false, admin: { description: 'Development demonstration record. Never use as confirmed stock or pricing.' } },
        { name: 'description', label: 'Full description', type: 'richText' },
        { name: 'images', type: 'array', label: 'Photos (first photo is the main image)', admin: { description: 'Add useful alt text for every photo. The first photo is used as the main image.', components: { Cell: '/components/admin/ProductImageCell#ProductImageCell' } }, fields: [
          { name: 'image', type: 'upload', relationTo: 'media', required: true }, { name: 'alt', type: 'text', required: true },
        ] },
        { name: 'originalPrice', type: 'number', min: 0, admin: { description: 'Hidden from the public storefront. Use only for internal bookkeeping or migration if needed.' } }, { name: 'currency', type: 'text', defaultValue: 'INR', required: true },
        { name: 'priceMode', type: 'select', defaultValue: 'ask', options: [{ label: 'Ask for price', value: 'ask' }, { label: 'Show price', value: 'show' }] },
      ] },
      { label: 'Details', fields: [
        { name: 'includedItems', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
        { name: 'colourOptions', type: 'array', fields: [{ name: 'name', type: 'text', required: true }, { name: 'hex', type: 'text', validate: (value: unknown) => value == null || value === '' || /^#[0-9a-f]{6}$/i.test(String(value)) || 'Enter a six digit hex colour.' }] },
        { name: 'dimensions', type: 'text' }, { name: 'material', type: 'text' }, { name: 'ageGroup', type: 'text' },
        { name: 'careNotes', type: 'textarea' }, { name: 'productionNote', type: 'textarea' },
        { name: 'layerPhotos', type: 'upload', relationTo: 'media', hasMany: true },
        { name: 'model3d', type: 'upload', relationTo: 'media', admin: { description: 'Optional GLB preview. Export a GLB/glTF from your CAD tool or slicer (if supported), then upload it. Some slicers do not export 3D scene files.' } },
      ] },
      { label: 'Options', fields: [
        { name: 'availability', type: 'select', defaultValue: 'made_to_order', options: ['in_stock', 'made_to_order', 'out_of_stock', 'coming_soon'].map((value) => ({ label: value.replaceAll('_', ' '), value })) },
        { name: 'personalisable', type: 'checkbox', defaultValue: false }, { name: 'personalisationNotes', type: 'textarea' },
        { name: 'badges', type: 'select', hasMany: true, options: ['new', 'bestseller', 'festive', 'customisable'].map((value) => ({ label: value, value })) },
        { name: 'featured', type: 'checkbox', defaultValue: false }, { name: 'seasonalTags', type: 'array', fields: [{ name: 'tag', type: 'text' }] },
        { name: 'relatedProducts', type: 'relationship', relationTo: 'products', hasMany: true },
      ] },
      { label: 'WhatsApp and SEO', fields: [
        { name: 'whatsappMessageOverride', type: 'textarea', admin: { description: 'Optional message. Tokens: {{title}}, {{price}}, {{url}}, {{imageUrl}}.' } },
        { name: 'seoTitle', type: 'text' }, { name: 'seoDescription', type: 'textarea', maxLength: 160 },
      ] },
      { label: 'Advanced', fields: [
        { name: 'publishedAt', type: 'date' }, { name: 'sortOrder', type: 'number', defaultValue: 0 },
      ] },
    ] },
  ],
  hooks: {
    beforeValidate: [({ data }) => {
      if (!data) return data
      if (data.title && !data.slug) {
        data.slug = String(data.title)
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }
      return data
    }],
    beforeChange: [({ data, operation, originalDoc }) => {
      const customStatusChanged = Boolean(data.status) && (operation === 'create' || data.status !== originalDoc?.status)
      if (customStatusChanged && data.status) data._status = data.status
      else if (data._status) data.status = data._status
      else if (data.status) data._status = data.status
      return data
    }],
    afterChange: [revalidateSite],
    afterDelete: [revalidateDeletedSiteContent],
  },
  versions: { drafts: { autosave: { interval: 100 } }, maxPerDoc: 50 },
  timestamps: true,
}
