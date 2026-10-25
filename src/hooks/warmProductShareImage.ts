import type { CollectionAfterChangeHook } from 'payload'
import { getProductShareImageURL } from '../lib/shareImage-constants'
import { getServerSideURL } from '../utilities/getURL'

async function requestProductShareImage(url: string, slug: string) {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(9000) })
    if (!response.ok) {
      console.error(`Could not warm product share image for "${slug}": HTTP ${response.status}`)
      return
    }
    await response.arrayBuffer()
  } catch (error) {
    console.error(`Could not warm product share image for "${slug}"`, error)
  }
}

export const warmProductShareImage: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (
    !req.context.disableRevalidate &&
    doc.status === 'published' &&
    doc._status === 'published' &&
    !doc.isDemo &&
    doc.slug &&
    doc.images?.[0]?.image
  ) {
    await requestProductShareImage(
      getProductShareImageURL(getServerSideURL(), doc.slug, doc.updatedAt),
      doc.slug,
    )
  }
  return doc
}
