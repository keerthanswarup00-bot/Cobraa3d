'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
      <p style={{ marginBottom: 24 }}>We couldn&apos;t load this page. Please try again.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => reset()} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #ccc' }}>Try again</button>
        <a href="https://wa.me/" rel="noopener noreferrer" target="_blank" style={{ padding: '10px 16px', borderRadius: 6, background: '#25D366', color: '#fff', textDecoration: 'none' }}>Chat on WhatsApp</a>
      </div>
    </main>
  )
}
