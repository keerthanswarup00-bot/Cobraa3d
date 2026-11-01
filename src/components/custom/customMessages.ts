export type CustomMessageKind = 'general' | 'name' | 'nfc' | 'qr'

const brandName = (brand?: string | null) => brand?.trim() || 'Cobraa 3D'

/**
 * Opening messages for the /custom landing page. Kept in one place so phase 2
 * can add pre-filled design details without changing the CTA markup.
 */
export function customMessage(kind: CustomMessageKind, brand?: string | null): string {
  const name = brandName(brand)
  switch (kind) {
    case 'name':
      return `Hi ${name}, I'd like a custom name keychain made.`
    case 'nfc':
      return `Hi ${name}, I'd like a custom NFC tag keychain made.`
    case 'qr':
      return `Hi ${name}, I'd like a custom QR code keychain made.`
    case 'general':
    default:
      return `Hi ${name}, I'd like a custom 3D printed object made.`
  }
}
