'use client'

import { useFormFields } from '@payloadcms/ui'

export function AnnouncementPreview() {
  const message = useFormFields(([fields]) => fields.message?.value)
  const type = useFormFields(([fields]) => fields.type?.value)
  const active = useFormFields(([fields]) => fields.active?.value === true)
  const text = typeof message === 'string' && message.trim() ? message : 'Your announcement preview will appear here.'
  return <div style={{ marginBlock: 16 }}>
    <p>Nothing promotional appears publicly unless it is active and inside its date window.</p>
    <div role="status" style={{ padding: 12, border: '1px solid #e7e5e0', background: type === 'festive' ? '#f6f5f1' : '#fff' }}>
      <strong>{active ? 'Preview · active' : 'Preview · inactive'}</strong><div>{text}</div>
    </div>
  </div>
}
