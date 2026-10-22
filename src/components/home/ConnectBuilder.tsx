'use client'

import { memo, useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { BriefPreview } from './BriefPreview'
import { useBrief } from './BriefProvider'
import { clampQuantity } from './briefConfig'

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

export function ConnectBuilder({ namePromise = 'Any name, any language. We check it prints well and confirm on WhatsApp.' }: { namePromise?: string }) {
  const brief = useBrief()
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')
  const [minDate] = useState(() => new Date().toISOString().slice(0, 10))
  const messageRef = useRef<HTMLPreElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const itemId = useId()
  const active = brief.item
  const layerTotal = active.shape === 'plate' || active.shape === 'key' ? 24 : 36

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

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
      const rect = event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--rx', `${(.5 - (event.clientY - rect.top) / rect.height) * 12}deg`)
      event.currentTarget.style.setProperty('--ry', `${(((event.clientX - rect.left) / rect.width) - .5) * 18}deg`)
    }
  }
  const resetTilt = (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.style.setProperty('--rx', '0deg'); event.currentTarget.style.setProperty('--ry', '0deg') }

  const copyBrief = async () => {
    try { await navigator.clipboard.writeText(brief.message); setCopied(true); setToast('Brief copied. Paste it anywhere.') }
    catch {
      if (!messageRef.current) return
      const range = document.createRange(); range.selectNodeContents(messageRef.current)
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range)
      setCopied(false); setToast('Press ⌘/Ctrl + C to copy')
    }
  }

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
        <div className="studio-stage-column"><div className="studio-stage" aria-label="Live preview of your piece" onPointerDown={() => brief.touch()} onPointerMove={onPointerMove} onPointerUp={resetTilt} onPointerCancel={resetTilt}>
          <span className="studio-stage-tag top">Live preview</span>
          <div className="studio-stage-model" data-preview-item={active.id} data-preview-type={active.shape} style={{ '--fil': brief.baseColourHex } as React.CSSProperties}>
            <BriefPreview animate />
          </div>
          <div className="studio-stage-foot"><LayerCounter total={layerTotal} runId={brief.previewKey} /><span className="studio-stage-tag bottom-right">Illustrative</span></div>
          {active.shape !== 'plate' && active.shape !== 'key' && <span className="studio-stage-nozzle" key={`nozzle-${active.id}-${brief.previewKey}`} />}
        </div></div>
        <div className="studio-controls">
          <fieldset className="studio-field"><legend>01 · What are we making?</legend><div className="studio-chips">{brief.config.items.map((entry) => <label className="studio-chip" key={entry.id}><input type="radio" name={`${itemId}-item`} value={entry.id} checked={active.id === entry.id} onChange={() => brief.setItem(entry.id)} onClick={() => brief.touch()} /><span>{entry.label}</span></label>)}</div></fieldset>
          <div className="studio-field"><label className="studio-field-label" htmlFor="connect-text"><span>{active.textLabel}</span><b>{brief.text.length}/{brief.config.maxCharacters}</b></label><input id="connect-text" className="studio-text-input" maxLength={brief.config.maxCharacters} value={brief.text} onChange={(event) => brief.setText(event.target.value)} placeholder={active.placeholder} autoComplete="off" spellCheck={false} />{active.text && <p className="studio-name-promise">{namePromise}</p>}<fieldset className="studio-field studio-font-field"><legend>Font</legend><div className="studio-chips">{brief.config.fonts.map((entry: any) => <label className="studio-chip studio-font-chip" key={entry.id}><input type="radio" name={`${itemId}-font`} value={entry.id} checked={brief.fontId === entry.id} onChange={() => brief.setFont(entry.id)} onClick={() => brief.touch()} /><span><i style={{ fontFamily: entry.variable, fontWeight: entry.weight }}>Aa</i>{entry.label}</span></label>)}</div></fieldset></div>
          <fieldset className="studio-field"><legend>02 · Base colour <b>{brief.baseColourName}</b></legend><div className="studio-swatches">{brief.config.colours.map((entry: any, index: number) => <label className="studio-swatch" key={entry.name} title={entry.name}><input type="radio" name={`${itemId}-base`} value={index} checked={brief.baseColourName === entry.name} onChange={() => brief.setBaseColour(index)} onClick={() => brief.touch()} aria-label={entry.name} /><i style={{ '--swatch': entry.hex } as React.CSSProperties} /></label>)}</div></fieldset>
          {active.text && <fieldset className="studio-field"><legend>Text colour <b>{brief.textColourName}</b></legend><div className="studio-swatches">{brief.config.colours.map((entry: any, index: number) => <label className="studio-swatch" key={entry.name} title={entry.name}><input type="radio" name={`${itemId}-text-colour`} value={index} checked={brief.textColourName === entry.name} onChange={() => brief.setTextColour(index)} onClick={() => brief.touch()} aria-label={`Text colour ${entry.name}`} /><i style={{ '--swatch': entry.hex } as React.CSSProperties} /></label>)}</div></fieldset>}
          <div className="studio-field"><label className="studio-field-label" htmlFor="connect-quantity">03 · Quantity</label><div className="studio-quantity"><button type="button" aria-label="Decrease quantity" onClick={() => brief.setQuantityInput(String(clampQuantity((Number.parseInt(brief.quantityInput || String(brief.quantity), 10) || brief.quantity) - 1)))}>−</button><input id="connect-quantity" type="number" inputMode="numeric" min={1} max={500} value={brief.quantityInput} onChange={(event) => brief.setQuantityInput(event.target.value.replace(/[^\d]/g, ''))} onBlur={() => {
            const parsed = Number.parseInt(brief.quantityInput, 10)
            if (Number.isNaN(parsed) || brief.quantityInput === '') brief.setQuantityInput(String(1))
            else brief.setQuantityInput(String(clampQuantity(parsed)))
          }} /><button type="button" aria-label="Increase quantity" onClick={() => {
            const parsed = Number.parseInt(brief.quantityInput || String(brief.quantity), 10)
            brief.setQuantityInput(String(clampQuantity((Number.isNaN(parsed) ? brief.quantity : parsed) + 1)))
          }}>+</button></div></div>
          <div className="studio-field"><label className="studio-field-label" htmlFor="connect-note">{(active.noteLabel) || (active.id === 'other' ? '04 · Describe your idea' : '04 · Anything else? (optional)')}</label><input id="connect-note" className="studio-text-input" maxLength={240} value={brief.note} onChange={(event) => brief.setNote(event.target.value)} placeholder={(active.notePlaceholder) || (active.id === 'other' ? 'What would you like us to make?' : 'Size, deadline, where it’ll live…')} autoComplete="off" /></div>
          <div className="studio-field"><label className="studio-field-label" htmlFor="connect-needed-by">05 · Needed by <b>optional</b></label><input id="connect-needed-by" className="studio-text-input studio-date-input" type="date" min={minDate || undefined} value={brief.neededBy} onChange={(event) => brief.setNeededBy(event.target.value)} /></div>
        </div>
      </div>
      <div className="studio-send"><div><span className="studio-message-label">The message we’ll open for you <span className={brief.ready ? 'is-ready' : ''}>{brief.ready ? 'Ready to quote' : active.id === 'other' ? 'Describe your idea for a faster quote' : 'Add your text for a faster quote'}</span></span><pre className="studio-message" ref={messageRef}>{brief.message}</pre></div><div className="studio-builder-actions">{brief.whatsappURL ? <a className="studio-button is-light" href={brief.whatsappURL} data-wa-source="builder" target="_blank" rel="noopener">Send on WhatsApp <ArrowUpRight size={16} /></a> : <button className="studio-button is-light" type="button" disabled>WhatsApp contact not set</button>}<button className="studio-button is-ghost" type="button" onClick={copyBrief}>{copied ? 'Copied brief' : 'Copy brief'} <span aria-hidden="true">⧉</span></button></div><p className="studio-builder-note">Nothing is sent until you press send in WhatsApp. You can edit the message first.</p></div>
    </div>
    <div className={`studio-toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">{toast}</div>
  </>
}
