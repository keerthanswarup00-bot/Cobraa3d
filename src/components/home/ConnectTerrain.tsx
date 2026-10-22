'use client'

import { useEffect, useRef, useState } from 'react'

const LEVEL_MIN = -3.4
const LEVEL_MAX = 5.35
const FINE_LEVELS = 36
const COARSE_LEVELS = 14
const FINE_CELL = 20
const COARSE_CELL = 34
const FINE_FPS = 30
const COARSE_FPS = 20
const PULSE_MS = 900
const IDLE_MS = 2000
const SEGMENTS = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[0, 1], [3, 2]], [[0, 2]], [[0, 3]], [[0, 3]], [[0, 2]], [[0, 3], [2, 1]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []]

export function ConnectTerrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(hover: none)').matches
    const levelCount = coarse ? COARSE_LEVELS : FINE_LEVELS
    const levels = Array.from({ length: levelCount }, (_, index) => LEVEL_MIN + (LEVEL_MAX - LEVEL_MIN) * (index / (levelCount - 1)))
    const field = { x: -10000, y: -10000, targetX: -10000, targetY: -10000, strength: 0, targetStrength: 0 }
    const pointer = { x: 0, y: 0, type: 'mouse', lastAt: 0, down: false, downX: 0, downY: 0, moved: false }
    const pulse = { x: 0, y: 0, until: 0 }
    let width = 0
    let height = 0
    let dpr = 1
    let cell = FINE_CELL
    let columns = 0
    let rows = 0
    let values = new Float32Array()
    let frame = 0
    let lastFrame = 0
    let lastWidth = 0
    let lastHeight = 0
    let visible = true
    let running = false
    let dragging = false
    let customVisible = false
    let scrollFrame = 0
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
      cell = coarse ? COARSE_CELL : FINE_CELL
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

    /* Edge points are written straight into these, so the path never allocates. */
    let edgeX = 0
    let edgeY = 0
    const setEdgePoint = (edge: number, x: number, y: number, a: number, b: number, c: number, d: number, level: number) => {
      if (edge === 0) { edgeX = x + cell * (level - a) / (b - a); edgeY = y; return }
      if (edge === 1) { edgeX = x + cell; edgeY = y + cell * (level - b) / (c - b); return }
      if (edge === 2) { edgeX = x + cell * (level - d) / (c - d); edgeY = y + cell; return }
      edgeX = x; edgeY = y + cell * (level - a) / (d - a)
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
      for (let levelIndex = 0; levelIndex < levels.length; levelIndex += 1) {
        const level = levels[levelIndex]!
        context.beginPath()
        for (let row = 0; row < rows - 1; row += 1) {
          for (let column = 0; column < columns - 1; column += 1) {
            const a = values[row * columns + column]!
            const b = values[row * columns + column + 1]!
            const c = values[(row + 1) * columns + column + 1]!
            const d = values[(row + 1) * columns + column]!
            const code = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0)
            const segments = SEGMENTS[code]!
            const cellX = column * cell
            const cellY = row * cell
            for (let index = 0; index < segments.length; index += 1) {
              const segment = segments[index]!
              setEdgePoint(segment[0]!, cellX, cellY, a, b, c, d, level)
              context.moveTo(edgeX, edgeY)
              setEdgePoint(segment[1]!, cellX, cellY, a, b, c, d, level)
              context.lineTo(edgeX, edgeY)
            }
          }
        }
        const major = levelIndex % 4 === 0
        context.strokeStyle = major ? 'rgba(233,226,208,.34)' : 'rgba(255,255,255,.15)'
        context.lineWidth = major ? 1.4 : 1.05
        context.stroke()
      }
    }

    /** A tap leaves a ripple that fades on its own; a drag follows the finger. */
    const updateField = (time: number) => {
      const draggingPointer = pointer.type === 'touch' ? pointer.down : time - pointer.lastAt < IDLE_MS
      if (draggingPointer && pointer.lastAt) {
        field.targetX = pointer.x
        field.targetY = pointer.y
        field.targetStrength = pointer.type === 'touch' ? 1 : 0.7
      } else if (pulse.until > time) {
        field.targetX = pulse.x
        field.targetY = pulse.y
        field.targetStrength = ((pulse.until - time) / PULSE_MS) * 0.9
      } else {
        field.targetX = width * (0.5 + Math.sin(time * 0.00017) * 0.24)
        field.targetY = height * (0.48 + Math.cos(time * 0.00013) * 0.22)
        field.targetStrength = 0.22
      }
      field.x += (field.targetX - field.x) * 0.12
      field.y += (field.targetY - field.y) * 0.12
      field.strength += (field.targetStrength - field.strength) * 0.08
    }

    const run = (time: number) => {
      frame = 0
      if (!running) return
      const frameInterval = 1000 / (coarse ? COARSE_FPS : FINE_FPS)
      if (time - lastFrame >= frameInterval) {
        lastFrame = time
        updateField(time)
        draw(time)
      }
      frame = requestAnimationFrame(run)
    }

    const shouldRun = () => visible && !document.hidden && !dragging && !customVisible && !reduced
    const start = () => {
      if (running || !shouldRun()) return
      running = true
      frame = requestAnimationFrame(run)
    }
    const stop = () => {
      running = false
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }
    const sync = () => { if (shouldRun()) start(); else stop() }

    const onPointerDown = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.type = event.pointerType
      pointer.lastAt = performance.now()
      pointer.down = event.pointerType === 'touch'
      pointer.downX = event.clientX
      pointer.downY = event.clientY
      pointer.moved = false
      if (pointer.down) {
        pulse.x = event.clientX
        pulse.y = event.clientY
        pulse.until = performance.now() + PULSE_MS
      }
    }
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && !pointer.down) return
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.type = event.pointerType
      pointer.lastAt = performance.now()
      if (Math.abs(event.clientX - pointer.downX) + Math.abs(event.clientY - pointer.downY) > 8) pointer.moved = true
      if (reduced) draw(performance.now())
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      pointer.down = false
      if (!pointer.moved) {
        pulse.x = event.clientX
        pulse.y = event.clientY
        pulse.until = performance.now() + PULSE_MS
      }
    }
    const onPointerCancel = () => { pointer.down = false }

    /* The terrain steps aside while a 3D surface is being dragged. */
    const onDragStart = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target?.closest?.('[data-drag-surface]')) return
      dragging = true
      sync()
      const release = () => {
        dragging = false
        sync()
        window.removeEventListener('pointerup', release)
        window.removeEventListener('pointercancel', release)
      }
      window.addEventListener('pointerup', release)
      window.addEventListener('pointercancel', release)
    }

    /* And while the custom section owns most of the screen. */
    const customSection = document.getElementById('custom')
    const updateCustom = () => {
      if (!customSection) return
      const rect = customSection.getBoundingClientRect()
      const shown = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
      const next = shown >= window.innerHeight * 0.5
      if (next === customVisible) return
      customVisible = next
      sync()
    }
    const onScroll = () => {
      if (reduced) draw(performance.now())
      if (scrollFrame) return
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; updateCustom() })
    }
    const onResize = () => { resize(); updateCustom() }
    const onVisibility = () => document.hidden ? stop() : start()
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      sync()
    })

    resize(true)
    observer.observe(canvas)
    updateCustom()
    if (reduced) draw(performance.now())
    else start()
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerdown', onDragStart, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerCancel, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerdown', onDragStart)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
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
