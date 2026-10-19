'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

type Props = {
  fonts: { font: string }[]
  colours: { name: string; hex: string }[]
  maxCharacters: number
  startingFromNote?: string | null
  whatsappNumber?: string | null
  calmMode?: boolean
}

const Studio = dynamic(() => import('./NameplateStudio').then((module) => module.NameplateStudio), { ssr: false, loading: () => <div className="form-placeholder">Loading the nameplate preview…</div> })

export function LazyNameplateStudio(props: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } }, { rootMargin: '200px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref}>{visible ? <Studio {...props} /> : <div className="form-placeholder">Try a nameplate preview. No price is generated.</div>}</div>
}
