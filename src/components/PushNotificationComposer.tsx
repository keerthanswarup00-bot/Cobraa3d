'use client'

import { useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { sendPushBatches, subscribeToPush } from '@/lib/pushClient'
import './push-notification-composer.css'

type Status = {
  subscriberCount: number
  testSubscriberCount: number
  sendsRemaining: number
  configured: boolean
  publicKey: string | null
}

async function getStatus(): Promise<Status> {
  const response = await fetch('/api/push/status', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const result = await response.json() as Status & { error?: string }
  if (!response.ok) throw new Error(result.error || `Could not load push status (${response.status}).`)
  return result
}

export function PushNotificationComposer() {
  const documentInfo = useDocumentInfo()
  const title = useFormFields(([fields]) => fields.title?.value)
  const body = useFormFields(([fields]) => fields.body?.value)
  const url = useFormFields(([fields]) => fields.url?.value)
  const status = useFormFields(([fields]) => fields.status?.value)
  const id = documentInfo.data?.id
  const [pushStatus, setPushStatus] = useState<Status | null>(null)
  const [testEnabled, setTestEnabled] = useState(false)
  const [allDone, setAllDone] = useState(status === 'sent')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void getStatus().then((next) => {
      if (!cancelled) setPushStatus(next)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load push status.')
    })
    return () => { cancelled = true }
  }, [])

  const enableTest = async () => {
    if (!pushStatus?.publicKey) return
    setError('')
    setBusy(true)
    try {
      await subscribeToPush({ publicKey: pushStatus.publicKey, source: 'admin', isTest: true })
      setTestEnabled(true)
      setPushStatus(await getStatus())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not enable test alerts.')
    } finally {
      setBusy(false)
    }
  }

  const send = async (mode: 'test' | 'all') => {
    if (id == null) {
      setError('Save this notification before sending.')
      return
    }
    if (mode === 'test' && !testEnabled) {
      setError('Enable test alerts on this device first.')
      return
    }
    if (mode === 'all' && !window.confirm(`Send to ${pushStatus?.subscriberCount || 0} people?`)) return
    setError('')
    setBusy(true)
    setProgress('Starting…')
    try {
      const result = await sendPushBatches(id, mode, (sent, failed) => setProgress(`Sent ${sent} · Failed ${failed}`))
      setProgress(`Complete · Sent ${result.sent} · Failed ${result.failed}`)
      if (mode === 'all') setAllDone(true)
      setPushStatus(await getStatus())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The push send did not complete.')
    } finally {
      setBusy(false)
    }
  }

  const titleText = typeof title === 'string' ? title : ''
  const bodyText = typeof body === 'string' ? body : ''
  const urlText = typeof url === 'string' ? url : '/'
  const isSent = status === 'sent' || allDone
  const unavailable = pushStatus !== null && !pushStatus.configured
  const loadingStatus = pushStatus === null

  return <section className="push-composer">
    <div className="push-composer-preview">
      <p className="push-composer-eyebrow">PHONE PREVIEW</p>
      <article className="push-notification-preview">
        <div className="push-notification-icon" aria-hidden="true">C</div>
        <div><strong>{titleText || 'Notification title'}</strong><p>{bodyText || 'Your message will appear here.'}</p><small>now · Cobraa 3D</small></div>
      </article>
      <p className="push-composer-destination">Opens: <code>{urlText || '/'}</code></p>
    </div>
    {loadingStatus && !error && <p className="push-composer-meta" role="status">Checking push configuration…</p>}
    {unavailable && <p className="push-composer-notice" role="status">Push is not configured. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT to the server environment.</p>}
    {id != null && !isSent && <p className="push-composer-meta">Save this notification before sending; delivery uses its saved title, message, and URL.</p>}
    {pushStatus && <p className="push-composer-meta">Active subscribers: {pushStatus.subscriberCount} · Today’s remaining sends: {pushStatus.sendsRemaining} of 2</p>}
    {isSent && <p className="push-composer-notice">This notification has been sent and is read-only.</p>}
    <div className="push-composer-actions">
      <button type="button" disabled={busy || loadingStatus || unavailable || isSent} onClick={() => { void enableTest() }}>
        {testEnabled ? 'Test alerts enabled on this device' : 'Enable test alerts on this device'}
      </button>
      <button type="button" disabled={busy || loadingStatus || unavailable || !testEnabled || isSent} onClick={() => { void send('test') }}>Send test to my device</button>
      <button type="button" disabled={busy || loadingStatus || unavailable || isSent || !pushStatus?.subscriberCount || (!pushStatus.sendsRemaining && status !== 'sending')} onClick={() => { void send('all') }}>{status === 'sending' ? 'Resume send to everyone' : 'Send to everyone'}</button>
    </div>
    {busy && <p className="push-composer-progress" role="status">{progress}</p>}
    {!busy && progress && <p className="push-composer-progress" role="status">{progress}</p>}
    {error && <p className="push-composer-error" role="alert">{error}</p>}
  </section>
}
