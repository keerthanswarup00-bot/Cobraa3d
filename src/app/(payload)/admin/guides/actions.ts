'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { z } from 'zod'
import config from '@payload-config'
import { guideAdminClient } from '@/lib/guide-storage'
import { GUIDE_BUCKET, MAX_GUIDE_BYTES, type Guide } from '@/lib/guides'

const titleSchema = z.string().trim().min(1).max(160)
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}-[a-f0-9]{16}$/)
const pathSchema = z
  .string()
  .regex(/^[a-z0-9-]+\/[a-f0-9]{24}\.pdf$/)
  .max(90)
const uploadSchema = z.object({
  slug: slugSchema,
  path: pathSchema,
  replacement: z.object({ id: z.uuid(), previousPath: pathSchema }).optional(),
})

async function runAction<T>(run: (client: ReturnType<typeof guideAdminClient>) => Promise<T>) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (user?.role !== 'admin') return { error: 'Admin access required.' }
    return { data: await run(guideAdminClient()) }
  } catch (error) {
    console.error('Guide management request failed', error)
    return { error: 'Guide management is unavailable. Please try again.' }
  }
}

function refreshGuide(slug: string) {
  revalidatePath('/admin/guides')
  revalidatePath(`/guides/${slug}`)
}

async function removeFile(client: ReturnType<typeof guideAdminClient>, path: string) {
  const { error } = await client.storage.from(GUIDE_BUCKET).remove([path])
  if (error) {
    console.error('Guide file cleanup failed', path, error)
    return 'The guide was updated, but the previous PDF could not be removed from storage.'
  }
}

export async function createUploadUrl(title: string, id?: string) {
  return runAction(async (client) => {
    const parsed = titleSchema.safeParse(title)
    if (!parsed.success) return { issue: 'Enter a title of up to 160 characters.' }
    let replacement: { id: string; previousPath: string } | undefined
    let slug = `${
      parsed.data
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40)
        .replace(/^-|-$/g, '') || 'guide'
    }-${randomBytes(8).toString('hex')}`
    if (id !== undefined) {
      if (!z.uuid().safeParse(id).success) return { issue: 'Invalid guide.' }
      const { data, error } = await client
        .from('guides')
        .select('slug,file_path')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      if (!data) return { issue: 'This guide no longer exists.' }
      slug = data.slug
      replacement = { id, previousPath: data.file_path }
    }
    const path = `${slug}/${randomBytes(12).toString('hex')}.pdf`
    const { data, error } = await client.storage.from(GUIDE_BUCKET).createSignedUploadUrl(path)
    if (error) throw error
    return { upload: { slug, path, replacement }, token: data.token }
  })
}

export async function saveGuide(input: z.infer<typeof uploadSchema> & { title: string }) {
  return runAction(async (client) => {
    const parsed = uploadSchema.extend({ title: titleSchema }).safeParse(input)
    if (!parsed.success) return { issue: 'Invalid guide upload.' }
    const { slug, path, title, replacement } = parsed.data
    if (path.split('/')[0] !== slug || replacement?.previousPath === path) {
      return { issue: 'Invalid guide upload.' }
    }

    const guides = client.from('guides')
    const existing = await guides.select('id,file_path').eq('slug', slug).maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data?.file_path === path) {
      refreshGuide(slug)
      return { slug }
    }

    const { data: file, error: fileError } = await client.storage.from(GUIDE_BUCKET).info(path)
    if (fileError) return { issue: 'The uploaded PDF could not be verified. Try saving again.' }
    if (file.contentType !== 'application/pdf' || !file.size || file.size > MAX_GUIDE_BYTES) {
      return { issue: 'Choose a PDF file of up to 25 MB.' }
    }

    const guide = { title, file_path: path, size_bytes: file.size }
    if (replacement) {
      const { data, error } = await guides
        .update(guide)
        .eq('id', replacement.id)
        .eq('slug', slug)
        .eq('file_path', replacement.previousPath)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data)
        return {
          issue: 'This guide changed while the file was uploading. Start the replacement again.',
        }
      refreshGuide(slug)
      return { slug, warning: await removeFile(client, replacement.previousPath) }
    }

    const { error } = await guides.insert({ ...guide, slug })
    if (error) throw error
    refreshGuide(slug)
    return { slug }
  })
}

export async function deleteGuide(guide: Pick<Guide, 'id' | 'file_path'>) {
  return runAction(async (client) => {
    const parsed = z.object({ id: z.uuid(), file_path: pathSchema }).safeParse(guide)
    if (!parsed.success) return { issue: 'Invalid guide.' }
    const { data, error } = await client
      .from('guides')
      .delete()
      .eq('id', parsed.data.id)
      .eq('file_path', parsed.data.file_path)
      .select('slug,file_path')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      revalidatePath('/admin/guides')
      return { issue: 'This guide changed or was already deleted. Check the updated list.' }
    }
    refreshGuide(data.slug)
    return { warning: await removeFile(client, data.file_path) }
  })
}
