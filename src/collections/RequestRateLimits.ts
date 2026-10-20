import type { CollectionConfig } from 'payload'

/** Internal durable counters used by public endpoints. */
export const RequestRateLimits: CollectionConfig = {
  slug: 'request-rate-limits',
  admin: { hidden: true },
  access: {
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'windowStart', type: 'number', required: true },
    { name: 'count', type: 'number', required: true },
  ],
  timestamps: false,
}
