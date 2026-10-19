'use client'

import { useState } from 'react'

export function FestiveModeButton({ enabled }: { enabled: boolean }) {
  const [active, setActive] = useState(enabled)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function toggle() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/festive-mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) })
      if (!response.ok) throw new Error('Could not update festive mode. Check your admin access and try again.')
      setActive(!active)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update festive mode.') }
    finally { setBusy(false) }
  }
  return <div><button className="cobraa-copy" type="button" onClick={toggle} disabled={busy}>{busy ? 'Saving…' : active ? 'End festive mode' : 'Start festive mode'}</button><p aria-live="polite">{error || (active ? 'At least one festive offer or announcement is active.' : 'Festive offers and announcements are inactive.')}</p></div>
}
