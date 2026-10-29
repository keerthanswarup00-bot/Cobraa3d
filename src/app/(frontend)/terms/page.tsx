import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

const text = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''
  const node = value as { text?: string; children?: unknown[] }
  return [node.text || '', ...(node.children || []).map(text)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export default async function TermsPage() {
  const payload = await getPayload({ config })
  const pages = await payload.findGlobal({ slug: 'legal-pages', depth: 0 })
  const body = text(pages.terms)
  if (!body) notFound()
  return <main className="legal-page"><Link href="/">← Home</Link><h1>Terms</h1><p>{body}</p></main>
}
