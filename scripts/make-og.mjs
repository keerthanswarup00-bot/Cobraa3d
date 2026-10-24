// Builds public/share-default.jpg: the 1200x630 preview shown when the home page (or any page without its own
// image) is shared. Brand logo on the site's off-white, so it is readable, unlike a black logo on a dark background.
// Run: node scripts/make-og.mjs
import sharp from 'sharp'
import { join } from 'path'

const W = 1200
const H = 630
const logo = await sharp(join('public', 'cobraa-studio-logo.png'))
  .resize({ width: 600, height: 320, fit: 'inside' })
  .toBuffer()

await sharp({ create: { width: W, height: H, channels: 3, background: '#f6f5f1' } })
  .composite([{ input: logo, gravity: 'centre' }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(join('public', 'share-default.jpg'))
console.log('created public/share-default.jpg')
