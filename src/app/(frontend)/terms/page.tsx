import type { Metadata } from 'next'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@payload-config'
import { LexicalLegalContent } from '@/components/LexicalLegalContent'
import { copyMetadata } from '@/components/PublicCopyPage'
import copy from '@/content/public-pages/terms.json'
import { getSiteSettings } from '@/utilities/getSiteSettings'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = copyMetadata(copy, '/terms')

const hasText = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false
  const node = value as { text?: string; children?: unknown[]; root?: unknown }
  return Boolean(node.text?.trim() || node.children?.some(hasText) || (node.root && hasText(node.root)))
}

export default async function TermsPage() {
  const payload = await getPayload({ config })
  const [pages, settings] = await Promise.all([payload.findGlobal({ slug: 'legal-pages', depth: 0 }), getSiteSettings(0)])
  if (!hasText(pages.terms)) notFound()
  const phone = settings.phone || settings.whatsappNumber
  return <main className="public-copy-page"><article className="public-copy-article"><LexicalLegalContent value={pages.terms} phone={phone} /></article></main>
}
