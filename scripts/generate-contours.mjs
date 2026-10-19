import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Deterministic, dependency-free contour line generator. The outputs are SVG masks,
// so the site supplies the light/dark stroke colour with CSS rather than baking it in.
const outputDir = path.resolve('public/contours')
await mkdir(outputDir, { recursive: true })

for (let variant = 0; variant < 8; variant += 1) {
  const paths = []
  for (let line = 0; line < 17; line += 1) {
    const points = []
    const centerX = 600 + Math.sin(variant * 1.1 + line * 0.12) * 185
    const centerY = 400 + Math.cos(variant * 0.8 + line * 0.1) * 115
    const radiusX = 125 + line * 31
    const radiusY = 65 + line * 20
    for (let step = 0; step <= 80; step += 1) {
      const angle = (step / 80) * Math.PI * 2
      const noise = 1 + 0.028 * Math.sin(angle * 3 + variant) + 0.018 * Math.cos(angle * 5 + line * 0.31)
      const x = (centerX + Math.cos(angle) * radiusX * noise).toFixed(1)
      const y = (centerY + Math.sin(angle) * radiusY * noise).toFixed(1)
      points.push(`${step === 0 ? 'M' : 'L'}${x},${y}`)
    }
    paths.push(`<path d="${points.join('')}Z"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".78">${paths.join('')}</svg>`
  await writeFile(path.join(outputDir, `contour-${String(variant + 1).padStart(2, '0')}.svg`), svg)
}
