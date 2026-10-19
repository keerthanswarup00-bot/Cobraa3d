import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
      <h1 className="max-w-2xl text-5xl font-medium tracking-tight text-neutral-950 sm:text-7xl">{settings.brandName}</h1>
      <Link className="mt-8 inline-flex min-h-11 w-fit items-center rounded border border-neutral-300 px-5 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/products">Browse products</Link>
    </main>
  )
}
