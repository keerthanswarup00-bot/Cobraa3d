import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access/roles'

export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  access: {
    create: () => false,
    read: editorAccess,
    update: () => false,
    delete: editorAccess,
  },
  admin: {
    group: 'Notifications',
    useAsTitle: 'endpoint',
    defaultColumns: ['source', 'isTest', 'active', 'createdAt', 'lastError'],
  },
  fields: [
    { name: 'endpoint', type: 'text', required: true, unique: true, index: true },
    { name: 'p256dh', type: 'text', required: true },
    { name: 'auth', type: 'text', required: true },
    { name: 'userAgent', type: 'text', maxLength: 200 },
    { name: 'source', type: 'text', maxLength: 40 },
    { name: 'isTest', type: 'checkbox', defaultValue: false },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'lastError', type: 'text', maxLength: 160 },
  ],
}
