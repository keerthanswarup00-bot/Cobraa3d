import { describe, expect, it } from 'vitest'
import { buildBriefMessage, contrastRatio, contrastingColourIndex, FALLBACK_COLOURS } from '@/components/home/briefConfig'

describe('default text colour', () => {
  it('never defaults to the same colour as the base', () => {
    FALLBACK_COLOURS.forEach((_, base) => {
      expect(contrastingColourIndex(FALLBACK_COLOURS, base)).not.toBe(base)
    })
  })

  it('is readable on the default Bone base (Graphite, the first palette colour that passes)', () => {
    const pick = contrastingColourIndex(FALLBACK_COLOURS, 0)
    expect(FALLBACK_COLOURS[pick]!.name).toBe('Graphite')
    expect(contrastRatio(FALLBACK_COLOURS[0]!.hex, FALLBACK_COLOURS[pick]!.hex)).toBeGreaterThanOrEqual(4.5)
  })

  it('falls back to the best available contrast when nothing reaches 4.5:1', () => {
    const terracotta = FALLBACK_COLOURS.findIndex((colour) => colour.name === 'Terracotta')
    const pick = contrastingColourIndex(FALLBACK_COLOURS, terracotta)
    const best = Math.max(...FALLBACK_COLOURS.map((colour, index) => (index === terracotta ? 0 : contrastRatio(FALLBACK_COLOURS[terracotta]!.hex, colour.hex))))
    expect(contrastRatio(FALLBACK_COLOURS[terracotta]!.hex, FALLBACK_COLOURS[pick]!.hex)).toBeCloseTo(best, 5)
  })

  it('returns the base when the palette has a single colour', () => {
    expect(contrastingColourIndex([{ name: 'Only', hex: '#ffffff' }], 0)).toBe(0)
  })
})

describe('custom brief message', () => {
  it('includes both colours, an optional needed-by date, and an active offer', () => {
    const message = buildBriefMessage({
      item: { id: 'nameplate', label: 'Nameplate', text: true, photo: false },
      text: '  Zoë  ',
      font: 'Bold',
      baseColour: 'Bone',
      textColour: 'Ink blue',
      quantity: 2,
      note: '',
      neededBy: '2026-11-03',
      activeOfferText: 'Festive 10% off',
    })
    expect(message).toContain('• Colour: Bone, text Ink blue')
    expect(message).toContain('• Needed by: 3 Nov 2026')
    expect(message).toContain('• Offer: Festive 10% off')
    expect(message).toContain('• Text: "Zoë"')
  })

  it('does not add a needed-by or offer line when neither is present', () => {
    const message = buildBriefMessage({
      item: { id: 'lamp', label: 'Lamp', text: false, photo: false },
      text: '',
      font: 'Bold',
      baseColour: 'Bone',
      textColour: 'Bone',
      quantity: 1,
      note: '',
      neededBy: '',
    })
    expect(message).not.toContain('Needed by:')
    expect(message).not.toContain('Offer:')
  })
})
