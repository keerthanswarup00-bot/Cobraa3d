'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { StudioFontFamily } from './piece3d/fonts'
import type { PieceKind } from './piece3d/geometry'
import type { PieceScene } from './piece3d/scene'

type Piece3DProps = {
  kind: PieceKind
  text: string
  fontFamily: StudioFontFamily
  baseColour: string
  textColour: string
  useCanvasText: boolean
  reducedMotion: boolean
  sway: boolean
  label: string
  description: string
  onReady?: () => void
  onInteract?: () => void
}

type IdleHandle = { cancel: () => void }

function whenIdle(callback: () => void): IdleHandle {
  const request = (window as unknown as {
    requestIdleCallback?: (handler: () => void, options: { timeout: number }) => number
    cancelIdleCallback?: (handle: number) => void
  }).requestIdleCallback
  if (typeof request === 'function') {
    const handle = request(() => callback(), { timeout: 1500 })
    return { cancel: () => (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(handle) }
  }
  const timer = window.setTimeout(callback, 1500)
  return { cancel: () => window.clearTimeout(timer) }
}

/** Checks the things that make a 3D preview a bad idea on a phone. */
function canRender3D() {
  const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return false
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory
  if (typeof memory === 'number' && memory <= 2) return false
  try {
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl2') || probe.getContext('webgl')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/**
 * The live piece in the hero. The CSS preview stays on screen until the
 * browser is idle and the stage is on screen, and it stays if the phone
 * cannot run WebGL at all.
 */
export function Piece3D(props: Piece3DProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<PieceScene | null>(null)
  const latest = useRef(props)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'off'>('idle')
  const [memory, setMemory] = useState('')
  const descriptionId = useId()

  useEffect(() => {
    latest.current = props
  })

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    let cancelled = false
    let idle: IdleHandle | null = null
    let scene: PieceScene | null = null

    const start = async () => {
      if (cancelled) return
      setState('loading')
      const { createPieceScene } = await import('./piece3d/scene')
      if (cancelled) return
      const options = latest.current
      scene = await createPieceScene({
        canvas,
        kind: options.kind,
        text: options.text,
        fontFamily: options.fontFamily,
        baseColour: options.baseColour,
        textColour: options.textColour,
        useCanvasText: options.useCanvasText,
        reducedMotion: options.reducedMotion,
        onReady: () => {
          if (cancelled) return
          setState('ready')
          options.onReady?.()
        },
        onMemory: (info) => setMemory(`${info.geometries}:${info.textures}`),
        onInteract: () => latest.current.onInteract?.(),
      })
      if (cancelled) {
        scene.dispose()
        return
      }
      sceneRef.current = scene
      scene.setSway(options.sway)
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      if (!canRender3D()) {
        setState('off')
        return
      }
      idle = whenIdle(() => {
        idle = null
        void start()
      })
    }, { rootMargin: '160px' })

    observer.observe(wrapper)
    return () => {
      cancelled = true
      observer.disconnect()
      idle?.cancel()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.setKind(props.kind, true)
    scene.setText(props.text, props.useCanvasText)
    scene.setFont(props.fontFamily)
    scene.setColours(props.baseColour, props.textColour)
    scene.setReducedMotion(props.reducedMotion)
  }, [props.kind, props.text, props.useCanvasText, props.fontFamily, props.baseColour, props.textColour, props.reducedMotion])

  useEffect(() => {
    sceneRef.current?.setSway(props.sway)
  }, [props.sway])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    sceneRef.current?.rotateBy(event.key === 'ArrowLeft' ? -0.26 : 0.26)
  }

  return <div
    className="studio-piece3d"
    ref={wrapperRef}
    role="group"
    tabIndex={0}
    aria-label={props.label}
    aria-describedby={descriptionId}
    data-piece3d-state={state}
    data-piece3d-memory={memory}
    onKeyDown={onKeyDown}
  >
    <canvas className="studio-piece3d-canvas" ref={canvasRef} aria-hidden="true" style={{ touchAction: 'pan-y' }} />
    <p className="studio-visually-hidden" id={descriptionId}>{props.description}</p>
  </div>
}
