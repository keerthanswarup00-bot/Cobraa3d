'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { buildWhatsAppUrl } from '@/lib/shared'

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

const itemLabels: Record<string, string> = { nameplate: 'Nameplate', keychain: 'Keychain', lamp: 'Lamp', stand: 'Phone stand', photo: 'Photo stand', gift: 'Personalised gift', other: 'Something else' }

export function NameplateStudio({ fonts, colours, maxCharacters, startingFromNote, whatsappNumber, calmMode = false }: Props) {
  const safeFonts = fonts.length ? fonts : [{ font: 'Sans' }]
  const safeColours = colours.length ? colours : [{ name: 'Black', hex: '#080808' }]
  const [text, setText] = useState('Your name'.slice(0, Math.max(1, maxCharacters)))
  const [font, setFont] = useState(safeFonts[0]!.font)
  const [colour, setColour] = useState(safeColours[0]!)
  const [item, setItem] = useState('nameplate')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)
  const [copied, setCopied] = useState(false)
  const messageRef = useRef<HTMLPreElement>(null)
  const reduceMotion = useReducedMotion() || calmMode
  useEffect(() => {
    const requestedItem = new URLSearchParams(window.location.search).get('item')
    if (!requestedItem || !itemLabels[requestedItem]) return
    const frame = requestAnimationFrame(() => setItem(requestedItem))
    return () => cancelAnimationFrame(frame)
  }, [])
  const message = useMemo(() => [
    'Hi Cobraa 3D, I would like to discuss a custom order.',
    `Item: ${itemLabels[item]}`,
    ...(item === 'nameplate' || item === 'keychain' || item === 'gift' ? [`Text: ${text.trim() || 'not decided yet'}`, `Font: ${font}`] : []),
    `Colour: ${colour.name}`,
    `Quantity: ${quantity}`,
    ...(note.trim() ? [`Notes: ${note.trim()}`] : []),
    '', 'Could you confirm the available options and price?',
  ].join('\n'), [item, text, font, colour.name, quantity, note])
  const messageURL = useMemo(() => buildWhatsAppUrl({ number: whatsappNumber, message }), [message, whatsappNumber])
  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      if (!messageRef.current) return
      const range = document.createRange()
      range.selectNodeContents(messageRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      setCopied(false)
    }
    window.setTimeout(() => setCopied(false), 2200)
  }
  const addToRequest = () => {
    sessionStorage.setItem('cobraa-nameplate-request', JSON.stringify({ item, text: text.trim(), font, colour: colour.name, quantity, note: note.trim() }))
    setAdded(true)
    if (navigator.vibrate) navigator.vibrate(8)
    document.getElementById('custom-enquiry-form')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    window.dispatchEvent(new CustomEvent('cobraa:nameplate', { detail: { text: text.trim(), font, colour: colour.name } }))
  }
  return <section className="nameplate-studio" aria-labelledby="nameplate-heading">
    <div className="nameplate-controls">
      <label htmlFor="nameplate-item">Item</label>
      <select id="nameplate-item" value={item} onChange={(event) => setItem(event.target.value)}>{Object.entries(itemLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <label htmlFor="nameplate-text">Your text</label>
      <input id="nameplate-text" value={text} maxLength={maxCharacters} onChange={(event) => setText(event.target.value)} aria-describedby="nameplate-preview-note" disabled={item !== 'nameplate' && item !== 'keychain' && item !== 'gift'} />
      <small>{text.length}/{maxCharacters} characters</small>
      <label htmlFor="nameplate-font">Font</label>
      <select id="nameplate-font" value={font} onChange={(event) => setFont(event.target.value)}>{safeFonts.map((item) => <option key={item.font}>{item.font}</option>)}</select>
      <span className="nameplate-label">Colour</span>
      <div className="nameplate-swatches" role="group" aria-label="Nameplate colour">{safeColours.map((item) => <button type="button" key={`${item.name}-${item.hex}`} aria-label={item.name} aria-pressed={colour.name === item.name} style={{ '--swatch': item.hex } as React.CSSProperties} onClick={() => setColour(item)}><span /></button>)}</div>
      <label htmlFor="nameplate-quantity">Quantity</label>
      <input id="nameplate-quantity" type="number" min={1} max={500} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(500, Number(event.target.value) || 1)))} />
      <label htmlFor="nameplate-note">Note <span>(optional)</span></label>
      <textarea id="nameplate-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add any details for the studio" rows={3} />
    </div>
    <div className="nameplate-preview" aria-live="polite" onPointerMove={(event) => { if (event.pointerType === 'touch' || event.pointerType === 'mouse') { const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--preview-ry', `${(((event.clientX - bounds.left) / bounds.width) - .5) * 12}deg`); event.currentTarget.style.setProperty('--preview-rx', `${(.5 - (event.clientY - bounds.top) / bounds.height) * 8}deg`) } }} onPointerUp={(event) => { event.currentTarget.style.setProperty('--preview-ry', '0deg'); event.currentTarget.style.setProperty('--preview-rx', '0deg') }} onPointerCancel={(event) => { event.currentTarget.style.setProperty('--preview-ry', '0deg'); event.currentTarget.style.setProperty('--preview-rx', '0deg') }}>{item === 'nameplate' || item === 'keychain' || item === 'gift' ? <motion.span key={`${text}-${font}-${colour.hex}`} className="nameplate-plate" style={{ '--plate-colour': colour.hex, '--plate-font': font, '--plate-text': textColour(colour.hex) } as React.CSSProperties} initial={reduceMotion ? false : { opacity: .5, y: 8, boxShadow: 'none' }} animate={{ opacity: 1, y: 0, boxShadow: ['0 2px 0 rgb(0 0 0 / 12%)', '0 2px 0 rgb(0 0 0 / 12%), 0 4px 0 rgb(0 0 0 / 10%)', '0 2px 0 rgb(0 0 0 / 12%), 0 4px 0 rgb(0 0 0 / 10%), 0 6px 0 rgb(0 0 0 / 8%), 0 8px 14px rgb(0 0 0 / 15%)'] }} transition={reduceMotion ? { duration: 0 } : { duration: .45, ease: 'easeOut' }}>{text || ' '}</motion.span> : <strong>{itemLabels[item]}</strong>}<p id="nameplate-preview-note">Preview is illustrative. Final options and price are confirmed with the studio.</p>{startingFromNote && <small>{startingFromNote}</small>}<div className="nameplate-message-preview"><span>WhatsApp brief · {messageURL ? 'Ready to quote' : 'Contact number not configured'}</span><pre ref={messageRef}>{message}</pre><button type="button" onClick={copyBrief}>{copied ? 'Copied brief' : 'Copy brief'}</button></div></div>
    <div className="nameplate-actions">{messageURL ? <a className="nameplate-whatsapp" href={messageURL} target="_blank" rel="noopener noreferrer">Ask about this order</a> : <button type="button" disabled>WhatsApp contact not set</button>}<button type="button" onClick={addToRequest}>Add to my custom request</button>{added && <span role="status">Added to your request</span>}</div>
  </section>
}
