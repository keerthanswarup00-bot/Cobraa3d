// @vitest-environment node
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { composeShareImage, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH } from '@/lib/shareImage'

const BG = { r: 0xf6, g: 0xf5, b: 0xf1 }

async function pixel(jpeg: Buffer, x: number, y: number) {
  const { data, info } = await sharp(jpeg).raw().toBuffer({ resolveWithObject: true })
  const i = (y * info.width + x) * info.channels
  return { r: data[i], g: data[i + 1], b: data[i + 2] }
}
const near = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, tolerance = 6) =>
  Math.abs(a.r - b.r) <= tolerance && Math.abs(a.g - b.g) <= tolerance && Math.abs(a.b - b.b) <= tolerance
const solid = (width: number, height: number, background: string) => sharp({ create: { width, height, channels: 3, background } })

describe('product share image', () => {
  it('turns a portrait WebP photo into a 1200x630 JPEG under the size WhatsApp accepts', async () => {
    // a smooth gradient is a fair stand-in for a studio product photo
    const gradient = Buffer.from(Array.from({ length: 800 * 1000 * 3 }, (_, i) => Math.floor(((i / 3) % 800) / 800 * 255)))
    const webp = await sharp(gradient, { raw: { width: 800, height: 1000, channels: 3 } }).webp().toBuffer()
    const out = await composeShareImage(webp)
    const meta = await sharp(out).metadata()
    expect([meta.format, meta.width, meta.height]).toEqual(['jpeg', SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT])
    expect(out.length).toBeLessThan(300 * 1024)
  })

  it('shows the whole portrait photo with even margins, never cropped or stretched', async () => {
    const out = await composeShareImage(await solid(400, 1000, '#cc2222').png().toBuffer())
    expect(near(await pixel(out, 600, 315), { r: 0xcc, g: 0x22, b: 0x22 })).toBe(true) // photo in the middle
    expect(near(await pixel(out, 600, 20), BG)).toBe(true) // margin above
    expect(near(await pixel(out, 600, 610), BG)).toBe(true) // margin below
    expect(near(await pixel(out, 100, 315), BG)).toBe(true) // empty side, not a stretched photo
    expect(near(await pixel(out, 600, 50), { r: 0xcc, g: 0x22, b: 0x22 })).toBe(true) // photo reaches the top margin edge
  })

  it('puts transparent PNGs on the off-white background instead of black', async () => {
    const png = await sharp({ create: { width: 600, height: 300, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await solid(100, 100, '#2244cc').png().toBuffer(), gravity: 'centre' }]).png().toBuffer()
    const out = await composeShareImage(png)
    expect(near(await pixel(out, 5, 5), BG)).toBe(true)
    expect(near(await pixel(out, 600, 315), { r: 0x22, g: 0x44, b: 0xcc })).toBe(true)
  })

  it('enlarges very small photos so the preview is not a speck', async () => {
    const out = await composeShareImage(await solid(40, 40, '#22aa44').png().toBuffer())
    expect(near(await pixel(out, 600, 100), { r: 0x22, g: 0xaa, b: 0x44 })).toBe(true)
  })

  it('handles the SVG placeholders used by the sample catalogue', async () => {
    const out = await composeShareImage(readFileSync('public/sample-images/led-lamp.svg'))
    expect((await sharp(out).metadata()).width).toBe(SHARE_IMAGE_WIDTH)
  })

  it('rejects data that is not an image so the route can fall back to the default preview', async () => {
    await expect(composeShareImage(Buffer.from('not an image'))).rejects.toThrow()
  })
})
