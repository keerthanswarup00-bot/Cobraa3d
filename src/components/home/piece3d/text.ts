import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js'
import { FONT_FILES, FONT_STACKS, type StudioFontFamily } from './fonts'
import type { PieceFace } from './geometry'

const loaded = new Map<StudioFontFamily, any>()

/** Loads one of the four studio faces, once per family. */
export function loadStudioFont(family: StudioFontFamily) {
  const cached = loaded.get(family)
  if (cached) return cached
  const promise = new Promise<any>((resolve, reject) => {
    new (TTFLoader as any)().load(FONT_FILES[family], (font: any) => {
      // TTFLoader returns a font object compatible with FontLoader/Extrude
      if (font && font.generateShapes) resolve(font)
      else resolve(font)
    }, undefined, reject)
  }).catch((error) => {
    loaded.delete(family)
    throw error
  })
  loaded.set(family, promise)
  return promise
}

/** Extrudes a name and fits it to the face of the piece. */
export function buildExtrudedText(value: string, font: any, face: PieceFace) {
  const geometry = new (TextGeometry as any)(value, { font, size: 1, depth: 0.075, curveSegments: 6, bevelEnabled: false })
  geometry.computeBoundingBox()
  const first = geometry.boundingBox!
  const width = Math.max(first.max.x - first.min.x, 0.0001)
  const height = Math.max(first.max.y - first.min.y, 0.0001)
  const scale = Math.min(face.width / width, face.height / height)
  geometry.scale(scale, scale, 1)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  geometry.translate(face.x - (box.min.x + box.max.x) / 2, face.y - (box.min.y + box.max.y) / 2, 0)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Draws a name with the browser's own shaping, for any script we cannot
 * extrude. The canvas is white on transparent, so the material colour paints
 * it and the same texture lifts the letters off the face.
 */
export function buildCanvasText(value: string, family: StudioFontFamily, face: PieceFace) {
  const width = 1024
  const height = Math.max(160, Math.round(width * (face.height / face.width)))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('The browser cannot draw on a canvas')
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const { stack, weight } = FONT_STACKS[family]
  context.font = `${weight} ${Math.round(height * 0.64)}px ${stack}`
  context.fillText(value, width / 2, height / 2, width * 0.92)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  const geometry = new THREE.PlaneGeometry(face.width, face.height)
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.05,
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
    transparent: true,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geometry, material)
  return { mesh, material, texture }
}
