import sharp from 'sharp'
import { SHARE_IMAGE_BACKGROUND, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH } from './shareImage-constants'

export { SHARE_IMAGE_BACKGROUND, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH }
const PADDING = 32

/**
 * Turns any product photo (WebP, PNG, JPEG, SVG, any shape or size) into a 1200x630 JPEG: the whole photo, centred
 * on the off-white background with an even margin, never cropped or stretched.
 *
 * The output is JPEG on purpose. Link-preview crawlers handle it everywhere, and it keeps the file well under the
 * size limits that make WhatsApp drop a preview image. Photos are stored as WebP, which next/og cannot render,
 * so previews are composed here with sharp instead.
 */
export async function composeShareImage(source: Buffer): Promise<Buffer> {
  const photo = await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({ width: SHARE_IMAGE_WIDTH - PADDING * 2, height: SHARE_IMAGE_HEIGHT - PADDING * 2, fit: 'inside' })
    .toBuffer()
  return sharp({ create: { width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT, channels: 3, background: SHARE_IMAGE_BACKGROUND } })
    .composite([{ input: photo, gravity: 'centre' }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer()
}
