import type { CollectionConfig } from 'payload'

export const WhatsappClicks: CollectionConfig = {
  slug: 'whatsapp-clicks',
  admin: {
    group: 'Insights',
    defaultColumns: ['slug', 'source', 'createdAt'],
    useAsTitle: 'slug',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => false,
    update: () => false,
    delete: ({ req: { user } }) => Boolean(user),
  },
  timestamps: true,
  fields: [
    { name: 'slug', type: 'text', maxLength: 80 },
    { name: 'source', type: 'text', maxLength: 40 },
  ],
}
