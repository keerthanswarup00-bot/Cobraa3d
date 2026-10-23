'use client'

import { BriefPreview } from './BriefPreview'
import { Piece3D } from './Piece3D'
import { useBrief } from './BriefProvider'
import { detectScript } from '@/lib/text'

/**
 * The hero shows the same piece as the rest of the page, but upgrades the
 * CSS preview to the real 3D build once it is ready. The CSS preview stays
 * underneath so a slow scene never leaves an empty stage, and it remains
 * visible if the device cannot run WebGL at all.
 */
export function HeroPiece() {
  const brief = useBrief()
  const active = brief.item
  const previewText = brief.text.trim() || active.empty || ''
  const showText = Boolean(active.text && previewText)
  const useCanvasText = showText && detectScript(previewText) === 'other'
  const label = `${active.label}, text ${showText ? previewText : 'empty'}, base ${brief.baseColourName}, text ${brief.textColourName}`

  return <div className="studio-hero-piece-layers">
    <div className="studio-hero-piece-fallback" aria-hidden="true">
      <BriefPreview />
    </div>
    <Piece3D
      kind={active.piece}
      text={previewText}
      fontFamily={brief.font.family}
      baseColour={brief.baseColourHex}
      textColour={brief.textColourHex}
      useCanvasText={useCanvasText}
      reducedMotion={false}
      sway
      label={label}
      description={label}
    />
  </div>
}
