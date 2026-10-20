import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access/roles'
import { publicActiveWindow } from '../access/publicActiveWindow'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'

export const Offers: CollectionConfig = {
  slug: 'offers',
  access: {
    create: editorAccess,
    delete: editorAccess,
    read: publicActiveWindow,
    update: editorAccess,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'statusSummary', type: 'ui', admin: { components: { Field: '@/components/OfferStatusSummary#OfferStatusSummary' } } },
    { name: 'title', type: 'text', required: true }, { name: 'description', type: 'textarea' },
    { name: 'discountText', type: 'text' }, { name: 'applicableProducts', type: 'relationship', relationTo: 'products', hasMany: true },
    { name: 'startsAt', type: 'date' }, { name: 'endsAt', type: 'date' }, { name: 'terms', type: 'richText' },
    { name: 'couponCode', type: 'text' }, { name: 'ctaLabel', type: 'text' }, { name: 'ctaLink', type: 'text' },
    { name: 'style', type: 'select', defaultValue: 'standard', options: [{ label: 'Standard', value: 'standard' }, { label: 'Festive', value: 'festive' }] },
    { name: 'active', type: 'checkbox', defaultValue: false },
  ], hooks: { afterChange: [revalidateSite], afterDelete: [revalidateDeletedSiteContent] },
}
