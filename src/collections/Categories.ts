import type { CollectionConfig, Where } from 'payload'
import { slugField } from 'payload'
import { editorAccess } from '../access/roles'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: editorAccess,
    delete: editorAccess,
    read: async ({ req }) => {
      if (req.user) return true
      const { docs } = await req.payload.find({
        collection: 'products',
        where: { and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }, ...(process.env.NODE_ENV === 'production' ? [{ isDemo: { not_equals: true } }] : [])] },
        limit: 1000,
        depth: 0,
        overrideAccess: true,
      })
      const linked = docs.map((product) => {
        const category = product.category
        return typeof category === 'object' && category ? category.id : category
      }).filter((id): id is number => typeof id === 'number')
      return { and: [{ visible: { equals: true } }, { id: { in: linked } }] } as Where
    },
    update: editorAccess,
  },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'visible', 'sortOrder'], listSearchableFields: ['name', 'slug'] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ name: 'slug', position: 'sidebar' }),
    { name: 'description', type: 'textarea' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'products',
      label: 'Products in this category',
      type: 'join',
      collection: 'products',
      on: 'category',
      defaultLimit: 100,
      defaultSort: 'title',
      admin: { defaultColumns: ['title', 'status', 'price'] },
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
    { name: 'visible', type: 'checkbox', defaultValue: true },
  ],
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateDeletedSiteContent] },
  timestamps: true,
}
