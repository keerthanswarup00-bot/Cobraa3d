import type { Access, Where } from 'payload'

/** Public API access is limited to content that is active now. Authenticated
 * editors retain access to scheduled and expired records in Payload admin. */
export const publicActiveWindow: Access = ({ req }) => {
  if (req.user) return true

  const now = new Date().toISOString()
  return {
    and: [
      { active: { equals: true } },
      { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] },
      { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than_equal: now } }] },
    ],
  } as Where
}
