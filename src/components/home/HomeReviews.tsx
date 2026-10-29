'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, Quote } from 'lucide-react'

const REVIEWS = [
  { name: 'Priya', text: 'Got the painting kit for my daughter and she absolutely loved it. Such a fun activity to do together!' },
  { name: 'Rahul Sharma', text: 'The lamp looks really nice on my desk. The design is unique and the finish is neat.' },
  { name: 'Sneha', text: 'Bought a god idol for our home temple. It looks beautiful and was packed nicely.' },
  { name: 'Arjun', text: 'My son enjoyed colouring all the models. Loved that the kit came with sketch pens too.' },
  { name: 'Divya Nair', text: 'Really liked the 3D-printed design. It’s simple, creative, and makes a lovely gift.' },
  { name: 'Karthik', text: 'Ordered a lamp for my room and it looks great, especially at night. Happy with the purchase!' },
  { name: 'Meera', text: 'The god idol is beautifully designed. A lovely addition to our pooja space.' },
  { name: 'Ananya Rao', text: 'Got the colouring kit as a birthday gift for my niece. She started using it immediately and had so much fun.' },
  { name: 'Vikram', text: 'Very creative products! It’s nice to see something different from the usual gifts available online.' },
  { name: 'Pooja', text: 'The models are fun to paint, and the finished pieces look lovely. Would definitely check out more designs.' },
]

export function HomeReviews() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)

  const move = useCallback((direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    const firstCard = track.querySelector<HTMLElement>('.home-review-card')
    const distance = firstCard ? firstCard.getBoundingClientRect().width + 14 : track.clientWidth * 0.8
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4
    if (direction > 0 && atEnd) {
      track.scrollTo({ left: 0, behavior })
      return
    }
    if (direction < 0 && track.scrollLeft <= 4) {
      track.scrollTo({ left: track.scrollWidth, behavior })
      return
    }
    track.scrollBy({ left: direction * distance, behavior })
  }, [])

  useEffect(() => {
    if (paused || held) return
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let timer: number | undefined
    let idle: number | undefined
    let timeout: number | undefined

    const stop = () => {
      if (timer !== undefined) { window.clearInterval(timer); timer = undefined }
      if (idle !== undefined) { (window as any).cancelIdleCallback?.(idle); idle = undefined }
      if (timeout !== undefined) { window.clearTimeout(timeout); timeout = undefined }
    }
    const start = () => {
      idle = undefined
      timeout = undefined
      if (timer === undefined) timer = window.setInterval(() => move(1), 5200)
    }

    // Only start the autoplay once the carousel is near the viewport and the
    // browser is idle. This keeps it out of the initial load and stops the
    // timer when the section scrolls away.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (timer === undefined && idle === undefined && timeout === undefined) {
          const requestIdle = (window as any).requestIdleCallback as ((callback: () => void, options?: { timeout: number }) => number) | undefined
          if (requestIdle) idle = requestIdle(start, { timeout: 2000 })
          else timeout = window.setTimeout(start, 1200)
        }
      } else {
        stop()
      }
    }, { rootMargin: '200px 0px' })
    observer.observe(section)
    return () => { observer.disconnect(); stop() }
  }, [held, move, paused])

  return <section ref={sectionRef} className="home-section home-reviews" aria-labelledby="reviews-title" onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocusCapture={() => setHeld(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false) }} onTouchStart={() => setHeld(true)} onTouchEnd={() => setHeld(false)}>
    <div className="home-section-inner">
      <header className="home-section-heading home-reviews-heading">
        <div><p className="home-eyebrow">Notes from our customers</p><h2 id="reviews-title">Made with care.<br />Loved at home.</h2></div>
        <div className="home-review-controls" aria-label="Review carousel controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous review"><ArrowLeft size={17} aria-hidden="true" /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next review"><ArrowRight size={17} aria-hidden="true" /></button>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play reviews' : 'Pause reviews'} aria-pressed={paused}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
        </div>
      </header>
      <div className="home-reviews-track" ref={trackRef} aria-label="Customer feedback" aria-roledescription="carousel" tabIndex={0}>
        {REVIEWS.map((review, index) => <article className="home-review-card" key={review.name} aria-label={`Review ${index + 1} of ${REVIEWS.length}`}>
          <Quote size={20} strokeWidth={1.6} aria-hidden="true" />
          <blockquote>{review.text}</blockquote>
          <p>{review.name}</p>
        </article>)}
      </div>
      <p className="home-reviews-hint">Drag or swipe to read more</p>
    </div>
  </section>
}
