import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

async function createFirstAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim()
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim()
  if (!email || !password) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to provision the first administrator.')
  }
  if (password.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters long.')

  const payload = await getPayload({ config })
  try {
    const existing = await payload.find({ collection: 'users', limit: 1, depth: 0, overrideAccess: true })
    if (existing.totalDocs > 0) throw new Error('Administrator bootstrap is only available before any user accounts exist.')
    await payload.create({
      collection: 'users',
      data: { email, password, ...(name ? { name } : {}), role: 'admin' },
      overrideAccess: true,
    })
    payload.logger.info(`Created the initial administrator account for ${email}.`)
  } finally {
    await payload.destroy()
  }
}

createFirstAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unable to create the initial administrator.')
  process.exitCode = 1
})
