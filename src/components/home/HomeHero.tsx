'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { HeroPiece } from './HeroPiece'
import { useBrief } from './BriefProvider'
import { CYCLE_ITEM_IDS } from './briefConfig'
import { detectScript } from '@/lib/text'

const CYCLE_MS = 3500

/**
 * The hero stage cycles through the pieces we make until the visitor touches
 * anything, then it stays on their choice for good.
 */
export function HomeHero({ hint = 'Drag the piece sideways to turn it.' }: { hint?: string }) {
  const brief = useBrief()
  const { touched, cycleItem } = brief
  const currentItem = brief.item.id
  const [reducedMotion, setReducedMotion] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const fieldId = useId()
  const [dragHintHidden, setDragHintHidden] = useState(false)
  const scriptNote = brief.item.text && brief.text.trim() && detectScript(brief.text.trim()) === 'other'
    ? 'Preview approximates this script; we’ll confirm the real result on WhatsApp.'
    : null

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reducedMotion || touched) return
    const timer = window.setInterval(() => {
      const index = CYCLE_ITEM_IDS.indexOf(currentItem as (typeof CYCLE_ITEM_IDS)[number])
      cycleItem(CYCLE_ITEM_IDS[(index + 1) % CYCLE_ITEM_IDS.length]!)
    }, CYCLE_MS)
    return () => window.clearInterval(timer)
  }, [reducedMotion, touched, currentItem, cycleItem])

  const tilt = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
      const rect = event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--rx', `${(.5 - (event.clientY - rect.top) / rect.height) * 8}deg`)
      event.currentTarget.style.setProperty('--ry', `${(((event.clientX - rect.left) / rect.width) - .5) * 12}deg`)
    }
  }
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    brief.touch()
    tilt(event)
    if (!dragHintHidden) setDragHintHidden(true)
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    tilt(event)
  }
  const resetTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    event.currentTarget.style.setProperty('--rx', '0deg')
    event.currentTarget.style.setProperty('--ry', '0deg')
  }

  return <div className="studio-hero-customiser">
    <div
      className="studio-hero-stage"
      ref={stageRef}
      data-hero-stage
      data-preview-item={brief.item.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={resetTilt}
      onPointerCancel={resetTilt}
    >
      <div className="studio-hero-stage-model" style={{ '--fil': brief.baseColourHex } as React.CSSProperties}>
        <HeroPiece />
      </div>
      <p className="studio-hero-piece"><span>{brief.item.label}</span></p>
      {!dragHintHidden && <span className="studio-drag-hint">{hint}</span>}
    </div>
    {scriptNote && <p className="studio-script-note">{scriptNote}</p>}

    <div className="studio-hero-controls">
      {brief.item.text && <div className="studio-field">
        <label className="studio-field-label" htmlFor={`${fieldId}-text`}><span>{brief.item.textLabel || 'Name'}</span><b>{brief.text.length}/{brief.config.maxCharacters}</b></label>
        <input
          id={`${fieldId}-text`}
          className="studio-text-input"
          maxLength={brief.config.maxCharacters}
          value={brief.text}
          onChange={(event) => brief.setText(event.target.value)}
          placeholder={brief.item.placeholder || 'e.g. Maya Rao'}
          autoComplete="off"
          spellCheck={false}
        />
      </div>}

      <div className="studio-field">
        <span className="studio-field-label"><span>Base colour</span><b>{brief.baseColourName}</b></span>
        <div className="studio-swatches">
          {brief.config.colours.map((entry: any, index: number) => <label className="studio-swatch" key={entry.name} title={entry.name}>
            <input type="radio" name={`${fieldId}-base`} value={index} checked={brief.baseColourName === entry.name} onChange={() => brief.setBaseColour(index)} onClick={() => brief.touch()} aria-label={entry.name} />
            <i style={{ '--swatch': entry.hex } as React.CSSProperties} />
          </label>)}
        </div>
      </div>

      {brief.item.text && <div className="studio-field">
        <span className="studio-field-label"><span>Text colour</span><b>{brief.textColourName}</b></span>
        <div className="studio-swatches">
          {brief.config.colours.map((entry: any, index: number) => <label className="studio-swatch" key={entry.name} title={entry.name}>
            <input type="radio" name={`${fieldId}-text-colour`} value={index} checked={brief.textColourName === entry.name} onChange={() => brief.setTextColour(index)} onClick={() => brief.touch()} aria-label={`Text colour ${entry.name}`} />
            <i style={{ '--swatch': entry.hex } as React.CSSProperties} />
          </label>)}
        </div>
      </div>}

      <div className="studio-field">
        <span className="studio-field-label"><span>What are we making?</span></span>
        <div className="studio-chip-row" role="group" aria-label="Choose a piece">
          {brief.config.items.map((entry: any) => <label className="studio-chip" key={entry.id}>
            <input type="radio" name={`${fieldId}-item`} value={entry.id} checked={brief.item.id === entry.id} onChange={() => brief.setItem(entry.id)} onClick={() => brief.touch()} />
            <span>{entry.label}</span>
          </label>)}
        </div>
      </div>

      <div className="studio-hero-actions">
        {brief.whatsappURL
          ? <a className="studio-button is-light" href={brief.whatsappURL} data-wa-source="hero" target="_blank" rel="noopener noreferrer">Send on WhatsApp <ArrowUpRight size={16} /></a>
          : <button className="studio-button is-light" type="button" disabled>WhatsApp contact not set</button>}
        <a className="studio-hero-browse" href="#products">Browse products <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  </div>
}
