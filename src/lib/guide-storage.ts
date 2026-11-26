import 'server-only'

import { createClient } from '@supabase/supabase-js'

type Credentials = { url: string; key: string }

export function guidePublicCredentials(): Credentials | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key ? { url, key } : null
}

export function guideClient({ url, key }: Credentials) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}

export function guideAdminClient() {
  const credentials = guidePublicCredentials()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!credentials || !key) throw new Error('Guide storage is not configured.')
  return guideClient({ url: credentials.url, key })
}
