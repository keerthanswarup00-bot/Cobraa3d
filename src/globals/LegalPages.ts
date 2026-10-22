import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateSiteGlobal } from '../hooks/revalidateSite'

export const LegalPages: GlobalConfig = {
  slug: 'legal-pages', access: { read: () => true, update: isAdmin }, hooks: { afterChange: [revalidateSiteGlobal] },
  fields: [
    { name: 'privacy', type: 'richText' },
    { name: 'pushAlertsPrivacyLine', type: 'textarea', defaultValue: "If you turn on offer alerts, we store your browser's push address so we can send you offers. We don't store your name or number. Turn alerts off any time from the site or your browser settings.", admin: { description: 'Copy this line into the privacy page when you enable offer alerts.' } },
    { name: 'terms', type: 'richText' },
  ],
}
