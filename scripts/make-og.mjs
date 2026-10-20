import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const logoPath = join('public', 'c3d-logo.svg')
const outPath = join('public', 'og-default.png')

try {
  const logo = readFileSync(logoPath)
  const svgBuf = Buffer.from(logo)
  const img = sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } } })
  const resized = await sharp(svgBuf).resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  img.composite([{ input: resized, gravity: 'center' }])
  await img.png().toFile(outPath)
  console.log('created', outPath)
} catch (e) {
  console.error('failed', e)
}
