import { describe, expect, it } from 'vitest'
import { buildBriefMessage } from '@/components/home/briefConfig'

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
