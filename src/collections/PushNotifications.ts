import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access/roles'
import { isSafePushURL } from '../lib/pushServer'

const editableUntilSent = ({ doc }: { doc?: { status?: string | null } }) => doc?.status !== 'sent'

export const PushNotifications: CollectionConfig = {
  slug: 'push-notifications',
  access: {
    create: editorAccess,
    read: editorAccess,
    update: editorAccess,
    delete: editorAccess,
  },
  admin: {
    group: 'Notifications',
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'sentAt', 'sentCount', 'failedCount'],
  },
  hooks: {
    beforeChange: [({ data, originalDoc }) => {
      if (originalDoc?.status === 'sent') throw new Error('Sent notifications are read-only.')
      return data
    }],
  },
  fields: [
    { name: 'composer', type: 'ui', admin: { components: { Field: '@/components/PushNotificationComposer#PushNotificationComposer' } } },
    { name: 'title', type: 'text', required: true, maxLength: 50, access: { update: editableUntilSent } },
    { name: 'body', type: 'textarea', required: true, maxLength: 120, access: { update: editableUntilSent } },
    { name: 'url', type: 'text', required: true, defaultValue: '/', validate: (value: unknown) => value == null || value === '' || isSafePushURL(String(value)) || 'Use a relative path or a same-origin URL.', access: { update: editableUntilSent } },
    { name: 'status', type: 'select', defaultValue: 'draft', options: ['draft', 'sending', 'sent'].map((value) => ({ label: value, value })), access: { update: editableUntilSent } },
    { name: 'sentAt', type: 'date', admin: { readOnly: true } },
    { name: 'sentCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'failedCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'testSentAt', type: 'date', admin: { readOnly: true } },
    { name: 'lastCursor', type: 'text', admin: { hidden: true, readOnly: true } },
  ],
}
