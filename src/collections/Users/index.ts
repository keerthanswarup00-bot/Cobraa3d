import type { CollectionConfig, PayloadRequest } from 'payload'
import { revalidateDeletedSiteContent, revalidateSite } from '../../hooks/revalidateSite'

const adminOnly = ({ req }: { req: PayloadRequest }) => Boolean(req.user && (req.user as { role?: string }).role === 'admin')

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminOnly,
    create: async ({ req }) => {
      if (adminOnly({ req } as Parameters<typeof adminOnly>[0])) return true
      const users = await req.payload.find({ collection: 'users', limit: 1, depth: 0, overrideAccess: true })
      return users.totalDocs === 0
    },
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
    beforeChange: [async ({ data, req, operation }) => {
      if (operation === 'create') {
        const existing = await req.payload.find({ collection: 'users', limit: 1, depth: 0 })
        if (existing.totalDocs === 0) data.role = 'admin'
      }
      return data
    }],
    afterChange: [revalidateSite],
    afterDelete: [revalidateDeletedSiteContent],
  },
  timestamps: true,
}
