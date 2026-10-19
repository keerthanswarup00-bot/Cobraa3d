import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access/roles'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'

export const PrintBed: CollectionConfig = {
  slug: 'print-bed', access: { create: editorAccess, delete: editorAccess, read: ({ req }) => req.user ? true : { visible: { equals: true } }, update: editorAccess }, admin: { useAsTitle: 'caption', defaultColumns: ['caption', 'visible', 'postedAt'] },
  fields: [
    { name: 'photo', type: 'upload', relationTo: 'media', validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => value || siblingData?.video ? true : 'Add a photo or a short video.' },
    { name: 'video', type: 'upload', relationTo: 'media', validate: (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => value || siblingData?.photo ? true : 'Add a photo or a short video.' },
    { name: 'caption', type: 'textarea', maxLength: 140, required: true }, { name: 'linkedProduct', type: 'relationship', relationTo: 'products' },
    { name: 'postedAt', type: 'date', defaultValue: () => new Date().toISOString() }, { name: 'visible', type: 'checkbox', defaultValue: true },
  ], hooks: { afterChange: [revalidateSite], afterDelete: [revalidateDeletedSiteContent] },
}
