'use client'

import { useEffect, useRef, useState } from 'react'

/*
 * Site loading screen: a print head circles the Cobraa mark and lays it down
 * one layer at a time, bottom to top. The orbit is the layer ring, so the mark
 * reads as a solid object growing on a build plate.
 *
 * Progress is real: it eases up to 90% and only completes once the window has
 * finished loading (or after a safety timeout). Shown once per browser session.
 */

const LOGO_A =
  'M60.2569 118.758L18.9035 94.9917C18.4016 94.6917 18.067 94.1583 18.067 93.5583V56.825C18.067 56.1917 18.7696 55.7917 19.3049 56.0917L67.3164 83.6917C67.9855 84.0917 68.822 83.5917 68.822 82.825V64.925C68.822 64.225 68.4539 63.5583 67.8182 63.1917L10.0707 29.9917C9.56883 29.6917 8.89968 29.6917 8.39782 29.9917L0.836436 34.3583C0.334574 34.6583 0 35.1917 0 35.7917V104.025C0 104.625 0.334574 105.158 0.836436 105.458L60.1565 139.592C60.6583 139.892 61.3275 139.892 61.8293 139.592L111.647 110.925C112.317 110.525 112.317 109.592 111.647 109.192L96.1232 100.258C95.4875 99.8917 94.7515 99.8917 94.1158 100.258L61.9632 118.758C61.4613 119.058 60.7922 119.058 60.2903 118.758H60.2569Z'
const LOGO_B =
  'M121.149 34.325L61.8294 0.225C61.3275 -0.075 60.6584 -0.075 60.1565 0.225L28.8069 18.2583C28.1378 18.6583 28.1378 19.5917 28.8069 19.9917L44.1973 28.8583C44.833 29.225 45.5691 29.225 46.2048 28.8583L60.2569 20.7917C60.7588 20.4917 61.4279 20.4917 61.9298 20.7917L103.283 44.5583C103.785 44.8583 104.12 45.3917 104.12 45.9917V82.8917C104.12 83.5917 104.488 84.2583 105.123 84.625L120.514 93.4583C121.183 93.8583 122.019 93.3583 122.019 92.5917V35.7917C122.019 35.1917 121.685 34.6583 121.183 34.3583L121.149 34.325Z'

// Scene geometry (viewBox 0 0 360 320). The mark is 122 x 140, centred on x = 180.
const VIEW_W = 360
const VIEW_H = 320
const LOGO_X = 119
const LOGO_TOP = 70
const LOGO_HEIGHT = 140
const LOGO_BOTTOM = LOGO_TOP + LOGO_HEIGHT
const CENTER_X = 180
const ORBIT_RX = 72
const ORBIT_RY = 15
const EXTRUDE = 5 // visible wall thickness under the mark
const HOT = 9 // freshly printed layers glow in the accent colour

const LAYERS = 84
const MIN_MS = 2600
const MAX_WAIT_MS = 7000
const ORBITS_PER_SECOND = 1.15
const SESSION_KEY = 'cobraa-loader'

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

function Nozzle() {
  return (
    <g className="pl-nozzle">
      <line x1="0" y1="-34" x2="0" y2="-120" className="pl-filament" />
      <rect x="-6" y="-34" width="12" height="12" rx="2" className="pl-nozzle-body" />
      <rect x="-9.5" y="-23" width="19" height="14" rx="2.5" className="pl-nozzle-body" />
      <path d="M-5 -9 L5 -9 L2 0 L-2 0 Z" className="pl-nozzle-tip" />
    </g>
  )
}

export function PrintLoader({ brandName }: { brandName: string }) {
  const [done, setDone] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const inkRect = useRef<SVGRectElement>(null)
  const hotRect = useRef<SVGRectElement>(null)
  const wallRect = useRef<SVGRectElement>(null)
  const ring = useRef<SVGEllipseElement>(null)
  const nozzleBack = useRef<SVGGElement>(null)
  const nozzleFront = useRef<SVGGElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.loader === 'skip') {
      const frame = requestAnimationFrame(() => setDone(true))
      return () => cancelAnimationFrame(frame)
    }

    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'

    let loaded = document.readyState === 'complete'
    const onLoad = () => { loaded = true }
    window.addEventListener('load', onLoad)

    const start = performance.now()
    let last = start
    let shown = 0
    let finishAt = 0
    let frame = 0
    const timers: number[] = []

    const draw = (progress: number, elapsed: number, cool: number) => {
      const layer = Math.min(LAYERS, Math.floor(progress * LAYERS))
      const top = LOGO_BOTTOM - (layer * LOGO_HEIGHT) / LAYERS
      const hot = HOT * (1 - cool)
      const set = (el: SVGRectElement | null, y: number, height: number) => {
        if (!el) return
        el.setAttribute('y', String(y))
        el.setAttribute('height', String(Math.max(0, height)))
      }
      set(inkRect.current, top + hot, VIEW_H)
      set(hotRect.current, top, hot)
      set(wallRect.current, top + EXTRUDE, VIEW_H)
      ring.current?.setAttribute('cy', String(top))
      ring.current?.style.setProperty('opacity', layer === 0 ? '0' : '')

      const angle = (elapsed / 1000) * Math.PI * 2 * ORBITS_PER_SECOND
      const depth = Math.sin(angle)
      const x = CENTER_X + ORBIT_RX * Math.cos(angle)
      const y = top + ORBIT_RY * depth
      const place = (el: SVGGElement | null, visible: boolean) => {
        if (!el) return
        el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(1 + 0.1 * depth).toFixed(3)})`)
        el.style.visibility = visible ? 'visible' : 'hidden'
      }
      place(nozzleFront.current, depth >= 0)
      place(nozzleBack.current, depth < 0)

      if (label.current) label.current.textContent = `LAYER ${String(layer).padStart(2, '0')} / ${LAYERS}`
      if (bar.current) bar.current.style.transform = `scaleX(${progress.toFixed(4)})`
    }

    const release = () => {
      window.removeEventListener('load', onLoad)
      root.style.overflow = previousOverflow
    }

    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const elapsed = now - start

      if (!finishAt) {
        const ready = loaded || elapsed > MAX_WAIT_MS
        const target = Math.min(ready ? 1 : 0.9, easeInOut(Math.min(1, elapsed / MIN_MS)))
        shown = Math.max(shown, shown + (target - shown) * Math.min(1, dt * 9))
        if (shown > 0.995 && ready) {
          shown = 1
          finishAt = now
          timers.push(window.setTimeout(() => setLeaving(true), 450))
          timers.push(window.setTimeout(() => {
            try { sessionStorage.setItem(SESSION_KEY, 'done') } catch { /* private mode */ }
            release()
            setDone(true)
          }, 1050))
        }
      }

      const cool = finishAt ? Math.min(1, (now - finishAt) / 380) : 0
      draw(shown, elapsed, cool)
      frame = requestAnimationFrame(step)
    }

    draw(0, 0, 0)
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
      release()
    }
  }, [])

  if (done) return null

  const lines = Array.from({ length: Math.ceil(LOGO_HEIGHT / 2.8) }, (_, i) => i * 2.8)

  return (
    <div className={`print-loader${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite" aria-label={`${brandName} is loading`}>
      <svg className="print-loader-art" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
        <defs>
          <path id="pl-a" d={LOGO_A} />
          <path id="pl-b" d={LOGO_B} />
          <clipPath id="pl-shape"><use href="#pl-a" /><use href="#pl-b" /></clipPath>
          <clipPath id="pl-ink"><rect ref={inkRect} x="0" y={VIEW_H} width={VIEW_W} height="0" /></clipPath>
          <clipPath id="pl-hot"><rect ref={hotRect} x="0" y={VIEW_H} width={VIEW_W} height="0" /></clipPath>
          <clipPath id="pl-wall"><rect ref={wallRect} x="0" y={VIEW_H} width={VIEW_W} height="0" /></clipPath>
        </defs>

        <ellipse className="pl-plate" cx={CENTER_X} cy={LOGO_BOTTOM + 16} rx="132" ry="30" />
        <ellipse className="pl-plate-inner" cx={CENTER_X} cy={LOGO_BOTTOM + 16} rx="112" ry="24" />

        <g ref={nozzleBack}><Nozzle /></g>

        <g clipPath="url(#pl-wall)">
          <g transform={`translate(${LOGO_X} ${LOGO_TOP + EXTRUDE})`}>
            <use href="#pl-a" className="pl-wall" />
            <use href="#pl-b" className="pl-wall" />
          </g>
        </g>

        <g clipPath="url(#pl-ink)">
          <g transform={`translate(${LOGO_X} ${LOGO_TOP})`}>
            <use href="#pl-a" className="pl-ink" />
            <use href="#pl-b" className="pl-ink" />
            <g clipPath="url(#pl-shape)">
              {lines.map((y) => <line key={y} x1="-2" x2="126" y1={y} y2={y} className="pl-layer-line" />)}
            </g>
          </g>
        </g>

        <g clipPath="url(#pl-hot)">
          <g transform={`translate(${LOGO_X} ${LOGO_TOP})`}>
            <use href="#pl-a" className="pl-hot" />
            <use href="#pl-b" className="pl-hot" />
          </g>
        </g>

        <ellipse ref={ring} className="pl-ring" cx={CENTER_X} cy={LOGO_BOTTOM} rx={ORBIT_RX} ry={ORBIT_RY} />

        <g ref={nozzleFront}><Nozzle /></g>
      </svg>

      <div className="print-loader-meta">
        <span className="print-loader-brand">{brandName}</span>
        <span className="print-loader-track"><span ref={bar} /></span>
        <span ref={label} className="print-loader-layer">LAYER 00 / {LAYERS}</span>
      </div>
    </div>
  )
}
