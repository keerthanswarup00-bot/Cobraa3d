import type { CollectionConfig } from 'payload'
import { adminOnly, editorAccess } from '../access/roles'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'

export const Enquiries: CollectionConfig = {
  slug: 'enquiries', access: { create: () => true, delete: adminOnly, read: editorAccess, update: editorAccess }, admin: { useAsTitle: 'name', defaultColumns: ['name', 'type', 'status', 'createdAt'] },
  fields: [
    { name: 'type', type: 'select', required: true, options: ['custom', 'bulk', 'product'].map((value) => ({ label: value, value })) },
    { name: 'name', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'message', type: 'textarea' }, { name: 'quantity', type: 'number' },
    { name: 'occasion', type: 'text' }, { name: 'colour', type: 'text' }, { name: 'budget', type: 'text' },
    { name: 'files', type: 'upload', relationTo: 'media', hasMany: true }, { name: 'productRef', type: 'relationship', relationTo: 'products' },
    { name: 'source', type: 'select', options: ['qr', 'nfc', 'wa', 'ig', 'other'].map((value) => ({ label: value, value })) },
    { name: 'status', type: 'select', defaultValue: 'new', options: ['new', 'contacted', 'closed'].map((value) => ({ label: value, value })) },
    { name: 'internalNotes', type: 'textarea', access: { read: ({ req }) => Boolean(req.user && (req.user as { role?: string }).role === 'admin'), update: ({ req }) => Boolean(req.user && (req.user as { role?: string }).role === 'admin') } }, { name: 'createdAt', type: 'date' },
  ], hooks: { afterChange: [revalidateSite], afterDelete: [revalidateDeletedSiteContent] },
}
