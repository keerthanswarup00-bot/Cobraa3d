'use client'

import { useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

export function OfferStatusSummary() {
  const active = useFormFields(([fields]) => fields.active?.value === true)
  const startsAt = useFormFields(([fields]) => fields.startsAt?.value)
  const endsAt = useFormFields(([fields]) => fields.endsAt?.value)
  const start = typeof startsAt === 'string' ? Date.parse(startsAt) : NaN
  const end = typeof endsAt === 'string' ? Date.parse(endsAt) : NaN
  const [status, setStatus] = useState('Checking dates…')
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = Date.now()
      setStatus(!active ? 'Inactive' : Number.isFinite(start) && start > now ? `Scheduled for ${new Date(start).toLocaleDateString()}` : Number.isFinite(end) && end < now ? 'Expired' : 'Live now')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [active, start, end])
  return <div role="status" style={{ padding: '12px 0', fontWeight: 600 }}>Offer status: {status}</div>
}
