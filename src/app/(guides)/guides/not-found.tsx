import Link from 'next/link'

export default function GuideNotFound() {
  return (
    <main className="guide-message">
      <p>404</p>
      <h1>Guide unavailable</h1>
      <p>Check the link or ask the sender for an updated one.</p>
      <Link href="/">Back to Cobraa 3D</Link>
    </main>
  )
}
