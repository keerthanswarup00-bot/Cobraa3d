'use client'

import { useRef, useState, type CSSProperties, type PointerEvent, type KeyboardEvent } from 'react'

export function LayerShowcase() {
  const [turn, setTurn] = useState({ x: -7, y: 0 })
  const drag = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
  const layers = Array.from({ length: 34 }, (_, index) => {
    const t = index / 33
    const width = 42 + 68 * Math.sin(Math.PI * t) ** 0.68
    const y = 235 - index * 5.1
    const center = 180 + Math.sin(t * Math.PI * 1.4) * 8
    return { index, path: `M ${center - width} ${y} C ${center - width} ${y + 5} ${center - width * .55} ${y + 8} ${center} ${y + 8} C ${center + width * .55} ${y + 8} ${center + width} ${y + 5} ${center + width} ${y} C ${center + width} ${y - 4} ${center + width * .55} ${y - 7} ${center} ${y - 7} C ${center - width * .55} ${y - 7} ${center - width} ${y - 4} ${center - width} ${y} Z` }
  })
  const style = { '--turn-x': `${turn.x}deg`, '--turn-y': `${turn.y}deg` } as CSSProperties

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, active: true }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    drag.current = { x: event.clientX, y: event.clientY, active: true }
    setTurn((current) => ({ x: Math.max(-20, Math.min(20, current.x + dy * -.22)), y: Math.max(-32, Math.min(32, current.y + dx * .32)) }))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = event.shiftKey ? 12 : 6
    if (event.key === 'ArrowLeft') { event.preventDefault(); setTurn((v) => ({ ...v, y: Math.max(-32, v.y - delta) })) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); setTurn((v) => ({ ...v, y: Math.min(32, v.y + delta) })) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setTurn((v) => ({ ...v, x: Math.max(-20, v.x - delta) })) }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setTurn((v) => ({ ...v, x: Math.min(20, v.x + delta) })) }
    else if (event.key === 'Home') { setTurn({ x: -7, y: 0 }) }
  }

  return <div className="layer-showcase-control" role="img" aria-label="Interactive illustration of a layered 3D-printed form. Drag to rotate or use the arrow keys." tabIndex={0} style={style} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current.active = false }} onPointerCancel={() => { drag.current.active = false }} onKeyDown={onKeyDown}>
    <div className="layer-object" aria-hidden="true"><svg viewBox="0 0 360 280" focusable="false"><ellipse cx="180" cy="252" rx="106" ry="13" className="layer-shadow" />{layers.map(({ index, path }) => <path key={index} d={path} className="printed-layer" style={{ opacity: .58 + index / layers.length * .4 }} />)}<path d="M180 54 C230 54 272 63 272 74 M180 54 C130 54 88 63 88 74" className="layer-highlight" /></svg></div>
    <span className="layer-object-caption" aria-hidden="true">Illustrative print layers</span>
  </div>
}
