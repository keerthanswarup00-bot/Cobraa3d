'use client'

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/shared'
import { ink, ProductRender, type ConnectProduct } from './ConnectProducts'

const ITEMS = {
  nameplate: { label: 'Nameplate', text: true, shape: 'plate', textLabel: 'Name or text', placeholder: 'e.g. Maya Rao', empty: 'Your name' },
  keychain: { label: 'Keychain', text: true, shape: 'key', textLabel: 'Name or initials', placeholder: 'e.g. Aarav', empty: 'Name' },
  lamp: { label: 'Lamp', text: false, shape: 'lamp' },
  stand: { label: 'Phone stand', text: false, shape: 'stand' },
  photo: { label: 'Photo stand', text: false, shape: 'photo', photo: true, noteLabel: '04 · Photo size and orientation', notePlaceholder: 'e.g. 4×6 in, portrait' },
  gift: { label: 'Personalised gift', text: true, shape: 'plate', textLabel: 'Name or message', placeholder: 'e.g. Happy 30th, Arjun', empty: 'Your message' },
  other: { label: 'Something else', text: false, shape: 'sphere' },
} as const
const FONTS = [
  { id: 'bold', label: 'Bold', variable: 'var(--display)', weight: 700, spacing: '-.03em' },
  { id: 'sans', label: 'Clean', variable: 'var(--sans)', weight: 600, spacing: '-.01em' },
  { id: 'serif', label: 'Serif', variable: 'var(--serif)', weight: 400, spacing: '0' },
  { id: 'mono', label: 'Mono', variable: 'var(--mono)', weight: 500, spacing: '-.03em' },
] as const
const COLOURS = [
  { name: 'Bone', hex: '#e6dcc6' }, { name: 'Graphite', hex: '#55514c' }, { name: 'Terracotta', hex: '#b95a3b' },
  { name: 'Sage', hex: '#8ea383' }, { name: 'Ink blue', hex: '#33507d' }, { name: 'Marigold', hex: '#e2a725' },
] as const
type ItemId = keyof typeof ITEMS

function clampQuantity(value: number) { return Math.max(1, Math.min(500, Number.isFinite(value) ? Math.floor(value) : 1)) }

/**
 * The layer counter runs on its own rAF loop and writes into a single text
 * node, so a build never re-renders the builder around it.
 */
const LayerCounter = memo(function LayerCounter({ total, runId }: { total: number; runId: number }) {
  const node = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const element = node.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = `${total} / ${total} layers`
      return
    }
    const duration = 1300
    const startedAt = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      element.textContent = `${Math.min(total, Math.round(progress * total))} / ${total} layers`
      frame = progress < 1 ? window.requestAnimationFrame(tick) : 0
    }
    frame = window.requestAnimationFrame(tick)
    return () => { if (frame) window.cancelAnimationFrame(frame) }
  }, [total, runId])
  return <span className="studio-stage-tag bottom-left" ref={node}>{`0 / ${total} layers`}</span>
})

export function ConnectBuilder({ whatsappNumber }: { whatsappNumber?: string | null }) {
  const [item, setItem] = useState<ItemId>('nameplate')
  const [text, setText] = useState('')
  const [font, setFont] = useState<(typeof FONTS)[number]['id']>('bold')
  const [colour, setColour] = useState(0)
  const [quantityInput, setQuantityInput] = useState('1')
  const [note, setNote] = useState('')
  const [previewKey, setPreviewKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')
  const messageRef = useRef<HTMLPreElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const active = ITEMS[item]
  const selectedColour = COLOURS[colour]!
  const contrast = ink(selectedColour.hex)
  const selectedFont = FONTS.find((entry) => entry.id === font)!
  const layerTotal = active.shape === 'plate' || active.shape === 'key' ? 24 : 36
  const quantity = useMemo(() => clampQuantity(Number.parseInt(quantityInput, 10)), [quantityInput])
  const product: ConnectProduct = { id: 'builder-preview', slug: 'preview', title: active.label, blurb: '', tag: 'Preview', filament: selectedColour.hex, visual: active.shape }

  useEffect(() => {
    const choose = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id
      if (id && id in ITEMS) { setItem(id as ItemId); setPreviewKey((value) => value + 1) }
    }
    const requested = new URLSearchParams(window.location.search).get('item')
    const frame = requested && requested in ITEMS ? requestAnimationFrame(() => choose(new CustomEvent('cobraa:choose-item', { detail: { id: requested } }))) : 0
    window.addEventListener('cobraa:choose-item', choose)
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener('cobraa:choose-item', choose) }
  }, [])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const update = () => {
      const height = window.visualViewport?.height ?? window.innerHeight
      card.classList.toggle('is-short-viewport', height < 520)
    }
    update()
    window.visualViewport?.addEventListener('resize', update)
    window.addEventListener('resize', update)
    return () => { window.visualViewport?.removeEventListener('resize', update); window.removeEventListener('resize', update) }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const message = useMemo(() => {
    const rows = [`Hi Cobraa 3D! I'd like to start a custom order.`, '', `• Item: ${active.label}`]
    if (active.text) rows.push(`• Text: ${text.trim() ? `"${text.trim()}"` : 'not decided yet'}`, `• Font: ${selectedFont.label}`)
    if ('photo' in active && active.photo) rows.push("• Photo: I'll share it in this chat")
    rows.push(`• Colour: ${selectedColour.name}`, `• Quantity: ${quantity}`)
    if (note.trim()) rows.push(`• ${item === 'other' ? 'Idea' : item === 'photo' ? 'Photo size' : 'Notes'}: ${note.trim()}`)
    rows.push('', 'Could you confirm feasibility, price and timeline?')
    return rows.join('\n')
  }, [active, item, text, selectedFont.label, selectedColour.name, quantity, note])
  const whatsappURL = useMemo(() => buildWhatsAppUrl({ number: whatsappNumber, message }), [whatsappNumber, message])
  const ready = active.text ? Boolean(text.trim()) : item === 'other' ? Boolean(note.trim()) : true
  const previewText = text.trim() || ('empty' in active ? active.empty : '')
  const previewFontSize = (previewText.length <= 6 ? 46 : previewText.length <= 10 ? 38 : previewText.length <= 14 ? 31 : previewText.length <= 18 ? 26 : 22) * (active.shape === 'key' ? .86 : 1)

  const selectItem = (id: ItemId) => { setItem(id); setPreviewKey((value) => value + 1) }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
      const rect = event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--rx', `${(.5 - (event.clientY - rect.top) / rect.height) * 12}deg`)
      event.currentTarget.style.setProperty('--ry', `${(((event.clientX - rect.left) / rect.width) - .5) * 18}deg`)
    }
  }
  const resetTilt = (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.style.setProperty('--rx', '0deg'); event.currentTarget.style.setProperty('--ry', '0deg') }
  const copyBrief = async () => {
    try { await navigator.clipboard.writeText(message); setCopied(true); setToast('Brief copied. Paste it anywhere.') }
    catch {
      if (!messageRef.current) return
      const range = document.createRange(); range.selectNodeContents(messageRef.current)
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range)
      setCopied(false); setToast('Press ⌘/Ctrl + C to copy')
    }
  }
  const setItemChoice = (id: ItemId) => selectItem(id)
  const itemId = useId()

  /** Keeps a focused field clear of the sticky preview on small screens. */
  const keepFieldClear = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return
    if (!window.matchMedia('(max-width: 760px)').matches) return
    window.requestAnimationFrame(() => target.scrollIntoView({ block: 'center', behavior: 'auto' }))
  }

  return <>
    <div className="studio-builder-card" id="connect-builder" ref={cardRef} onFocus={keepFieldClear}>
      <header className="studio-builder-head"><h3>Your brief</h3><span className="studio-eyebrow">Takes under a minute</span></header>
      <div className="studio-builder-grid">
        <div className="studio-stage-column"><div className="studio-stage" aria-label="Live preview of your piece" onPointerMove={onPointerMove} onPointerUp={resetTilt} onPointerCancel={resetTilt}>
          <span className="studio-stage-tag top">Live preview</span>
          <div className="studio-stage-model" key={`model-${item}-${colour}-${previewKey}`} data-preview-item={item} data-preview-type={active.shape} style={{ '--fil': selectedColour.hex } as React.CSSProperties}>
            {active.shape === 'plate' || active.shape === 'key' ? <div className={`studio-preview-plate${active.shape === 'key' ? ' is-keychain' : ''}${text.trim() ? '' : ' is-empty'}`} style={{ fontFamily: selectedFont.variable, fontWeight: selectedFont.weight, letterSpacing: selectedFont.spacing, color: contrast.color, textShadow: contrast.shadow, fontSize: `${Math.round(previewFontSize)}px` }}>{previewText}</div> : <ProductRender key={`${item}-${previewKey}-${colour}`} product={product} animate buildKey={previewKey + 1} />}
          </div>
          <div className="studio-stage-foot"><LayerCounter total={layerTotal} runId={previewKey} /><span className="studio-stage-tag bottom-right">Illustrative</span></div>
          {active.shape !== 'plate' && active.shape !== 'key' && <span className="studio-stage-nozzle" key={`nozzle-${item}-${colour}-${previewKey}`} />}
        </div></div>
        <div className="studio-controls">
          <fieldset className="studio-field"><legend>01 · What are we making?</legend><div className="studio-chips">{Object.entries(ITEMS).map(([id, option]) => <label className="studio-chip" key={id}><input type="radio" name={`${itemId}-item`} value={id} checked={item === id} onChange={() => setItemChoice(id as ItemId)} /><span>{option.label}</span></label>)}</div></fieldset>
          {active.text && <div className="studio-field"><label className="studio-field-label" htmlFor="connect-text"><span>{active.textLabel}</span><b>{text.length}/20</b></label><input id="connect-text" className="studio-text-input" maxLength={20} value={text} onChange={(event) => setText(event.target.value)} placeholder={active.placeholder} autoComplete="off" spellCheck={false} /><fieldset className="studio-field studio-font-field"><legend>Font</legend><div className="studio-chips">{FONTS.map((entry) => <label className="studio-chip studio-font-chip" key={entry.id}><input type="radio" name={`${itemId}-font`} value={entry.id} checked={font === entry.id} onChange={() => { setFont(entry.id); setPreviewKey((value) => value + 1) }} /><span><i style={{ fontFamily: entry.variable, fontWeight: entry.weight }}>Aa</i>{entry.label}</span></label>)}</div></fieldset></div>}
          <fieldset className="studio-field"><legend>02 · Filament colour <b>{selectedColour.name}</b></legend><div className="studio-swatches">{COLOURS.map((entry, index) => <label className="studio-swatch" key={entry.name} title={entry.name}><input type="radio" name={`${itemId}-colour`} value={index} checked={colour === index} onChange={() => { setColour(index); setPreviewKey((value) => value + 1) }} aria-label={entry.name} /><i style={{ '--swatch': entry.hex } as React.CSSProperties} /></label>)}</div></fieldset>
          <div className="studio-field"><label className="studio-field-label" htmlFor="connect-quantity">03 · Quantity</label><div className="studio-quantity"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantityInput(String(clampQuantity(quantity - 1)))}>−</button><input id="connect-quantity" type="number" inputMode="numeric" min={1} max={500} value={quantityInput} onChange={(event) => setQuantityInput(event.target.value.replace(/[^\d]/g, ''))} onBlur={() => setQuantityInput(String(quantity))} /><button type="button" aria-label="Increase quantity" onClick={() => setQuantityInput(String(clampQuantity(quantity + 1)))}>+</button></div></div>
          <div className="studio-field"><label className="studio-field-label" htmlFor="connect-note">{('noteLabel' in active && active.noteLabel) || (item === 'other' ? '04 · Describe your idea' : '04 · Anything else? (optional)')}</label><input id="connect-note" className="studio-text-input" maxLength={240} value={note} onChange={(event) => setNote(event.target.value)} placeholder={('notePlaceholder' in active && active.notePlaceholder) || (item === 'other' ? 'What would you like us to make?' : 'Size, deadline, where it’ll live…')} autoComplete="off" /></div>
        </div>
      </div>
      <div className="studio-send"><div><span className="studio-message-label">The message we’ll open for you <span className={ready ? 'is-ready' : ''}>{ready ? 'Ready to quote' : item === 'other' ? 'Describe your idea for a faster quote' : 'Add your text for a faster quote'}</span></span><pre className="studio-message" ref={messageRef}>{message}</pre></div><div className="studio-builder-actions">{whatsappURL ? <a className="studio-button is-light" href={whatsappURL} target="_blank" rel="noopener">Send on WhatsApp <ArrowUpRight size={16} /></a> : <button className="studio-button is-light" type="button" disabled>WhatsApp contact not set</button>}<button className="studio-button is-ghost" type="button" onClick={copyBrief}>{copied ? 'Copied brief' : 'Copy brief'} <span aria-hidden="true">⧉</span></button></div><p className="studio-builder-note">Nothing is sent until you press send in WhatsApp. You can edit the message first.</p></div>
    </div>
    <div className={`studio-toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">{toast}</div>
  </>
}
