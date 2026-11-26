import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { notFound } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { guideAdminClient, guidePublicCredentials } from '@/lib/guide-storage'
import type { Guide } from '@/lib/guides'
import { getServerSideURL } from '@/utilities/getURL'
import GuidesManager from './GuidesManager'

export default async function GuidesView(props: AdminViewServerProps) {
  const { req, visibleEntities } = props.initPageResult
  if (req.user?.role !== 'admin') notFound()

  const credentials = guidePublicCredentials()
  let guides: Guide[] = []
  let issue: string | undefined
  if (!credentials || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issue = 'Set the Supabase guide storage environment variables to manage guides.'
  } else {
    const client = guideAdminClient()
    for (let from = 0; ; from += 500) {
      const { data, error } = await client
        .from('guides')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, from + 499)
      if (error) {
        console.error('Could not list guides', error)
        issue = 'Could not load guides. Refresh to try again.'
        break
      }
      guides = guides.concat(data)
      if (data.length < 500) break
    }
  }

  return (
    <DefaultTemplate {...props} req={req} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Assembly guides</h1>
        {issue ? (
          <p role="alert">{issue}</p>
        ) : (
          credentials && (
            <GuidesManager guides={guides} credentials={credentials} siteURL={getServerSideURL()} />
          )
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
