'use client'

import { useEffect, useRef, useState } from 'react'

const LEVELS = Array.from({ length: 36 }, (_, index) => -3.4 + index * 0.25)
const SEGMENTS = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[0, 1], [3, 2]], [[0, 2]], [[0, 3]], [[0, 3]], [[0, 2]], [[0, 3], [2, 1]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []]

export function ConnectTerrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(hover: none)').matches
    const field = { x: -10000, y: -10000, targetX: -10000, targetY: -10000, strength: 0, targetStrength: 0 }
    let width = 0
    let height = 0
    let dpr = 1
    let cell = 20
    let columns = 0
    let rows = 0
    let values = new Float32Array()
    let frame = 0
    let lastFrame = 0
    let lastWidth = 0
    let lastHeight = 0
    let visible = true
    let running = false
    const startedAt = performance.now()

    const resize = (force = false) => {
      const nextWidth = window.innerWidth
      const nextHeight = window.innerHeight
      if (!force && nextWidth === lastWidth && Math.abs(nextHeight - lastHeight) < 120) return
      lastWidth = nextWidth
      lastHeight = nextHeight
      width = nextWidth
      height = nextHeight
      dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2)
      cell = coarse ? 26 : 20
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      columns = Math.ceil(width / cell) + 2
      rows = Math.ceil(height / cell) + 2
      values = new Float32Array(columns * rows)
      if (reduced) draw(performance.now())
    }

    const edgePoint = (edge: number, x: number, y: number, a: number, b: number, c: number, d: number, level: number) => {
      if (edge === 0) return [x + cell * (level - a) / (b - a), y]
      if (edge === 1) return [x + cell, y + cell * (level - b) / (c - b)]
      if (edge === 2) return [x + cell * (level - d) / (c - d), y + cell]
      return [x, y + cell * (level - a) / (d - a)]
    }

    const draw = (time: number) => {
      if (!context) return
      const elapsed = (time - startedAt) / 1000
      const scrollOffset = window.scrollY * 0.35
      const radiusSquared = 2 * 170 * 170
      for (let row = 0; row < rows; row += 1) {
        const gridY = row * cell
        for (let column = 0; column < columns; column += 1) {
          const x = column * cell
          const y = gridY + scrollOffset
          let value = Math.sin(x * 0.0023 + elapsed * 0.11 + Math.sin(y * 0.0017 + elapsed * 0.06) * 1.7) * 1.25
            + Math.sin(y * 0.0029 - elapsed * 0.08 + Math.sin(x * 0.0013 - elapsed * 0.05) * 1.9) * 1.1
            + Math.sin((x * 0.7 + y) * 0.0016 + elapsed * 0.04) * 0.8
          const dx = x - field.x
          const dy = gridY - field.y
          value += field.strength * 2.4 * Math.exp(-(dx * dx + dy * dy) / radiusSquared)
          values[row * columns + column] = value
        }
      }

      context.clearRect(0, 0, width, height)
      for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex += 1) {
        const level = LEVELS[levelIndex]!
        context.beginPath()
        for (let row = 0; row < rows - 1; row += 1) {
          for (let column = 0; column < columns - 1; column += 1) {
            const a = values[row * columns + column]!
            const b = values[row * columns + column + 1]!
            const c = values[(row + 1) * columns + column + 1]!
            const d = values[(row + 1) * columns + column]!
            const code = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0)
            for (const [start, end] of SEGMENTS[code]!) {
              const [startX, startY] = edgePoint(start!, column * cell, row * cell, a, b, c, d, level)
              const [endX, endY] = edgePoint(end!, column * cell, row * cell, a, b, c, d, level)
              context.moveTo(startX!, startY!)
              context.lineTo(endX!, endY!)
            }
          }
        }
        const major = levelIndex % 4 === 0
        context.strokeStyle = major ? 'rgba(233,226,208,.34)' : 'rgba(255,255,255,.15)'
        context.lineWidth = major ? 1.4 : 1.05
        context.stroke()
      }
    }

    const run = (time: number) => {
      frame = 0
      if (!running || !visible || document.hidden) return
      const frameInterval = coarse ? 1000 / 24 : 1000 / 30
      if (time - lastFrame >= frameInterval) {
        lastFrame = time
        if (coarse && field.targetStrength === 0) {
          field.targetX = width * (0.5 + Math.sin(time * 0.00017) * 0.24)
          field.targetY = height * (0.48 + Math.cos(time * 0.00013) * 0.22)
          field.targetStrength = 0.22
        }
        field.x += (field.targetX - field.x) * 0.12
        field.y += (field.targetY - field.y) * 0.12
        field.strength += (field.targetStrength - field.strength) * 0.08
        draw(time)
      }
      frame = requestAnimationFrame(run)
    }

    const start = () => {
      if (running || reduced || !visible || document.hidden) return
      running = true
      frame = requestAnimationFrame(run)
    }
    const stop = () => {
      running = false
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }
    const onPointerMove = (event: PointerEvent) => {
      field.targetX = event.clientX
      field.targetY = event.clientY
      field.targetStrength = event.pointerType === 'touch' ? 1 : 0.7
      if (reduced) draw(performance.now())
    }
    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType === 'touch') field.targetStrength = 0
    }
    const onScroll = () => { if (reduced) draw(performance.now()) }
    const onResize = () => resize()
    const onVisibility = () => document.hidden ? stop() : start()
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      if (visible) start()
      else stop()
    })

    resize(true)
    observer.observe(canvas)
    if (reduced) draw(performance.now())
    else start()
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerEnd, { passive: true })
    window.addEventListener('pointercancel', onPointerEnd, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="studio-terrain" aria-hidden="true" />
}

export function ConnectHud() {
  const [progress, setProgress] = useState(0)
  const layer = Math.round(progress * 400)
  useEffect(() => {
    let frame = 0
    const update = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        setProgress(Math.max(0, Math.min(1, window.scrollY / max)))
        frame = 0
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    update()
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); if (frame) cancelAnimationFrame(frame) }
  }, [])
  return <>
    <div className="studio-hud" aria-hidden="true"><span>Z <b>{(layer * .2).toFixed(1)}</b> mm</span><span>Layer <b>{String(layer).padStart(4, '0')}</b> / 0400</span><i><u style={{ height: `${progress * 100}%` }} /></i></div>
    <div className="studio-hud-progress" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></div>
  </>
}
