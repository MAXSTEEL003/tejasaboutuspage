import * as THREE from 'three'

/**
 * High-fidelity procedural textures for real Basmati rice:
 * 1. Albedo (diffuseMap):
 *    - Translucent vitreous ivory base
 *    - Central "chalky belly" (starchy cloudy core)
 *    - Longitudinal milling striations running along the length
 *    - Warm amber-cream germ notch at the embryo base
 *    - Crystalline micro-flecking (starch granules)
 * 2. BumpMap:
 *    - Fine longitudinal milling grooves and micro-ridges
 * 3. RoughnessMap:
 *    - Polished waxy outer sheen with subtle micro-roughness in chalky starchy zones
 */
export function makeRiceGrainMaps() {
  const W = 1024
  const H = 512

  // 1. Diffuse / Albedo Canvas
  const diffCv = document.createElement('canvas')
  diffCv.width = W
  diffCv.height = H
  const dCtx = diffCv.getContext('2d')!

  // 2. Bump / Relief Canvas
  const bumpCv = document.createElement('canvas')
  bumpCv.width = W
  bumpCv.height = H
  const bCtx = bumpCv.getContext('2d')!

  // 3. Roughness Canvas
  const roughCv = document.createElement('canvas')
  roughCv.width = W
  roughCv.height = H
  const rCtx = roughCv.getContext('2d')!

  // Base background fill: translucent ivory tone
  dCtx.fillStyle = '#f7f4ed'
  dCtx.fillRect(0, 0, W, H)

  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)

  rCtx.fillStyle = '#383838' // ~0.22 base roughness
  rCtx.fillRect(0, 0, W, H)

  // Seeded deterministic PRNG for stable textures
  let seed = 8821
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Draw Central "Chalky Belly" (the starchy white core typical of real rice grains)
  const coreGrad = dCtx.createRadialGradient(W * 0.48, H * 0.5, 30, W * 0.48, H * 0.5, W * 0.38)
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  coreGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)')
  coreGrad.addColorStop(0.7, 'rgba(252, 248, 238, 0.4)')
  coreGrad.addColorStop(1, 'rgba(247, 244, 237, 0.0)')
  dCtx.fillStyle = coreGrad
  dCtx.beginPath()
  dCtx.ellipse(W * 0.48, H * 0.5, W * 0.36, H * 0.38, 0, 0, Math.PI * 2)
  dCtx.fill()

  // Chalky zone has slightly higher roughness
  const rCoreGrad = rCtx.createRadialGradient(W * 0.48, H * 0.5, 20, W * 0.48, H * 0.5, W * 0.35)
  rCoreGrad.addColorStop(0, 'rgba(100, 100, 100, 0.7)') // ~0.35 roughness
  rCoreGrad.addColorStop(1, 'rgba(56, 56, 56, 0.0)')
  rCtx.fillStyle = rCoreGrad
  rCtx.beginPath()
  rCtx.ellipse(W * 0.48, H * 0.5, W * 0.35, H * 0.35, 0, 0, Math.PI * 2)
  rCtx.fill()

  // Germ end / Embryo notch (left side, X < 0.16): subtle warm golden-ivory tint
  const germGrad = dCtx.createLinearGradient(0, 0, W * 0.18, 0)
  germGrad.addColorStop(0, 'rgba(235, 214, 172, 0.85)')
  germGrad.addColorStop(0.6, 'rgba(244, 230, 200, 0.45)')
  germGrad.addColorStop(1, 'rgba(247, 244, 237, 0.0)')
  dCtx.fillStyle = germGrad
  dCtx.fillRect(0, 0, W * 0.18, H)

  // Apical tip (right side, X > 0.84): glassy translucent clear taper
  const tipGrad = dCtx.createLinearGradient(W * 0.82, 0, W, 0)
  tipGrad.addColorStop(0, 'rgba(247, 244, 237, 0.0)')
  tipGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)')
  tipGrad.addColorStop(1, 'rgba(242, 238, 228, 0.7)')
  dCtx.fillStyle = tipGrad
  dCtx.fillRect(W * 0.82, 0, W * 0.18, H)

  // Generate longitudinal milling striations and micro-granule crystalline noise
  const diffImg = dCtx.getImageData(0, 0, W, H)
  const bumpImg = bCtx.getImageData(0, 0, W, H)
  const roughImg = rCtx.getImageData(0, 0, W, H)

  const dData = diffImg.data
  const bData = bumpImg.data
  const rData = roughImg.data

  // Longitudinal lines along X axis (parallel to the grain length)
  const striationLines = new Float32Array(H)
  for (let y = 0; y < H; y++) {
    striationLines[y] = (rand() - 0.5) * 0.22 + Math.sin(y * 0.4) * 0.06
  }

  for (let y = 0; y < H; y++) {
    const s = striationLines[y]
    const rowOffset = y * W * 4
    for (let x = 0; x < W; x++) {
      const idx = rowOffset + x * 4

      // Longitudinal grain wave + micro starch speckles
      const fineNoise = (rand() - 0.5) * 0.08
      const microGranule = rand() > 0.96 ? 0.16 : (rand() < 0.04 ? -0.1 : 0)
      const longitudinalWave = Math.sin(x * 0.035) * 0.02 + s
      const totalGrain = longitudinalWave + fineNoise + microGranule

      // Diffuse modulation: subtle variation in brightness
      const dShift = Math.floor(totalGrain * 38)
      dData[idx] = Math.min(255, Math.max(0, dData[idx] + dShift))
      dData[idx + 1] = Math.min(255, Math.max(0, dData[idx + 1] + dShift))
      dData[idx + 2] = Math.min(255, Math.max(0, dData[idx + 2] + Math.floor(dShift * 0.85)))

      // Bump map: 128 is neutral grey, higher is raised ridge
      const bVal = Math.min(255, Math.max(0, Math.floor(128 + totalGrain * 70)))
      bData[idx] = bVal
      bData[idx + 1] = bVal
      bData[idx + 2] = bVal

      // Roughness map: slight modulation along milling lines
      const rShift = Math.floor(totalGrain * 22)
      rData[idx] = Math.min(255, Math.max(0, rData[idx] + rShift))
      rData[idx + 1] = Math.min(255, Math.max(0, rData[idx + 1] + rShift))
      rData[idx + 2] = Math.min(255, Math.max(0, rData[idx + 2] + rShift))
    }
  }

  dCtx.putImageData(diffImg, 0, 0)
  bCtx.putImageData(bumpImg, 0, 0)
  rCtx.putImageData(roughImg, 0, 0)

  const diffuseMap = new THREE.CanvasTexture(diffCv)
  diffuseMap.colorSpace = THREE.SRGBColorSpace
  diffuseMap.wrapS = THREE.RepeatWrapping
  diffuseMap.wrapT = THREE.ClampToEdgeWrapping
  diffuseMap.anisotropy = 8

  const bumpMap = new THREE.CanvasTexture(bumpCv)
  bumpMap.wrapS = THREE.RepeatWrapping
  bumpMap.wrapT = THREE.ClampToEdgeWrapping
  bumpMap.anisotropy = 8

  const roughnessMap = new THREE.CanvasTexture(roughCv)
  roughnessMap.wrapS = THREE.RepeatWrapping
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping
  roughnessMap.anisotropy = 8

  return { diffuseMap, bumpMap, roughnessMap }
}

let cachedMaps: ReturnType<typeof makeRiceGrainMaps> | null = null
export function getRiceGrainMaps() {
  if (!cachedMaps) {
    cachedMaps = makeRiceGrainMaps()
  }
  return cachedMaps
}

/**
 * Creates anatomically accurate Basmati rice grain geometry:
 * - Elongated slender body (~4.2 length:breadth ratio)
 * - Posterior embryo/germ end has the characteristic oblique milled slant facet
 * - Apical tip is gracefully tapered and rounded
 * - Dorsal spine is convexly arched; ventral belly is slightly flatter with a gentle furrow
 * - Elliptical cross-section (Z-axis compression ~0.80)
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
    let r = Math.pow(Math.sin(Math.PI * t), 0.68) * (0.88 + 0.22 * (1 - t))

    // Subtle natural thickness variation
    if (t < 0.15) {
      r *= 0.65 + 0.35 * (t / 0.15)
    } else if (t > 0.85) {
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
  const glassyWhite = new THREE.Color(0.98, 0.98, 0.99)
  const chalkyBelly = new THREE.Color(1.0, 1.0, 1.0)
  const germWarmTint = new THREE.Color(0.94, 0.86, 0.72)
  const c = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) // -0.5 (germ) to +0.5 (tip)
    let y = pos.getY(i)
    let z = pos.getZ(i) * 0.80 // Natural elliptical flattening

    const t = x + 0.5 // 0.0 at germ, 1.0 at tip
    const s = Math.sin(Math.PI * Math.min(1, Math.max(0, t)))

    // 1. Natural dorsal/ventral asymmetry
    const isVentral = y < 0
    if (isVentral) {
      const furrow = Math.exp(-Math.pow(z * 4.2, 2)) * 0.08 * s
      y += furrow * 0.5
    }

    // 2. Spine arc: gentle bowing along length
    const arc = Math.sin(Math.PI * t) * 0.04
    y += arc

    // 3. Characteristic oblique germ/embryo notch at posterior end (t < 0.22)
    if (t < 0.22) {
      const notchFactor = (0.22 - t) / 0.22
      const cut = Math.max(0, y + z * 0.5) * notchFactor * 0.32
      y -= cut
      x += notchFactor * 0.03
    }

    if (isInnerCore) {
      x *= 0.92
      y *= 0.78
      z *= 0.78
    }

    pos.setXYZ(i, x, y, z)

    // 4. Vertex color calculation for translucency & chalky belly:
    const distFromAxis = Math.hypot(y, z) / (0.5 * Math.max(0.1, s))
    const isCore = Math.max(0, 1 - distFromAxis * 1.3)

    c.copy(glassyWhite).lerp(chalkyBelly, isCore * 0.7)

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
  useMap?: boolean
}

/**
 * Creates photorealistic translucent MeshPhysicalMaterial:
 * - Real optical transmission for light passing through the grain volume
 * - Realistic albedo map with chalky core, striations, and germ tint
 * - Bump map for fine milling ridges
 * - Roughness map for waxy silky sheen with matte starchy core
 * - IOR 1.51 for organic starch crystal refraction
 */
export function makeGrainMaterial(options: string | GrainMaterialOptions = '#f6edd6') {
  const opt: GrainMaterialOptions = typeof options === 'string' ? { color: options } : options
  const baseColor = opt.color ? new THREE.Color(opt.color) : new THREE.Color('#faf6ee')

  const { diffuseMap, bumpMap, roughnessMap } = getRiceGrainMaps()

  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    vertexColors: true,
    map: diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.18,
    roughnessMap: roughnessMap,
    roughness: opt.roughness ?? 0.20, // Silky smooth waxy surface
    metalness: 0.0,
    transmission: opt.transmission ?? 0.76, // High optical translucency
    thickness: opt.thickness ?? 1.5, // Volume depth for light refraction & absorption
    ior: opt.ior ?? 1.51, // Organic starch crystal index of refraction
    attenuationColor: new THREE.Color('#fdf7ea'), // Milky warm-white internal scatter
    attenuationDistance: 0.85,
    specularIntensity: 1.0,
    specularColor: new THREE.Color('#ffffff'),
    clearcoat: 0.48,
    clearcoatRoughness: 0.24,
    sheen: 0.80,
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.35,
    transparent: opt.transparent ?? true,
    opacity: opt.opacity ?? 0.98,
    depthWrite: true,
  })
}

/**
 * Dedicated internal chalky core material (gives internal depth inside the translucent shell)
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
