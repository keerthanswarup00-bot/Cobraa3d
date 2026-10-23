#!/usr/bin/env node
/**
 * Reports the JavaScript a visitor downloads before the page is interactive.
 *
 * Next 16 no longer prints "First Load JS" in the build output, so we read the
 * prerendered home page, follow every script it asks for and add up the bytes
 * that are actually sent over the wire. Lazy chunks are not counted because
 * they are not in the HTML.
 *
 *   node scripts/measure-first-load.mjs
 */
import { gzipSync } from 'node:zlib'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const page = process.argv[2] || '.next/server/app/index.html'
const htmlPath = join(root, page)

if (!existsSync(htmlPath)) {
  console.error(`No prerendered page at ${page}. Run the build first.`)
  process.exit(1)
}

const html = readFileSync(htmlPath, 'utf8')
const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1])

let raw = 0
let gzip = 0
const files = []

for (const source of sources) {
  const path = join(root, '.next', source.replace(/^\/_next\//, ''))
  if (!existsSync(path)) continue
  const body = readFileSync(path)
  raw += statSync(path).size
  gzip += gzipSync(body, { level: 9 }).length
  files.push({ source, bytes: statSync(path).size })
}

console.log(`First Load JS for ${page}`)
for (const file of files) console.log(`  ${(file.bytes / 1024).toFixed(1).padStart(7)} kB  ${file.source}`)
console.log(`  ${'-'.repeat(9)}`)
console.log(`  ${(raw / 1024).toFixed(1).padStart(7)} kB  raw`)
console.log(`  ${(gzip / 1024).toFixed(1).padStart(7).padStart(7)} kB  gzip`)
