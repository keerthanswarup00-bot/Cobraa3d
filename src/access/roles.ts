import type { Access } from 'payload'
import type { User } from '@/payload-types'

type RoleUser = User & { role?: 'admin' | 'editor' }

export const isAdmin: Access = ({ req }) => (req.user as RoleUser | null)?.role === 'admin'
export const adminOnly = isAdmin
export const editorAccess: Access = ({ req }) => {
  const role = (req.user as RoleUser | null)?.role
  return role === 'admin' || role === 'editor'
}

