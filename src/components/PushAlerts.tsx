'use client'

import { useEffect, useState } from 'react'
import { getExistingPushSubscription, subscribeToPush, unsubscribeFromPush } from '@/lib/pushClient'
import './push-alerts.css'

const DENIED_KEY = 'cobraa-push-denied'

function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInstalledApp() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function PushAlerts({ publicKey, presentation = 'button', source = 'storefront' }: {
  publicKey?: string
  presentation?: 'button' | 'link'
  source?: string
}) {
  const [open, setOpen] = useState(false)
  const [supported, setSupported] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [denied, setDenied] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!publicKey) return
    const timer = window.setTimeout(() => {
      const canPush = window.isSecureContext && 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator
      const iosNeedsInstall = isIOSDevice() && !isInstalledApp()
      setSupported(canPush && !iosNeedsInstall)
      setInstructions(iosNeedsInstall
        ? 'On iPhone, tap Share, then Add to Home Screen, and open the app to turn on alerts'
        : canPush ? '' : 'Offer alerts are not supported by this browser.')
      try {
        setDenied(localStorage.getItem(DENIED_KEY) === '1' || (canPush && Notification.permission === 'denied'))
      } catch {
        setDenied(canPush && Notification.permission === 'denied')
      }
      if (canPush && !iosNeedsInstall && Notification.permission === 'granted') {
        void getExistingPushSubscription().then(setSubscription).catch((error: unknown) => {
          setMessage(error instanceof Error ? error.message : 'Could not check this browser’s push subscription.')
        })
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [publicKey])

  if (!publicKey) return null
  const triggerLabel = subscription ? 'Alerts on · Turn off' : presentation === 'link' ? 'Offer alerts' : 'Get offer alerts'

  const onTrigger = async () => {
    setMessage('')
    if (subscription) {
      setBusy(true)
      try {
        await unsubscribeFromPush(subscription)
        setSubscription(null)
        setMessage('Offer alerts turned off.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not turn off offer alerts.')
      } finally {
        setBusy(false)
      }
      return
    }
    setOpen(true)
  }

  const onEnable = async () => {
    if (!supported || denied) return
    setBusy(true)
    setMessage('')
    try {
      const nextSubscription = await subscribeToPush({ publicKey, source })
      setSubscription(nextSubscription)
      setOpen(false)
      try { localStorage.removeItem(DENIED_KEY) } catch { /* Permission is still controlled by the browser. */ }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Could not enable offer alerts.'
      if (detail === 'denied') {
        try { localStorage.setItem(DENIED_KEY, '1') } catch { /* Browser permission remains authoritative. */ }
        setDenied(true)
        setMessage('Notifications are blocked in your browser settings. Change the permission there if you want alerts.')
      } else {
        setMessage(detail)
      }
    } finally {
      setBusy(false)
    }
  }

  return <>
    <button type="button" className={presentation === 'link' ? 'push-alert-link' : 'push-alert-button'} onClick={() => { void onTrigger() }} disabled={busy}>
      {busy ? 'Updating alerts…' : triggerLabel}
    </button>
    {message && !open && <span className="push-alert-status" role="status">{message}</span>}
    {open && <div className="push-alert-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="push-alert-sheet" role="dialog" aria-modal="true" aria-labelledby="push-alert-heading">
        <button type="button" className="push-alert-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <p className="push-alert-eyebrow">OFFER ALERTS</p>
        <h2 id="push-alert-heading">Hear when there’s an offer.</h2>
        <p>We’ll use your browser’s push address to send occasional offer updates. No name or phone number is stored. You can turn alerts off here or in your browser settings.</p>
        {instructions && <p className="push-alert-instructions" role="status">{instructions}</p>}
        {denied && <p className="push-alert-instructions" role="status">Notifications are blocked in your browser settings. Change the permission there if you want alerts.</p>}
        {message && <p className="push-alert-status" role="status">{message}</p>}
        <div className="push-alert-actions">
          <button type="button" className="push-alert-button" onClick={() => { void onEnable() }} disabled={!supported || denied || busy}>
            {busy ? 'Enabling…' : 'Continue and allow alerts'}
          </button>
          <button type="button" className="push-alert-cancel" onClick={() => setOpen(false)}>Not now</button>
        </div>
      </section>
    </div>}
  </>
}
