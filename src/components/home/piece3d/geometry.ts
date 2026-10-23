import * as THREE from 'three'

export type PieceKind = 'plate' | 'key' | 'lamp' | 'stand' | 'easel' | 'block'

export type PieceFace = {
  width: number
  height: number
  x: number
  y: number
  z: number
}

export type PieceBuild = {
  group: THREE.Group
  base: THREE.MeshStandardMaterial
  text: THREE.MeshStandardMaterial
  face: PieceFace | null
}

type MaterialOptions = {
  baseColour: string
  textColour: string
  bumpMap: THREE.Texture | null
}

const ROUGHNESS = 0.55

function surfaceMaterial(colour: string, bumpMap: THREE.Texture | null) {
  const material = new THREE.MeshStandardMaterial({ color: colour, roughness: ROUGHNESS, metalness: 0 })
  if (bumpMap) {
    material.bumpMap = bumpMap
    material.bumpScale = 0.014
  }
  return material
}

function roundedRect(width: number, height: number, radius: number) {
  const shape = new THREE.Shape()
  const halfWidth = width / 2
  const halfHeight = height / 2
  const corner = Math.min(radius, halfWidth, halfHeight)
  shape.moveTo(-halfWidth + corner, -halfHeight)
  shape.lineTo(halfWidth - corner, -halfHeight)
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner)
  shape.lineTo(halfWidth, halfHeight - corner)
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight)
  shape.lineTo(-halfWidth + corner, halfHeight)
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner)
  shape.lineTo(-halfWidth, -halfHeight + corner)
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight)
  return shape
}

function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  })
  geometry.center()
  geometry.computeVertexNormals()
  return geometry
}

/** A nameplate: a rounded rectangle with a raised name on the front. */
function buildPlate(base: THREE.MeshStandardMaterial, text: THREE.MeshStandardMaterial): PieceBuild {
  const geometry = extrude(roundedRect(6, 2, 0.32), 0.34, 0.05)
  const mesh = new THREE.Mesh(geometry, base)
  const group = new THREE.Group()
  group.add(mesh)
  return { group, base, text, face: { width: 5.1, height: 1.25, x: 0, y: 0, z: 0.22 } }
}

/** A keychain: a smaller plate with a hole and a ring through it. */
function buildKey(base: THREE.MeshStandardMaterial, text: THREE.MeshStandardMaterial): PieceBuild {
  const shape = roundedRect(3.5, 1.5, 0.3)
  const hole = new THREE.Path()
  hole.absarc(-1.28, 0.4, 0.17, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geometry = extrude(shape, 0.3, 0.04)
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geometry, base))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 8, 24), base)
  ring.position.set(-1.28, 0.4, 0.02)
  group.add(ring)
  return { group, base, text, face: { width: 2.1, height: 0.62, x: 0.4, y: 0, z: 0.19 } }
}

/** A lamp: a turned profile that reads as a lamp with a shade. */
function buildLamp(base: THREE.MeshStandardMaterial, text: THREE.MeshStandardMaterial): PieceBuild {
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1, 0),
    new THREE.Vector2(1.02, 0.22),
    new THREE.Vector2(0.66, 0.72),
    new THREE.Vector2(0.56, 1.5),
    new THREE.Vector2(0.76, 2.2),
    new THREE.Vector2(0.46, 2.62),
    new THREE.Vector2(0.5, 2.9),
    new THREE.Vector2(1.06, 3.24),
    new THREE.Vector2(0.94, 3.42),
    new THREE.Vector2(0, 3.42),
  ]
  const geometry = new THREE.LatheGeometry(profile, 48)
  geometry.computeVertexNormals()
  let length = 0
  for (let index = 1; index < profile.length; index += 1) length += profile[index]!.distanceTo(profile[index - 1]!)
  const uv = geometry.getAttribute('uv')
  for (let index = 0; index < uv.count; index += 1) uv.setY(index, uv.getY(index) * length)
  uv.needsUpdate = true
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geometry, base))
  return { group, base, text, face: null }
}

/** A phone stand: an extruded side profile with a slot for the phone. */
function buildStand(base: THREE.MeshStandardMaterial, text: THREE.MeshStandardMaterial): PieceBuild {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(0, 0.45)
  shape.lineTo(0.55, 0.45)
  shape.lineTo(1.95, 2.95)
  shape.lineTo(2.2, 2.95)
  shape.lineTo(2.85, 0)
  shape.closePath()
  const lean = new THREE.Vector2(1.4, 2.5).normalize()
  const inward = new THREE.Vector2(lean.y, -lean.x)
  const slot = new THREE.Path()
  const start = new THREE.Vector2(0.55, 0.45).addScaledVector(lean, 0.6).addScaledVector(inward, 0.18)
  const end = new THREE.Vector2(0.55, 0.45).addScaledVector(lean, 2.1).addScaledVector(inward, 0.18)
  const thin = 0.17
  slot.moveTo(start.x, start.y)
  slot.lineTo(end.x, end.y)
  slot.lineTo(end.x - inward.x * thin, end.y - inward.y * thin)
  slot.lineTo(start.x - inward.x * thin, start.y - inward.y * thin)
  slot.closePath()
  shape.holes.push(slot)
  const geometry = extrude(shape, 3.9, 0.05)
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geometry, base))
  return { group, base, text, face: null }
}

/** A photo stand: a leaning board with a back leg and a ledge. */
function buildEasel(base: THREE.MeshStandardMaterial, text: THREE.MeshStandardMaterial): PieceBuild {
  const group = new THREE.Group()
  const board = new THREE.Mesh(extrude(roundedRect(3.4, 4.4, 0.26), 0.22, 0.05), base)
  board.position.set(0, 2.15, 0.18)
  board.rotation.x = -0.17
  group.add(board)
  const leg = new THREE.Mesh(extrude(roundedRect(3.1, 3.7, 0.26), 0.2, 0.05), base)
  leg.position.set(0, 1.8, -0.72)
  leg.rotation.x = 0.3
  group.add(leg)
  const ledge = new THREE.Mesh(extrude(roundedRect(3.4, 0.42, 0.16), 0.34, 0.05), base)
  ledge.position.set(0, 0.62, 0.4)
  ledge.rotation.x = -0.17
  group.add(ledge)
  return { group, base, text, face: null }
}

/** A gift or an idea we have not drawn yet: a soft rounded block. */
function buildBlock(base: THREE.MeshStandardMaterial, text: THREE.MeshStandardMaterial): PieceBuild {
  const geometry = extrude(roundedRect(3.6, 3.6, 0.55), 2, 0.35)
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geometry, base))
  return { group, base, text, face: { width: 2.5, height: 1, x: 0, y: 0, z: 1.35 } }
}

export function buildPiece(kind: PieceKind, options: MaterialOptions): PieceBuild {
  const base = surfaceMaterial(options.baseColour, options.bumpMap)
  const text = surfaceMaterial(options.textColour, null)
  if (kind === 'key') return buildKey(base, text)
  if (kind === 'lamp') return buildLamp(base, text)
  if (kind === 'stand') return buildStand(base, text)
  if (kind === 'easel') return buildEasel(base, text)
  if (kind === 'block') return buildBlock(base, text)
  return buildPlate(base, text)
}
