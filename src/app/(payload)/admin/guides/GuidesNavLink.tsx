import Link from 'next/link'
import type { ServerProps } from 'payload'

export default function GuidesNavLink({ user }: Pick<ServerProps, 'user'>) {
  if (user?.role !== 'admin') return null
  return (
    <Link className="nav__link" href="/admin/guides">
      Guides
    </Link>
  )
}
