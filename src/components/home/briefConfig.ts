export type BriefItemShape = 'plate' | 'key' | 'lamp' | 'stand' | 'photo' | 'sphere'

/** The shape the live 3D preview builds for a piece. */
export type BriefPiece = 'plate' | 'key' | 'lamp' | 'stand' | 'easel' | 'block'

export type BriefItem = {
  id: string
  label: string
  text: boolean
  shape: BriefItemShape
  piece: BriefPiece
  textLabel?: string
  placeholder?: string
  empty?: string
  photo?: boolean
  noteLabel?: string
  notePlaceholder?: string
}

export type BriefFont = {
  id: string
  label: string
  variable: string
  weight: number
  spacing: string
  /** Which of the four studio faces this is, so the 3D preview can match it. */
  family: 'display' | 'sans' | 'serif' | 'mono'
}

export type BriefColour = {
  name: string
  hex: string
}

export type BriefConfig = {
  items: BriefItem[]
  fonts: BriefFont[]
  colours: BriefColour[]
  maxCharacters: number
}

export const BRIEF_ITEMS: BriefItem[] = [
  { id: 'nameplate', label: 'Nameplate', text: true, shape: 'plate', piece: 'plate', textLabel: 'Name or text', placeholder: 'e.g. Maya Rao', empty: 'Your name' },
  { id: 'keychain', label: 'Keychain', text: true, shape: 'key', piece: 'key', textLabel: 'Name or initials', placeholder: 'e.g. Aarav', empty: 'Name' },
  { id: 'lamp', label: 'Lamp', text: false, shape: 'lamp', piece: 'lamp' },
  { id: 'stand', label: 'Phone stand', text: false, shape: 'stand', piece: 'stand' },
  { id: 'photo', label: 'Photo stand', text: false, shape: 'photo', piece: 'easel', photo: true, noteLabel: '04 · Photo size and orientation', notePlaceholder: 'e.g. 4×6 in, portrait' },
  { id: 'gift', label: 'Personalised gift', text: true, shape: 'plate', piece: 'plate', textLabel: 'Name or message', placeholder: 'e.g. Happy 30th, Arjun', empty: 'Your message' },
  { id: 'other', label: 'Something else', text: false, shape: 'sphere', piece: 'block' },
]

/** The pieces the hero cycles through before anyone touches the page. */
export const CYCLE_ITEM_IDS = ['nameplate', 'keychain', 'lamp', 'stand', 'photo']

export const FALLBACK_FONTS: BriefFont[] = [
  { id: 'bold', label: 'Bold', variable: 'var(--display)', weight: 700, spacing: '-.03em', family: 'display' },
  { id: 'sans', label: 'Clean', variable: 'var(--sans)', weight: 600, spacing: '-.01em', family: 'sans' },
  { id: 'serif', label: 'Serif', variable: 'var(--serif)', weight: 400, spacing: '0', family: 'serif' },
  { id: 'mono', label: 'Mono', variable: 'var(--mono)', weight: 500, spacing: '-.03em', family: 'mono' },
]

export const FALLBACK_COLOURS: BriefColour[] = [
  { name: 'Bone', hex: '#e6dcc6' },
  { name: 'Graphite', hex: '#55514c' },
  { name: 'Terracotta', hex: '#b95a3b' },
  { name: 'Sage', hex: '#8ea383' },
  { name: 'Ink blue', hex: '#33507d' },
  { name: 'Marigold', hex: '#e2a725' },
]

/**
 * The nameplate settings ship with placeholder values (Sans/Serif and
 * Black/White). They are treated as "not configured" so the studio keeps its
 * own six colours and four fonts until an editor changes them.
 */
const LEGACY_FONTS = ['sans', 'serif']
const LEGACY_COLOURS = ['black', 'white']

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'font'
}

export function fontFromName(name: string): BriefFont {
  const label = name.trim()
  const lower = label.toLowerCase()
  if (lower.includes('mono')) return { id: slug(label), label, variable: 'var(--mono)', weight: 500, spacing: '-.03em', family: 'mono' }
  if (lower.includes('serif')) return { id: slug(label), label, variable: 'var(--serif)', weight: 400, spacing: '0', family: 'serif' }
  if (lower.includes('bold') || lower.includes('black') || lower.includes('heavy')) return { id: slug(label), label, variable: 'var(--display)', weight: 700, spacing: '-.03em', family: 'display' }
  return { id: slug(label), label, variable: 'var(--sans)', weight: 600, spacing: '-.01em', family: 'sans' }
}

export function resolveBriefConfig(settings: {
  nameplate?: {
    allowedFonts?: { font?: string | null }[] | null
    colours?: { name?: string | null; hex?: string | null }[] | null
    maxCharacters?: number | null
  } | null
} | null | undefined): BriefConfig {
  const fontNames = (settings?.nameplate?.allowedFonts || []).map((entry) => entry?.font?.trim() || '').filter(Boolean)
  const fonts = fontNames.length && !(fontNames.length === LEGACY_FONTS.length && fontNames.every((name, index) => name.toLowerCase() === LEGACY_FONTS[index]))
    ? fontNames.map(fontFromName)
    : FALLBACK_FONTS

  const configuredColours = (settings?.nameplate?.colours || [])
    .map((entry) => ({ name: entry?.name?.trim() || '', hex: entry?.hex?.trim() || '' }))
    .filter((entry) => entry.name && /^#[0-9a-f]{3,8}$/i.test(entry.hex))
  const colours = configuredColours.length && !(configuredColours.length === LEGACY_COLOURS.length && configuredColours.every((entry, index) => entry.name.toLowerCase() === LEGACY_COLOURS[index]))
    ? configuredColours
    : FALLBACK_COLOURS

  const maxCharacters = Math.max(1, Math.min(60, Math.floor(settings?.nameplate?.maxCharacters || 20)))
  return { items: BRIEF_ITEMS, fonts, colours, maxCharacters }
}

export function clampQuantity(value: number) {
  return Math.max(1, Math.min(500, Number.isFinite(value) ? Math.floor(value) : 1))
}

/** Formats an ISO date input value without letting the timezone shift the day. */
export function formatNeededBy(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return value.trim()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[Number(match[2]) - 1]
  if (!month) return value.trim()
  return `${Number(match[3])} ${month} ${match[1]}`
}

export function buildBriefMessage(input: {
  item: Pick<BriefItem, 'id' | 'label' | 'text' | 'photo'>
  text: string
  font: string
  baseColour: string
  textColour: string
  quantity: number
  note: string
  neededBy: string
  activeOfferText?: string | null
}): string {
  const rows = [`Hi Cobraa 3D! I'd like to start a custom order.`, '', `• Item: ${input.item.label}`]
  if (input.item.text) rows.push(`• Text: ${input.text.trim() ? `"${input.text.trim()}"` : 'not decided yet'}`, `• Font: ${input.font}`)
  if (input.item.photo) rows.push("• Photo: I'll share it in this chat")
  rows.push(`• Colour: ${input.baseColour}, text ${input.textColour}`)
  rows.push(`• Quantity: ${input.quantity}`)
  if (input.note.trim()) rows.push(`• ${input.item.id === 'other' ? 'Idea' : input.item.photo ? 'Photo size' : 'Notes'}: ${input.note.trim()}`)
  if (input.neededBy.trim()) rows.push(`• Needed by: ${formatNeededBy(input.neededBy)}`)
  if (input.activeOfferText?.trim()) rows.push(`• Offer: ${input.activeOfferText.trim()}`)
  rows.push('', 'Could you confirm feasibility, price and timeline?')
  return rows.join('\n')
}
