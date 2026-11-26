import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { guideClient, guidePublicCredentials } from '@/lib/guide-storage'
import { GUIDE_BUCKET, type Guide } from '@/lib/guides'
import { buildGeneralMessage, buildWhatsAppUrl } from '@/lib/shared'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import PdfViewerLoader from './PdfViewerLoader'

type Props = { params: Promise<{ slug: string }> }

const getGuide = cache(async (slug: string) => {
  const credentials = guidePublicCredentials()
  if (!credentials || !/^[a-z0-9-]{1,57}$/.test(slug)) return null
  const client = guideClient(credentials)
  const { data, error } = await client
    .from('guides')
    .select('title,file_path')
    .eq('slug', slug)
    .maybeSingle<Pick<Guide, 'title' | 'file_path'>>()
  if (error) throw error
  if (!data) return null

  const bucket = client.storage.from(GUIDE_BUCKET)
  return {
    title: data.title,
    url: bucket.getPublicUrl(data.file_path).data.publicUrl,
    downloadURL: bucket.getPublicUrl(data.file_path, { download: `${slug}.pdf` }).data.publicUrl,
  }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await getGuide((await params).slug)
  return {
    title: guide ? `${guide.title} | Cobraa 3D Guide` : 'Guide unavailable | Cobraa 3D',
    robots: { index: false, follow: false },
  }
}

export default async function GuidePage({ params }: Props) {
  const guide = await getGuide((await params).slug)
  if (!guide) notFound()
  const settings = await getSiteSettings(0)
  const whatsappURL = buildWhatsAppUrl({
    number: settings.whatsappNumber,
    message: buildGeneralMessage(settings.brandName),
  })
  return <PdfViewerLoader key={guide.url} {...guide} whatsappURL={whatsappURL} />
}
