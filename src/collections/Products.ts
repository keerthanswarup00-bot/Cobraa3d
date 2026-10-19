import type { CollectionConfig, Where } from 'payload'
import { slugField } from 'payload'
import { editorAccess } from '../access/roles'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'
import { generatePreviewPath } from '../utilities/generatePreviewPath'

export const Products: CollectionConfig = {
  slug: 'products',
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
    defaultColumns: ['title', 'category', 'price', 'status', 'availability', 'featured'],
    livePreview: { url: ({ data, req }) => generatePreviewPath({ slug: data?.slug, collection: 'products', req }) },
    preview: (data, { req }) => generatePreviewPath({ slug: data?.slug as string, collection: 'products', req }),
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Product name customers will see. Example: Desk nameplate.' } },
    slugField({ name: 'slug', position: 'sidebar', required: false }),
    { name: 'status', type: 'select', defaultValue: 'draft', options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }], admin: { position: 'sidebar' } },
    { name: 'isDemo', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Development demonstration record. Never use as confirmed stock or pricing.' } },
    { type: 'tabs', tabs: [
      { label: 'Basics', fields: [
        { name: 'category', type: 'relationship', relationTo: 'categories', admin: { description: 'Choose a visible catalogue category.' } },
        { name: 'shortDescription', type: 'textarea', maxLength: 240, admin: { description: 'A short summary for product cards. Keep it under 240 characters.' } },
        { name: 'description', type: 'richText' },
        { name: 'images', type: 'array', label: 'Photos (first photo is the main image)', admin: { description: 'Add useful alt text for every photo. The first photo is used as the main image.' }, fields: [
          { name: 'image', type: 'upload', relationTo: 'media', required: true }, { name: 'alt', type: 'text', required: true },
        ] },
        { name: 'price', type: 'number', min: 0, admin: { description: 'Optional. Leave blank to show “Ask for price”.' } },
        { name: 'originalPrice', type: 'number', min: 0 }, { name: 'currency', type: 'text', defaultValue: 'INR', required: true },
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
      { label: 'Advanced', fields: [{ name: 'publishedAt', type: 'date' }, { name: 'sortOrder', type: 'number', defaultValue: 0 }] },
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
