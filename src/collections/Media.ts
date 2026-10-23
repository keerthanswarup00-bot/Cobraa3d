import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { editorAccess } from '../access/roles'
import { revalidateDeletedSiteContent, revalidateSite } from '../hooks/revalidateSite'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const webp = { format: 'webp' as const, options: { quality: 82 } }

export const Media: CollectionConfig = {
  slug: 'media',
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateDeletedSiteContent] },
  folders: true,
  access: {
    create: editorAccess,
    delete: editorAccess,
    read: anyone,
    update: editorAccess,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    resizeOptions: { width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true },
    formatOptions: webp,
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'model/gltf-binary', 'model/gltf+json', 'model/stl', 'application/sla', 'application/vnd.ms-3mfdocument'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        formatOptions: webp,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
        formatOptions: webp,
      },
      {
        name: 'small',
        width: 600,
        formatOptions: webp,
      },
      {
        name: 'medium',
        width: 900,
        formatOptions: webp,
      },
      {
        name: 'large',
        width: 1400,
        formatOptions: webp,
      },
      {
        name: 'xlarge',
        width: 1600,
        formatOptions: webp,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
        formatOptions: webp,
      },
    ],
  },
}
