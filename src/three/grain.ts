import * as THREE from 'three'

/**
 * Procedural micro-texture for raw polished rice grain:
 * - Ultra-fine longitudinal striations (milling grooves along the length)
 * - Micro-crystalline starch granules (subtle speckling)
 * - Subtle chalky core density
 */
function makeRiceGrainTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = 256
  const ctx = cv.getContext('2d')!

  // Neutral base
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, cv.width, cv.height)

  const imgData = ctx.getImageData(0, 0, cv.width, cv.height)
  const data = imgData.data

  // Deterministic seed for reproducible grain surface
  let seed = 42
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Generate longitudinal milling grooves along X axis
  const striations = new Float32Array(cv.height)
  for (let y = 0; y < cv.height; y++) {
    striations[y] = (rand() - 0.5) * 0.18 + Math.sin(y * 0.85) * 0.05
  }

  for (let y = 0; y < cv.height; y++) {
    const s = striations[y]
    const rowOffset = y * cv.width * 4
    for (let x = 0; x < cv.width; x++) {
      // Long-frequency wave + high-frequency starch speckle
      const fineNoise = (rand() - 0.5) * 0.12
      const starchyGrain = (rand() > 0.94 ? 0.18 : 0) + (rand() < 0.06 ? -0.12 : 0)
      const longitudinal = Math.sin(x * 0.04) * 0.02 + s
      const val = Math.min(1, Math.max(0, 0.5 + longitudinal + fineNoise + starchyGrain))

      const idx = rowOffset + x * 4
      const b = Math.floor(val * 255)
      data[idx] = b
      data[idx + 1] = b
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 2)
  return tex
}

let cachedGrainTexture: THREE.CanvasTexture | null = null
function getGrainTexture() {
  if (!cachedGrainTexture) {
    cachedGrainTexture = makeRiceGrainTexture()
  }
  return cachedGrainTexture
}

/**
 * Creates anatomically accurate Basmati rice grain geometry:
 * - Elongated slender body (~4.2 length:breadth ratio)
 * - Posterior embryo/germ end has the characteristic oblique milled slant facet
 * - Apical tip is gracefully tapered and rounded
 * - Dorsal spine is convexly arched; ventral belly is slightly flatter with a gentle furrow
 * - Slightly flattened elliptical cross-section (Z-axis compression)
 * - Vertex colors define the internal milky chalky core vs translucent vitreous edges and warm germ tip
 */
export function makeGrainGeometry(isInnerCore = false) {
  const N_LATHE = 96
  const N_RAD = 72
  const raw: [number, number][] = []
  let maxR = 0

  for (let i = 0; i <= N_LATHE; i++) {
    const t = i / N_LATHE // 0 (germ end) to 1 (apical tip)
    
    // Asymmetric basmati radius profile along length
    // Germ end (t < 0.18) has oblique notch; middle expands gracefully; tip tapers
    let r = Math.pow(Math.sin(Math.PI * t), 0.68) * (0.88 + 0.22 * (1 - t))

    // Subtle natural thickness variation
    if (t < 0.15) {
      // Germ end taper
      r *= 0.65 + 0.35 * (t / 0.15)
    } else if (t > 0.85) {
      // Apical tip taper
      r *= 0.55 + 0.45 * ((1 - t) / 0.15)
    }

    raw.push([r, t])
    maxR = Math.max(maxR, r)
  }

  // Base profile normalized along X from -0.5 to +0.5
  const pts = raw.map(([r, t]) => new THREE.Vector2((r / maxR) * 0.5, t - 0.5))
  const g = new THREE.LatheGeometry(pts, N_RAD)
  g.rotateZ(-Math.PI / 2) // Orient grain along X axis

  const pos = g.attributes.position
  const col = new Float32Array(pos.count * 3)

  // Color palette based on real polished Basmati rice:
  // - Translucent glassy white for outer envelope
  // - Milky chalky white for the starch core
  // - Warm golden-cream tint for the germ notch
  const glassyWhite = new THREE.Color(0.98, 0.98, 0.99)
  const chalkyBelly = new THREE.Color(1.0, 1.0, 1.0)
  const germWarmTint = new THREE.Color(0.94, 0.86, 0.72)
  const c = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) // -0.5 (germ) to +0.5 (tip)
    let y = pos.getY(i)
    let z = pos.getZ(i) * 0.80 // Natural elliptical flattening (width vs thickness)

    const t = x + 0.5 // 0.0 at germ, 1.0 at tip
    const s = Math.sin(Math.PI * Math.min(1, Math.max(0, t)))

    // 1. Natural dorsal/ventral asymmetry:
    // Dorsal side (y > 0) has gentle convex curvature
    // Ventral side (y < 0) has slight shallow furrow
    const isVentral = y < 0
    if (isVentral) {
      const furrow = Math.exp(-Math.pow(z * 4.2, 2)) * 0.08 * s
      y += furrow * 0.5
    }

    // 2. Spine arc: gentle bowing along length
    const arc = Math.sin(Math.PI * t) * 0.04
    y += arc

    // 3. Characteristic oblique germ/embryo notch at posterior end (t < 0.22):
    // Real basmati rice has an angled bevel cut where the embryo was separated
    if (t < 0.22) {
      const notchFactor = (0.22 - t) / 0.22
      // Angled plane cut across the upper corner of the germ end
      const cut = Math.max(0, y + z * 0.5) * notchFactor * 0.32
      y -= cut
      x += notchFactor * 0.03
    }

    if (isInnerCore) {
      // Shrink slightly for internal chalky core
      x *= 0.92
      y *= 0.78
      z *= 0.78
    }

    pos.setXYZ(i, x, y, z)

    // 4. Vertex color calculation for translucency & chalky belly:
    const distFromAxis = Math.hypot(y, z) / (0.5 * Math.max(0.1, s))
    const isCore = Math.max(0, 1 - distFromAxis * 1.3)

    // Blend between vitreous outer layer and chalky core
    c.copy(glassyWhite).lerp(chalkyBelly, isCore * 0.7)

    // Embryo end warm tint
    if (t < 0.16) {
      const tintAmount = Math.pow((0.16 - t) / 0.16, 1.8) * 0.65
      c.lerp(germWarmTint, tintAmount)
    }

    col[i * 3] = c.r
    col[i * 3 + 1] = c.g
    col[i * 3 + 2] = c.b
  }

  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

export type GrainMaterialOptions = {
  color?: string | THREE.Color
  transmission?: number
  roughness?: number
  thickness?: number
  ior?: number
  opacity?: number
  transparent?: boolean
}

/**
 * Creates high-fidelity translucent MeshPhysicalMaterial:
 * - Real optical transmission for light passing through the grain volume
 * - Accurate refractive index (IOR 1.51 for organic starch endosperm)
 * - Thickness & attenuation distance for organic light absorption
 * - Polished silky waxy sheen and clearcoat
 */
export function makeGrainMaterial(options: string | GrainMaterialOptions = '#f6edd6') {
  const opt: GrainMaterialOptions = typeof options === 'string' ? { color: options } : options
  const baseColor = opt.color ? new THREE.Color(opt.color) : new THREE.Color('#faf6ee')

  const tex = getGrainTexture()

  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    vertexColors: true,
    metalness: 0.0,
    roughness: opt.roughness ?? 0.18, // Silky smooth waxy surface
    transmission: opt.transmission ?? 0.78, // High translucency
    thickness: opt.thickness ?? 1.6, // Volume depth for light refraction & absorption
    ior: opt.ior ?? 1.51, // Organic starch crystal index of refraction
    attenuationColor: new THREE.Color('#fdf7ea'), // Milky warm-white internal scatter
    attenuationDistance: 0.85,
    specularIntensity: 1.0,
    specularColor: new THREE.Color('#ffffff'),
    clearcoat: 0.52,
    clearcoatRoughness: 0.22,
    sheen: 0.75,
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.35,
    bumpMap: tex,
    bumpScale: 0.25,
    transparent: opt.transparent ?? true,
    opacity: opt.opacity ?? 0.98,
    depthWrite: true,
  })
}

/**
 * Dedicated internal chalky core material (gives depth inside the translucent shell)
 */
export function makeGrainCoreMaterial(color = '#fffdf7') {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.65,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
  })
}
