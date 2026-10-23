/**
 * Text helpers that work for names in any script.
 *
 * A name is not a string of UTF-16 units. "Aarav" is five letters, but a
 * Kannada or Tamil name is made of clusters that must never be cut in half,
 * so we count and trim with grapheme clusters instead of code units.
 */

const segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null

/** Splits a string into grapheme clusters, with a safe fallback for old browsers. */
export function graphemes(value: string): string[] {
  if (!value) return []
  if (!segmenter) return Array.from(value)
  return Array.from(segmenter.segment(value), (entry) => entry.segment)
}

/** Counts how many grapheme clusters a string holds, so "क्ष" counts as one. */
export function countGraphemes(value: string): number {
  return graphemes(value).length
}

/** Cuts a string to a number of grapheme clusters without breaking a letter. */
export function truncateGraphemes(value: string, max: number): string {
  if (max <= 0) return ''
  const parts = graphemes(value)
  if (parts.length <= max) return value
  return parts.slice(0, max).join('')
}

/**
 * The Latin ranges our 3D fonts cover. Anything outside them (Kannada,
 * Devanagari, Tamil, Telugu, Malayalam, Arabic, Cyrillic, emoji) cannot be
 * extruded with a glyph-by-glyph mesh, because that would skip the shaping,
 * joining and right-to-left layout the browser does for us.
 */
const LATIN_RANGES: [number, number][] = [
  [0x0020, 0x007e], // Basic Latin
  [0x00a0, 0x00ff], // Latin-1 Supplement
  [0x0100, 0x017f], // Latin Extended-A
  [0x0180, 0x024f], // Latin Extended-B
  [0x1e00, 0x1eff], // Latin Extended Additional
]

function isLatinCodePoint(code: number) {
  return LATIN_RANGES.some(([start, end]) => code >= start && code <= end)
}

/** The scripts we name in the copy, kept here so the note matches the detection. */
export const SCRIPT_NOTES: { label: string; ranges: [number, number][] }[] = [
  { label: 'Kannada', ranges: [[0x0c80, 0x0cff]] },
  { label: 'Devanagari', ranges: [[0x0900, 0x097f]] },
  { label: 'Tamil', ranges: [[0x0b80, 0x0bff]] },
  { label: 'Telugu', ranges: [[0x0c00, 0x0c7f]] },
  { label: 'Malayalam', ranges: [[0x0d00, 0x0d7f]] },
  { label: 'Arabic', ranges: [[0x0600, 0x06ff], [0x0750, 0x077f], [0x08a0, 0x08ff]] },
  { label: 'Bengali', ranges: [[0x0980, 0x09ff]] },
  { label: 'Gujarati', ranges: [[0x0a80, 0x0aff]] },
  { label: 'Kannada numerals', ranges: [[0x0ce6, 0x0cef]] },
  { label: 'Thai', ranges: [[0x0e00, 0x0e7f]] },
  { label: 'Hebrew', ranges: [[0x0590, 0x05ff]] },
  { label: 'Sinhala', ranges: [[0x0d80, 0x0dff]] },
]

/**
 * Works out whether a name can be built from our extruded Latin fonts.
 * Anything that is not Latin is drawn on a canvas instead, so the browser
 * does the shaping and the text keeps its joinings and its direction.
 */
export function detectScript(value: string): 'latin' | 'other' {
  const trimmed = value.trim()
  if (!trimmed) return 'latin'
  for (const character of trimmed) {
    const code = character.codePointAt(0) ?? 0
    if (!isLatinCodePoint(code)) return 'other'
  }
  return 'latin'
}

/** The name of the script we detected, for logging and tests. */
export function scriptLabel(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const codes = Array.from(trimmed, (character) => character.codePointAt(0) ?? 0)
  for (const script of SCRIPT_NOTES) {
    if (codes.some((code) => script.ranges.some(([start, end]) => code >= start && code <= end))) return script.label
  }
  return 'Other'
}
