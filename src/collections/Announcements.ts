import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access/roles'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'

export const Announcements: CollectionConfig = {
  slug: 'announcements', access: { create: editorAccess, delete: editorAccess, read: () => true, update: editorAccess }, admin: { useAsTitle: 'message' },
  fields: [
    { name: 'message', type: 'text', required: true }, { name: 'link', type: 'text' },
    { name: 'type', type: 'select', defaultValue: 'info', options: ['info', 'festive', 'alert'].map((value) => ({ label: value, value })) },
    { name: 'startsAt', type: 'date' }, { name: 'endsAt', type: 'date' }, { name: 'dismissible', type: 'checkbox', defaultValue: true },
    { name: 'priority', type: 'number', defaultValue: 0 }, { name: 'active', type: 'checkbox', defaultValue: false },
    { name: 'announcementPreview', type: 'ui', admin: { components: { Field: '@/components/AnnouncementPreview#AnnouncementPreview' } } },
  ], hooks: { afterChange: [revalidateSite], afterDelete: [revalidateDeletedSiteContent] },
}
