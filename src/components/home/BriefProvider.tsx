'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildWhatsAppUrl } from '@/lib/shared'
import { clampQuantity, formatNeededBy, type BriefConfig, type BriefFont, type BriefItem } from './briefConfig'

type BriefState = {
  item: string
  text: string
  font: string
  baseColour: number
  textColour: number
  quantityInput: string
  note: string
  neededBy: string
}

export type BriefValue = {
  config: BriefConfig
  item: BriefItem
  font: BriefFont
  baseColourName: string
  baseColourHex: string
  textColourName: string
  textColourHex: string
  text: string
  fontId: string
  quantity: number
  quantityInput: string
  note: string
  neededBy: string
  touched: boolean
  previewKey: number
  message: string
  whatsappURL: string | null
  ready: boolean
  touch: () => void
  setItem: (id: string) => void
  cycleItem: (id: string) => void
  setText: (value: string) => void
  setFont: (id: string) => void
  setBaseColour: (index: number) => void
  setTextColour: (index: number) => void
  setQuantityInput: (value: string) => void
  setNote: (value: string) => void
  setNeededBy: (value: string) => void
}

const BriefContext = createContext<BriefValue | null>(null)

export function BriefProvider({ config, whatsappNumber, children }: { config: BriefConfig; whatsappNumber?: string | null; children: React.ReactNode }) {
  const [state, setState] = useState<BriefState>(() => ({
    item: config.items[0]?.id || 'nameplate',
    text: '',
    font: config.fonts[0]?.id || 'bold',
    baseColour: 0,
    textColour: 0,
    quantityInput: '1',
    note: '',
    neededBy: '',
  }))
  const [touched, setTouched] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const item = useMemo(
    () => config.items.find((entry) => entry.id === state.item) || config.items[0]!,
    [config.items, state.item],
  )
  const font = useMemo(
    () => config.fonts.find((entry) => entry.id === state.font) || config.fonts[0]!,
    [config.fonts, state.font],
  )
  const baseColour = config.colours[state.baseColour] || config.colours[0]!
  const textColour = config.colours[state.textColour] || config.colours[0]!
  const quantity = useMemo(() => clampQuantity(Number.parseInt(state.quantityInput, 10)), [state.quantityInput])

  const edit = useCallback((patch: Partial<BriefState>, rebuild = false) => {
    setTouched(true)
    setState((current) => ({ ...current, ...patch }))
    if (rebuild) setPreviewKey((value) => value + 1)
  }, [])

  const setItem = useCallback((id: string) => edit({ item: id }, true), [edit])
  const touch = useCallback(() => setTouched(true), [])
  const cycleItem = useCallback((id: string) => {
    setState((current) => (current.item === id ? current : { ...current, item: id }))
    setPreviewKey((value) => value + 1)
  }, [])
  const setText = useCallback((value: string) => edit({ text: value }), [edit])
  const setFont = useCallback((id: string) => edit({ font: id }, true), [edit])
  const setBaseColour = useCallback((index: number) => edit({ baseColour: index }, true), [edit])
  const setTextColour = useCallback((index: number) => edit({ textColour: index }, true), [edit])
  const setQuantityInput = useCallback((value: string) => edit({ quantityInput: value }), [edit])
  const setNote = useCallback((value: string) => edit({ note: value }), [edit])
  const setNeededBy = useCallback((value: string) => edit({ neededBy: value }), [edit])

  /** Lets any part of the page jump straight to a piece, for example from a catalogue card. */
  useEffect(() => {
    const choose = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id
      if (id && config.items.some((entry) => entry.id === id)) setItem(id)
    }
    const requested = new URLSearchParams(window.location.search).get('item')
    const frame = requested && config.items.some((entry) => entry.id === requested)
      ? window.requestAnimationFrame(() => choose(new CustomEvent('cobraa:choose-item', { detail: { id: requested } })))
      : 0
    window.addEventListener('cobraa:choose-item', choose)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('cobraa:choose-item', choose)
    }
  }, [config.items, setItem])

  const message = useMemo(() => {
    const rows = [`Hi Cobraa 3D! I'd like to start a custom order.`, '', `• Item: ${item.label}`]
    if (item.text) rows.push(`• Text: ${state.text.trim() ? `"${state.text.trim()}"` : 'not decided yet'}`, `• Font: ${font.label}`)
    if (item.photo) rows.push("• Photo: I'll share it in this chat")
    rows.push(`• Colour: ${baseColour.name}`)
    if (item.text) rows.push(`• Text colour: ${textColour.name}`)
    rows.push(`• Quantity: ${quantity}`)
    if (state.note.trim()) rows.push(`• ${item.id === 'other' ? 'Idea' : item.photo ? 'Photo size' : 'Notes'}: ${state.note.trim()}`)
    if (state.neededBy.trim()) rows.push(`• Needed by: ${formatNeededBy(state.neededBy)}`)
    rows.push('', 'Could you confirm feasibility, price and timeline?')
    return rows.join('\n')
  }, [item, state.text, state.note, state.neededBy, font.label, baseColour.name, textColour.name, quantity])

  const whatsappURL = useMemo(() => buildWhatsAppUrl({ number: whatsappNumber, message }), [whatsappNumber, message])
  const ready = item.text ? Boolean(state.text.trim()) : item.id === 'other' ? Boolean(state.note.trim()) : true

  const value: BriefValue = {
    config,
    item,
    font,
    baseColourName: baseColour.name,
    baseColourHex: baseColour.hex,
    textColourName: textColour.name,
    textColourHex: textColour.hex,
    text: state.text,
    fontId: state.font,
    quantity,
    quantityInput: state.quantityInput,
    note: state.note,
    neededBy: state.neededBy,
    touched,
    previewKey,
    message,
    whatsappURL,
    ready,
    touch,
    setItem,
    cycleItem,
    setText,
    setFont,
    setBaseColour,
    setTextColour,
    setQuantityInput,
    setNote,
    setNeededBy,
  }

  return <BriefContext.Provider value={value}>{children}</BriefContext.Provider>
}

export function useBrief() {
  const value = useContext(BriefContext)
  if (!value) throw new Error('useBrief must be used inside a BriefProvider')
  return value
}
