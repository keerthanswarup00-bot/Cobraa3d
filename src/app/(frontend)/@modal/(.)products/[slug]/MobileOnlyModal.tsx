'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function MobileOnlyModal({ children, slug }: { children: React.ReactNode; slug: string }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      router.replace(`/products/${slug}`)
      return
    }
    setReady(true)
  }, [isMobile, router, slug])

  if (!isMobile || !ready) return null
  return <>{children}</>
}
