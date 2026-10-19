'use client'

import React, { useState } from 'react'

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return <button type="button" className="cobraa-copy" onClick={async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }}>{copied ? 'Copied' : 'Copy site link'}</button>
}
