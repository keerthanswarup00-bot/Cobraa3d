export type StudioFontFamily = 'display' | 'sans' | 'serif' | 'mono'

/**
 * The four faces the studio offers as static Latin TTF files. The weights
 * match the web fonts the site already loads, so the extruded text and the
 * CSS preview read as the same piece.
 */
export const FONT_FILES: Record<StudioFontFamily, string> = {
  display: '/fonts/bricolage-grotesque-bold-latin.ttf',
  sans: '/fonts/dm-sans-semibold-latin.ttf',
  serif: '/fonts/dm-serif-display-latin.ttf',
  mono: '/fonts/dm-mono-medium-latin.ttf',
}

/** The browser stack used when a name is drawn on a canvas instead. */
export const FONT_STACKS: Record<StudioFontFamily, { stack: string; weight: number }> = {
  display: { stack: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', weight: 700 },
  sans: { stack: '"DM Sans", system-ui, -apple-system, sans-serif', weight: 600 },
  serif: { stack: '"DM Serif Display", Georgia, "Times New Roman", serif', weight: 400 },
  mono: { stack: '"DM Mono", ui-monospace, "SFMono-Regular", monospace', weight: 500 },
}
