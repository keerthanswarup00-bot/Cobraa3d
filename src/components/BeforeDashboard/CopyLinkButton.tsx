'use client'

import React, { useState } from 'react'

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  return <button type="button" className="cobraa-copy" onClick={async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setError(false)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      setError(true)
    }
  }} aria-live="polite">{copied ? 'Link copied' : error ? 'Copy unavailable' : 'Copy site link'}</button>
}
