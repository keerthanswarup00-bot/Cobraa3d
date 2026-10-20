import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

function shouldRevalidate(req: { url?: string }, context: { disableRevalidate?: boolean }) {
  return !context.disableRevalidate && !req.url?.includes('/admin/')
}

async function revalidatePublicSite() {
  const { revalidatePath, revalidateTag } = await import('next/cache')
  revalidateTag('site-content', 'max')
  revalidateTag('site-settings', 'max')
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/products/[slug]', 'page')
  revalidatePath('/categories/[slug]', 'page')
  revalidatePath('/painting-kits')
  revalidatePath('/custom')
  revalidatePath('/location')
}

export const revalidateSite: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (shouldRevalidate(req, req.context)) {
    await revalidatePublicSite()
  }
  return doc
}

export const revalidateDeletedSiteContent: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (shouldRevalidate(req, req.context)) {
    await revalidatePublicSite()
  }
  return doc
}

export const revalidateSiteGlobal: GlobalAfterChangeHook = async ({ doc, req }) => {
  if (shouldRevalidate(req, req.context)) {
    await revalidatePublicSite()
  }
  return doc
}
