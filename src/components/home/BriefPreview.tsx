'use client'

import { ProductRender, ink, type ConnectProduct } from './ConnectProducts'
import { useBrief } from './BriefProvider'
import { Piece3D } from './Piece3D'
import { detectScript } from '@/lib/text'

/**
 * One preview for the whole page. The hero and the full brief render the same
 * piece, so an edit in either place is visible in both.
 */
export function BriefPreview({ animate = false }: { animate?: boolean }) {
  const brief = useBrief()
  const active = brief.item
  const previewText = brief.text.trim() || active.empty || ''
  const previewFontSize = (previewText.length <= 6 ? 46 : previewText.length <= 10 ? 38 : previewText.length <= 14 ? 31 : previewText.length <= 18 ? 26 : 22) * (active.shape === 'key' ? .86 : 1)
  const contrast = ink(brief.textColourHex)
  const product: ConnectProduct = {
    id: 'brief-preview',
    slug: 'preview',
    title: active.label,
    blurb: '',
    tag: 'Preview',
    filament: brief.baseColourHex,
    visual: active.shape,
  }

  const textColour = brief.textColourHex
  const showText = Boolean(active.text && previewText)
  const script = showText ? detectScript(previewText) : 'latin'
  const useCanvasText = script === 'other'
  const family = (brief.font as { family?: string }).family || (brief.fontId === 'mono' ? 'mono' : brief.fontId === 'serif' ? 'serif' : brief.fontId === 'sans' ? 'sans' : 'display')

  if (active.shape === 'plate' || active.shape === 'key') {
    const fallback = <div
      className={`studio-preview-plate${active.shape === 'key' ? ' is-keychain' : ''}${brief.text.trim() ? '' : ' is-empty'}`}
      style={{ fontFamily: brief.font.variable, fontWeight: brief.font.weight, letterSpacing: brief.font.spacing, color: contrast.color, textShadow: contrast.shadow, fontSize: `${Math.round(previewFontSize)}px`, '--fil': brief.baseColourHex } as React.CSSProperties}
    >{previewText}</div>

    const label = `${active.label}, text ${previewText || 'empty'}, base ${brief.baseColourName}, text ${brief.textColourName}`
    return <Piece3D
      kind={active.piece}
      text={previewText}
      fontFamily={family as 'display' | 'sans' | 'serif' | 'mono'}
      baseColour={brief.baseColourHex}
      textColour={textColour}
      useCanvasText={useCanvasText}
      reducedMotion={typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches}
      sway
      fallback={fallback}
      label={label}
      description={label}
    />
  }

  return <ProductRender key={`${active.id}-${brief.previewKey}`} product={product} animate={animate} buildKey={brief.previewKey + 1} />
}
