import * as THREE from 'three'
import { buildPiece, type PieceBuild, type PieceKind } from './geometry'
import { buildCanvasText, buildExtrudedText, loadStudioFont } from './text'
import type { StudioFontFamily } from './fonts'

export type SceneMemory = { geometries: number; textures: number }

export type SceneOptions = {
  canvas: HTMLCanvasElement
  kind: PieceKind
  text: string
  fontFamily: StudioFontFamily
  baseColour: string
  textColour: string
  useCanvasText: boolean
  reducedMotion: boolean
  onReady: () => void
  onMemory: (memory: SceneMemory) => void
  onInteract: () => void
}

export type PieceScene = {
  setKind: (kind: PieceKind, animate: boolean) => void
  setText: (text: string, useCanvasText: boolean) => void
  setFont: (fontFamily: StudioFontFamily) => void
  setColours: (baseColour: string, textColour: string) => void
  setReducedMotion: (value: boolean) => void
  setSway: (allowed: boolean) => void
  setVisible: (value: boolean) => void
  rotateBy: (radians: number) => void
  resetRotation: () => void
  dispose: () => void
}

const SWEEP_MS = 900
const SWAY_MS = 6000
const SWAY_RADIANS = 5 * Math.PI / 180
const PLATE_LIMIT = 55 * Math.PI / 180
const LAYERS_PER_UNIT = 50

function layerBumpTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 64
  const context = canvas.getContext('2d')!
  for (let row = 0; row < 64; row += 1) {
    const value = Math.round(128 + 110 * Math.cos((row / 8) * Math.PI * 2))
    context.fillStyle = `rgb(${value}, ${value}, ${value})`
    context.fillRect(0, row, 4, 1)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, LAYERS_PER_UNIT / 8)
  return texture
}

export async function createPieceScene(options: SceneOptions): Promise<PieceScene> {
  const { canvas } = options
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.NoToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x2b2622, 1.15))
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.7)
  keyLight.position.set(2.4, 3.2, 2.4)
  scene.add(keyLight)

  const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000)
  renderer.clippingPlanes = [clipPlane]

  const bumpMap = layerBumpTexture()
  let build: PieceBuild | null = null
  let group: THREE.Group | null = null
  let canvasMaterial: THREE.MeshStandardMaterial | null = null
  let baseColour = options.baseColour
  let textColour = options.textColour
  let box = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))
  let geometries: THREE.BufferGeometry[] = []
  let materials: THREE.Material[] = []
  let textures: THREE.Texture[] = []
  let kind = options.kind
  let text = options.text
  let fontFamily = options.fontFamily
  let useCanvasText = options.useCanvasText
  let reducedMotion = options.reducedMotion
  let userRotation = 0
  let velocity = 0
  let resetting = false
  let dragging = false
  let swayAllowed = false
  let swayUntil = 0
  let visible = true
  let sweep: { from: number; to: number; start: number } | null = null
  let request = 0
  let previousTime = 0
  let disposed = false
  let building = false
  let rebuildAgain = false
  let rebuildQueued = false
  let pendingAnimate = false
  let textTimer = 0

  function collect(mesh: THREE.Object3D) {
    mesh.traverse((child) => {
      const m = child as THREE.Mesh
      if ((m as any).isMesh) {
        if (m.geometry) geometries.push(m.geometry)
        if (Array.isArray(m.material)) materials.push(...(m.material as THREE.Material[]))
        else if (m.material) materials.push(m.material as THREE.Material)
      }
      const sprite = child as THREE.Sprite
      if ((sprite as any).isSprite && sprite.material) {
        const mat = Array.isArray(sprite.material) ? sprite.material[0] : sprite.material
        if (mat) materials.push(mat as THREE.Material)
      }
    })
  }

  function disposeBuild() {
    for (const geometry of geometries) {
      if (geometry && typeof geometry.dispose === 'function') geometry.dispose()
    }
    for (const material of materials) {
      if (!material || typeof material.dispose !== 'function') continue
      const mat = material as any
      if (mat.map && typeof mat.map.dispose === 'function') mat.map.dispose()
      if (mat.bumpMap && typeof mat.bumpMap.dispose === 'function') mat.bumpMap.dispose()
      if (mat.roughnessMap && typeof mat.roughnessMap.dispose === 'function') mat.roughnessMap.dispose()
      if (mat.metalnessMap && typeof mat.metalnessMap.dispose === 'function') mat.metalnessMap.dispose()
      material.dispose()
    }
    for (const texture of textures) {
      if (texture && typeof texture.dispose === 'function') texture.dispose()
    }
    geometries = []
    materials = []
    textures = []
    if (group) scene.remove(group)
    group = null
    build = null
  }

  function frame() {
    const size = box.getSize(new THREE.Vector3())
    const vFov = (camera.fov * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
    const distance = Math.max((size.y / 2) / Math.tan(vFov / 2), (size.x / 2) / Math.tan(hFov / 2)) + size.z / 2 + 0.4
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }

  function startSweep() {
    if (reducedMotion) {
      clipPlane.constant = 1000
      return
    }
    const size = box.getSize(new THREE.Vector3())
    sweep = { from: -size.y / 2 - 0.05, to: size.y / 2 + 0.05, start: performance.now() }
    clipPlane.constant = sweep.from
  }

  async function rebuild(animate: boolean) {
    disposeBuild()
    canvasMaterial = null
    const piece = buildPiece(kind, { baseColour, textColour, bumpMap })
    build = piece
    group = piece.group
    collect(group)
    materials.push(piece.base, piece.text)
    scene.add(group)

    const face = piece.face
    if (face && text.trim()) {
      if (useCanvasText) {
        const plane = buildCanvasText(text, fontFamily, face)
        collect(plane.mesh)
        materials.push(plane.material)
        textures.push(plane.texture)
        canvasMaterial = plane.material
        plane.mesh.position.set(face.x, face.y, face.z + 0.004)
        group.add(plane.mesh)
      } else {
        try {
          const font = await loadStudioFont(fontFamily)
          const geometry = buildExtrudedText(text, font, face)
          geometries.push(geometry)
          const mesh = new THREE.Mesh(geometry, piece.text)
          collect(mesh)
          mesh.position.set(face.x, face.y, face.z)
          group.add(mesh)
        } catch {
          const plane = buildCanvasText(text, fontFamily, face)
          collect(plane.mesh)
          materials.push(plane.material)
          textures.push(plane.texture)
          canvasMaterial = plane.material
          plane.mesh.position.set(face.x, face.y, face.z + 0.004)
          group.add(plane.mesh)
        }
      }
    }

    const bounds = new THREE.Box3().setFromObject(group)
    const centre = bounds.getCenter(new THREE.Vector3())
    group.position.sub(centre)
    box = new THREE.Box3().setFromObject(group)
    frame()
    if (animate) startSweep()
    requestRender()
  }

  function reportMemory() {
    options.onMemory({ geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures })
  }

  function requestRender() {
    if (request || disposed || !visible) return
    request = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    request = 0
    const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0.016
    previousTime = now
    let busy = false

    if (sweep) {
      const progress = Math.min(1, (now - sweep.start) / SWEEP_MS)
      const eased = 1 - (1 - progress) ** 3
      clipPlane.constant = sweep.from + (sweep.to - sweep.from) * eased
      busy = true
      if (progress >= 1) sweep = null
    }

    if (resetting) {
      userRotation *= 0.88
      if (Math.abs(userRotation) < 0.002) {
        userRotation = 0
        resetting = false
      }
      busy = true
    }

    if (!dragging && Math.abs(velocity) > 0.0006) {
      userRotation += velocity * delta * 6
      velocity *= 0.93
      busy = true
    }

    if (group) {
      let sway = 0
      if (swayAllowed && !reducedMotion && !dragging && now < swayUntil) {
        sway = Math.sin((now - (swayUntil - SWAY_MS)) / 780) * SWAY_RADIANS
        busy = true
      }
      group.rotation.y = userRotation + sway
    }

    renderer.render(scene, camera)
    reportMemory()
    if (busy) requestRender()
  }

  function clampRotation() {
    if (kind === 'lamp') return
    if (userRotation > PLATE_LIMIT) {
      userRotation = PLATE_LIMIT
      velocity = 0
    }
    if (userRotation < -PLATE_LIMIT) {
      userRotation = -PLATE_LIMIT
      velocity = 0
    }
  }

  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let lastX = 0
  let axis: 'none' | 'x' | 'y' = 'none'
  let lastTap = 0

  function onPointerDown(event: PointerEvent) {
    if (pointerId !== null) return
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    lastX = event.clientX
    axis = 'none'
    velocity = 0
    dragging = true
    canvas.setPointerCapture?.(event.pointerId)
    options.onInteract()
  }

  function onPointerMove(event: PointerEvent) {
    if (pointerId !== event.pointerId) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (axis === 'none') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axis === 'x') {
        options.onInteract()
        resetSway()
      }
    }
    if (axis !== 'x') return
    const step = event.clientX - lastX
    lastX = event.clientX
    userRotation += step * 0.012
    velocity = step * 0.012
    clampRotation()
    requestRender()
  }

  function onPointerUp(event: PointerEvent) {
    if (pointerId !== event.pointerId) return
    pointerId = null
    dragging = false
    canvas.releasePointerCapture?.(event.pointerId)
    const moved = Math.abs(event.clientX - startX) < 14 && Math.abs(event.clientY - startY) < 14
    if (moved) {
      const now = performance.now()
      if (now - lastTap < 320) {
        userRotation = 0
        velocity = 0
        resetting = true
        lastTap = 0
      } else {
        lastTap = now
      }
    }
    requestRender()
  }

  function resetSway() {
    if (!swayAllowed) return
    swayUntil = performance.now() + SWAY_MS
  }

  function resize() {
    const parent = canvas.parentElement
    const width = parent?.clientWidth || canvas.clientWidth
    const height = parent?.clientHeight || canvas.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    frame()
    requestRender()
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas.parentElement || canvas)

  function onVisibility() {
    visible = !document.hidden
    if (visible) requestRender()
  }
  document.addEventListener('visibilitychange', onVisibility)

    canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)

  renderer.domElement.style.touchAction = 'pan-y'

  await runRebuild(true)
  resize()
  options.onReady()

  async function runRebuild(animate: boolean) {
    if (building) {
      rebuildAgain = true
      pendingAnimate = pendingAnimate || animate
      return
    }
    building = true
    try {
      await rebuild(animate)
    } finally {
      building = false
      if (rebuildAgain) {
        rebuildAgain = false
        const next = pendingAnimate
        pendingAnimate = false
        void runRebuild(next)
      }
    }
  }

  function scheduleRebuild(animate: boolean, immediate: boolean) {
    pendingAnimate = pendingAnimate || animate
    if (immediate) {
      window.clearTimeout(textTimer)
      textTimer = 0
      if (rebuildQueued) return
      rebuildQueued = true
      queueMicrotask(() => {
        rebuildQueued = false
        void runRebuild(pendingAnimate)
        pendingAnimate = false
      })
      return
    }
    window.clearTimeout(textTimer)
    textTimer = window.setTimeout(() => {
      textTimer = 0
      void runRebuild(pendingAnimate)
      pendingAnimate = false
    }, 140)
  }

  return {
    setKind(next: PieceKind, animate: boolean) {
      if (next === kind) return
      kind = next
      userRotation = 0
      velocity = 0
      scheduleRebuild(animate, true)
    },
    setText(next: string, nextUseCanvas: boolean) {
      if (next === text && nextUseCanvas === useCanvasText) return
      text = next
      useCanvasText = nextUseCanvas
      scheduleRebuild(false, false)
    },
    setFont(next: StudioFontFamily) {
      if (next === fontFamily) return
      fontFamily = next
      scheduleRebuild(false, true)
    },
    setColours(nextBase: string, nextText: string) {
      baseColour = nextBase
      textColour = nextText
      if (!build) return
      build.base.color.set(baseColour)
      build.text.color.set(textColour)
      canvasMaterial?.color.set(textColour)
      startSweep()
      requestRender()
    },
    setReducedMotion(value: boolean) {
      reducedMotion = value
      if (value) {
        sweep = null
        clipPlane.constant = 1000
        swayUntil = 0
        requestRender()
      }
    },
    setSway(allowed: boolean) {
      swayAllowed = allowed
      if (allowed) resetSway()
      else swayUntil = 0
      requestRender()
    },
    setVisible(value: boolean) {
      visible = value
      if (value) requestRender()
    },
    rotateBy(radians: number) {
      userRotation += radians
      clampRotation()
      resetSway()
      requestRender()
    },
    resetRotation() {
      resetting = true
      requestRender()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(request)
      window.clearTimeout(textTimer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      disposeBuild()
      bumpMap.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
