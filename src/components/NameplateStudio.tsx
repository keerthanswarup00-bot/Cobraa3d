'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { buildNameplateMessage } from '@/lib/shared'

type Props = {
  fonts: { font: string }[]
  colours: { name: string; hex: string }[]
  maxCharacters: number
  startingFromNote?: string | null
  whatsappNumber?: string | null
  calmMode?: boolean
}

function textColour(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return '#080808'
  const rgb = match[1]!.match(/.{2}/g)!.map((value) => parseInt(value, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  const luminance = .2126 * rgb[0]! + .7152 * rgb[1]! + .0722 * rgb[2]!
  return luminance > .179 ? '#080808' : '#FFFFFF'
}

export function NameplateStudio({ fonts, colours, maxCharacters, startingFromNote, whatsappNumber, calmMode = false }: Props) {
  const safeFonts = fonts.length ? fonts : [{ font: 'Sans' }]
  const safeColours = colours.length ? colours : [{ name: 'Black', hex: '#080808' }]
  const [text, setText] = useState('Your name'.slice(0, Math.max(1, maxCharacters)))
  const [font, setFont] = useState(safeFonts[0]!.font)
  const [colour, setColour] = useState(safeColours[0]!)
  const [added, setAdded] = useState(false)
  const reduceMotion = useReducedMotion() || calmMode
  const messageURL = useMemo(() => buildNameplateMessage({ text: text.trim() || 'Your name', font, colour: colour.name }, { whatsappNumber }), [text, font, colour, whatsappNumber])
  const addToRequest = () => {
    sessionStorage.setItem('cobraa-nameplate-request', JSON.stringify({ text: text.trim(), font, colour: colour.name }))
    setAdded(true)
    if (navigator.vibrate) navigator.vibrate(8)
    document.getElementById('custom-enquiry-form')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    window.dispatchEvent(new CustomEvent('cobraa:nameplate', { detail: { text: text.trim(), font, colour: colour.name } }))
  }
  return <section className="nameplate-studio" aria-labelledby="nameplate-heading">
    <div className="nameplate-controls">
      <label htmlFor="nameplate-text">Your text</label>
      <input id="nameplate-text" value={text} maxLength={maxCharacters} onChange={(event) => setText(event.target.value)} aria-describedby="nameplate-preview-note" />
      <small>{text.length}/{maxCharacters} characters</small>
      <label htmlFor="nameplate-font">Font</label>
      <select id="nameplate-font" value={font} onChange={(event) => setFont(event.target.value)}>{safeFonts.map((item) => <option key={item.font}>{item.font}</option>)}</select>
      <span className="nameplate-label">Colour</span>
      <div className="nameplate-swatches" role="group" aria-label="Nameplate colour">{safeColours.map((item) => <button type="button" key={`${item.name}-${item.hex}`} aria-label={item.name} aria-pressed={colour.name === item.name} style={{ '--swatch': item.hex } as React.CSSProperties} onClick={() => setColour(item)}><span /></button>)}</div>
    </div>
    <div className="nameplate-preview" aria-live="polite"><motion.span key={`${text}-${font}-${colour.hex}`} className="nameplate-plate" style={{ '--plate-colour': colour.hex, '--plate-font': font, '--plate-text': textColour(colour.hex) } as React.CSSProperties} initial={reduceMotion ? false : { opacity: .5, y: 8, boxShadow: 'none' }} animate={{ opacity: 1, y: 0, boxShadow: ['0 2px 0 rgb(0 0 0 / 12%)', '0 2px 0 rgb(0 0 0 / 12%), 0 4px 0 rgb(0 0 0 / 10%)', '0 2px 0 rgb(0 0 0 / 12%), 0 4px 0 rgb(0 0 0 / 10%), 0 6px 0 rgb(0 0 0 / 8%), 0 8px 14px rgb(0 0 0 / 15%)'] }} transition={reduceMotion ? { duration: 0 } : { duration: .45, ease: 'easeOut' }}>{text || ' '}</motion.span><p id="nameplate-preview-note">Preview. Final look, size and price confirmed on WhatsApp.</p>{startingFromNote && <small>{startingFromNote}</small>}</div>
    <div className="nameplate-actions">{messageURL && text.trim() ? <a className="nameplate-whatsapp" href={messageURL} target="_blank" rel="noopener noreferrer">Ask about this nameplate</a> : <button type="button" disabled>WhatsApp contact not set</button>}<button type="button" onClick={addToRequest}>Add to my custom request</button>{added && <span role="status">Added to your request</span>}</div>
  </section>
}
