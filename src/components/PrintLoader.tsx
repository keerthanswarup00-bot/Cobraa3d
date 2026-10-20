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

// Scene geometry: the supplied wordmark is 2149 × 732, centred in the scene.
const VIEW_W = 520
const VIEW_H = 320
const LOGO_WIDTH = 380
const LOGO_HEIGHT = (LOGO_WIDTH * 732) / 2149
const LOGO_X = (VIEW_W - LOGO_WIDTH) / 2
const LOGO_TOP = 60
const LOGO_BOTTOM = LOGO_TOP + LOGO_HEIGHT
const CENTER_X = VIEW_W / 2
const ORBIT_RX = 205
const ORBIT_RY = 14
const EXTRUDE = 4 // visible wall thickness under the wordmark
const HOT = 9 // freshly printed layers glow in the accent colour

const LAYERS = 84
const MIN_MS = 2200
const MAX_WAIT_MS = 2500
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
          <mask id="pl-logo-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
            <image href="/cobraa-studio-logo.png" x={LOGO_X} y={LOGO_TOP} width={LOGO_WIDTH} height={LOGO_HEIGHT} style={{ filter: 'brightness(0) invert(1)' }} />
          </mask>
          <clipPath id="pl-ink"><rect ref={inkRect} x="0" y={VIEW_H} width={VIEW_W} height="0" /></clipPath>
          <clipPath id="pl-hot"><rect ref={hotRect} x="0" y={VIEW_H} width={VIEW_W} height="0" /></clipPath>
          <clipPath id="pl-wall"><rect ref={wallRect} x="0" y={VIEW_H} width={VIEW_W} height="0" /></clipPath>
        </defs>

        <ellipse className="pl-plate" cx={CENTER_X} cy={LOGO_BOTTOM + 14} rx="236" ry="30" />
        <ellipse className="pl-plate-inner" cx={CENTER_X} cy={LOGO_BOTTOM + 14} rx="208" ry="24" />

        <g ref={nozzleBack}><Nozzle /></g>

        <g clipPath="url(#pl-wall)">
          <image href="/cobraa-studio-logo.png" x={LOGO_X} y={LOGO_TOP + EXTRUDE} width={LOGO_WIDTH} height={LOGO_HEIGHT} className="pl-wall" />
        </g>

        <g clipPath="url(#pl-ink)">
          <image href="/cobraa-studio-logo.png" x={LOGO_X} y={LOGO_TOP} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
          <g mask="url(#pl-logo-mask)">{lines.map((y) => <line key={y} x1={LOGO_X} x2={LOGO_X + LOGO_WIDTH} y1={LOGO_TOP + y} y2={LOGO_TOP + y} className="pl-layer-line" />)}</g>
        </g>

        <g clipPath="url(#pl-hot)">
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} className="pl-hot" mask="url(#pl-logo-mask)" />
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
