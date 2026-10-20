import { getPayload } from 'payload'
import config from '@payload-config'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    if (env.CRON_SECRET) {
      const auth = req.headers.get('authorization')
      if (auth !== `Bearer ${env.CRON_SECRET}`) {
        return Response.json({ ok: false }, { status: 401 })
      }
    }
    const payload = await getPayload({ config })
    await payload.find({ collection: 'products', limit: 1, depth: 0 })
    return Response.json({ ok: true }, { status: 200 })
  } catch {
    return Response.json({ ok: false }, { status: 503 })
  }
}
