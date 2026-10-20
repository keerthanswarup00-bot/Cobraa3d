// TEMP: placeholder products, remove when real products are published.
export const TEMP_PRODUCTS = [
  { id: 'nameplate', slug: 'custom-nameplate', name: 'Custom nameplate', tag: 'Personalised', fil: '#e6dcc6', vis: 'plate', sample: 'Maya', featured: true, blurb: 'A personalised 3D-printed nameplate made with your name, preferred font and colour.' },
  { id: 'lamp', slug: 'sculptural-lamp', name: 'Sculptural lamp', tag: 'Home', fil: '#b95a3b', vis: 'lamp', featured: true, blurb: 'A sculptural 3D-printed lamp designed to add a warm, modern touch to your space.' },
  { id: 'stand', slug: 'phone-stand', name: 'Phone stand', tag: 'Desk', fil: '#8ea383', vis: 'stand', featured: true, blurb: 'A practical 3D-printed phone stand for your desk, bedside table or workspace.' },
  { id: 'keychain', slug: 'personalised-keychain', name: 'Personalised keychain', tag: 'Carry', fil: '#e2a725', vis: 'key', sample: 'Aarav', blurb: 'A small, sturdy keychain with your name or initials, in the colour you choose.' },
  { id: 'photo', slug: 'photo-stand', name: 'Photo stand', tag: 'Gift', fil: '#55514c', vis: 'photo', blurb: 'A desk-friendly stand for your favourite print, sized to fit the photo you send.' },
] as const

export type TempProduct = (typeof TEMP_PRODUCTS)[number]
