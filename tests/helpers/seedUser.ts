import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'admin-test@localhost.test',
  password: 'cobraa3d-test-password-123',
}
export const sampleProductTitle = 'SAMPLE Walking Skeleton Product'

let savedWhatsAppNumber: string | undefined

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  savedWhatsAppNumber = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })).whatsappNumber || ''
  await payload.updateGlobal({ slug: 'site-settings', data: { whatsappNumber: '919999999999' }, overrideAccess: true, context: { disableRevalidate: true } })

  // Delete existing test user if any
  await payload.delete({
    collection: 'products',
    where: { title: { equals: sampleProductTitle } },
    context: { disableRevalidate: true },
  })
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
    context: { disableRevalidate: true },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: { ...testUser, role: 'admin' },
    context: { disableRevalidate: true },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'products',
    where: { title: { equals: sampleProductTitle } },
    context: { disableRevalidate: true },
  })
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
    context: { disableRevalidate: true },
  })
  if (savedWhatsAppNumber !== undefined) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { whatsappNumber: savedWhatsAppNumber },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
}
