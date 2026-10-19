'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const EnquiryForm = dynamic(() => import('./CustomEnquiryForm').then((module) => module.CustomEnquiryForm), { ssr: false, loading: () => <div className="form-placeholder" aria-live="polite">Enquiry form ready to load.</div> })

export function LazyEnquiryForm({ whatsappNumber, source, note, messageTemplate }: { whatsappNumber?: string | null; source: string; note?: string; messageTemplate?: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } }, { rootMargin: '240px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref}>{visible ? <EnquiryForm whatsappNumber={whatsappNumber} source={source} note={note} messageTemplate={messageTemplate} /> : <div className="form-placeholder">Tell us what you have in mind. The enquiry form loads when you reach it.</div>}</div>
}
