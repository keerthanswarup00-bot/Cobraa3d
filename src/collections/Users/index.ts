import type { CollectionConfig, PayloadRequest } from 'payload'
import { revalidateDeletedSiteContent, revalidateSite } from '../../hooks/revalidateSite'

const adminOnly = ({ req }: { req: PayloadRequest }) => Boolean(req.user && (req.user as { role?: string }).role === 'admin')

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      saveToJWT: true,
      options: [{ label: 'Admin', value: 'admin' }, { label: 'Editor', value: 'editor' }],
      access: { update: ({ req }) => Boolean(req.user && (req.user as { role?: string }).role === 'admin') },
    },
  ],
  hooks: {
    afterChange: [revalidateSite],
    afterDelete: [revalidateDeletedSiteContent],
  },
  timestamps: true,
}
