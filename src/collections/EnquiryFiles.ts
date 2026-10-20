import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { editorAccess } from '../access/roles'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Private attachments submitted with public enquiries. Files are served only
 * through Payload's upload endpoint, which applies this collection's read ACL. */
export const EnquiryFiles: CollectionConfig = {
  slug: 'enquiry-files',
  access: {
    create: editorAccess,
    delete: editorAccess,
    read: editorAccess,
    update: editorAccess,
  },
  admin: { useAsTitle: 'alt', group: 'Customers' },
  fields: [{ name: 'alt', type: 'text', required: true }],
  upload: {
    staticDir: path.resolve(dirname, '../../private/enquiry-files'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'model/stl', 'application/sla', 'application/vnd.ms-3mfdocument'],
  },
}
