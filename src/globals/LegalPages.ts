import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateSiteGlobal } from '../hooks/revalidateSite'

export const LegalPages: GlobalConfig = {
  slug: 'legal-pages', access: { read: () => true, update: isAdmin }, hooks: { afterChange: [revalidateSiteGlobal] },
  fields: [{ name: 'privacy', type: 'richText' }, { name: 'terms', type: 'richText' }],
}
