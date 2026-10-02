import * as THREE from 'three'

/**
 * High-fidelity procedural textures matching the authentic rice grain reference photo:
 * 1. Albedo (diffuseMap):
 *    - Translucent vitreous ivory/white body
 *    - Internal starchy chalky core ("chalky belly")
 *    - Delicate white longitudinal milling striations running along the length
 *    - Warm amber-gold germ remnant at the basal embryo notch (matching "Notched Tip" in reference)
 *    - Micro-crystalline starch speckling
 * 2. BumpMap:
 *    - Fine longitudinal milling grooves and micro-ridges from Sortex stones
 * 3. RoughnessMap:
 *    - Silky smooth waxy outer sheen with subtle micro-roughness in chalky starchy zones
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

  // Base background fill: translucent vitreous ivory tone
  dCtx.fillStyle = '#f8f6f0'
  dCtx.fillRect(0, 0, W, H)

  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, W, H)

  rCtx.fillStyle = '#323232' // ~0.19 base roughness
  rCtx.fillRect(0, 0, W, H)

  // Seeded deterministic PRNG for stable textures
  let seed = 91823
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Draw Central "Chalky Belly" (the starchy white core typical of real rice grains)
  const coreGrad = dCtx.createRadialGradient(W * 0.46, H * 0.5, 20, W * 0.46, H * 0.5, W * 0.38)
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)')
  coreGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.88)')
  coreGrad.addColorStop(0.72, 'rgba(252, 250, 244, 0.45)')
  coreGrad.addColorStop(1, 'rgba(248, 246, 240, 0.0)')
  dCtx.fillStyle = coreGrad
  dCtx.beginPath()
  dCtx.ellipse(W * 0.46, H * 0.5, W * 0.36, H * 0.36, 0, 0, Math.PI * 2)
  dCtx.fill()

  // Chalky core has slightly higher matte roughness
  const rCoreGrad = rCtx.createRadialGradient(W * 0.46, H * 0.5, 20, W * 0.46, H * 0.5, W * 0.35)
  rCoreGrad.addColorStop(0, 'rgba(92, 92, 92, 0.65)')
  rCoreGrad.addColorStop(1, 'rgba(50, 50, 50, 0.0)')
  rCtx.fillStyle = rCoreGrad
  rCtx.beginPath()
  rCtx.ellipse(W * 0.46, H * 0.5, W * 0.35, H * 0.35, 0, 0, Math.PI * 2)
  rCtx.fill()

  // Basal Embryo Notch (left side, X < 0.20): warm golden-amber embryo remnant tint
  const germGrad = dCtx.createRadialGradient(W * 0.08, H * 0.58, 5, W * 0.08, H * 0.58, W * 0.16)
  germGrad.addColorStop(0, 'rgba(218, 178, 110, 0.92)')
  germGrad.addColorStop(0.45, 'rgba(235, 205, 150, 0.65)')
  germGrad.addColorStop(0.8, 'rgba(248, 235, 205, 0.30)')
  germGrad.addColorStop(1, 'rgba(248, 246, 240, 0.0)')
  dCtx.fillStyle = germGrad
  dCtx.beginPath()
  dCtx.arc(W * 0.08, H * 0.58, W * 0.16, 0, Math.PI * 2)
  dCtx.fill()

  // Apical Tip (right side, X > 0.82): smooth, clean translucent white dome
  const tipGrad = dCtx.createLinearGradient(W * 0.80, 0, W, 0)
  tipGrad.addColorStop(0, 'rgba(248, 246, 240, 0.0)')
  tipGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.40)')
  tipGrad.addColorStop(1, 'rgba(245, 242, 235, 0.80)')
  dCtx.fillStyle = tipGrad
  dCtx.fillRect(W * 0.80, 0, W * 0.20, H)

  // Generate dense longitudinal milling striations and micro-crystalline starch texture
  const diffImg = dCtx.getImageData(0, 0, W, H)
  const bumpImg = bCtx.getImageData(0, 0, W, H)
  const roughImg = rCtx.getImageData(0, 0, W, H)

  const dData = diffImg.data
  const bData = bumpImg.data
  const rData = roughImg.data

  // Longitudinal lines along X axis (parallel to the grain length)
  const striationLines = new Float32Array(H)
  for (let y = 0; y < H; y++) {
    striationLines[y] = (rand() - 0.5) * 0.25 + Math.sin(y * 0.5) * 0.08
  }

  for (let y = 0; y < H; y++) {
    const s = striationLines[y]
    const rowOffset = y * W * 4
    for (let x = 0; x < W; x++) {
      const idx = rowOffset + x * 4

      // Fine longitudinal striation wave + crystalline flour speckles
      const fineNoise = (rand() - 0.5) * 0.09
      const microGranule = rand() > 0.95 ? 0.18 : rand() < 0.03 ? -0.11 : 0
      const longitudinalWave = Math.sin(x * 0.04) * 0.025 + s
      const totalGrain = longitudinalWave + fineNoise + microGranule

      // Diffuse modulation
      const dShift = Math.floor(totalGrain * 42)
      dData[idx] = Math.min(255, Math.max(0, dData[idx] + dShift))
      dData[idx + 1] = Math.min(255, Math.max(0, dData[idx + 1] + dShift))
      dData[idx + 2] = Math.min(255, Math.max(0, dData[idx + 2] + Math.floor(dShift * 0.88)))

      // Bump map: 128 is neutral grey, higher is raised longitudinal ridge
      const bVal = Math.min(255, Math.max(0, Math.floor(128 + totalGrain * 75)))
      bData[idx] = bVal
      bData[idx + 1] = bVal
      bData[idx + 2] = bVal

      // Roughness map: subtle modulation along milling lines
      const rShift = Math.floor(totalGrain * 24)
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
 * Creates anatomically accurate Keshar Kali (Kolam Raw) rice grain geometry:
 * References:
 * - Dimensions: 5.1 mm length, 1.4 mm width, 1.3 mm thickness (Kolam Raw)
 * - Apical End: Blunt rounded dome tip (matching Picture 2 "Blunt Rounded Tip")
 * - Basal End: Distinct oblique notched tip where embryo detached (matching Picture 2 "Notched Tip")
 * - Profile: Gently arched dorsal spine, flatter ventral belly with central furrow (matching Picture 2 "Side Profile" & "End View")
 * - Cross-Section: Elliptical/triangular (Width 1.4 mm, Thickness 1.3 mm)
 */
export function makeGrainGeometry(isInnerCore = false) {
  const N_LATHE = 128
  const N_RAD = 80
  const raw: [number, number][] = []
  let maxR = 0

  for (let i = 0; i <= N_LATHE; i++) {
    const t = i / N_LATHE // 0 (basal/germ notch) to 1 (apical blunt tip)

    // Base profile: smooth belly peak around t ~ 0.44 - 0.52
    let r = Math.pow(Math.sin(Math.PI * t), 0.60) * (0.92 + 0.16 * (1 - t))

    // Apical End (t > 0.82): smoothly round into a blunt dome (matching "Blunt Rounded Tip")
    if (t > 0.82) {
      const apT = (t - 0.82) / 0.18
      const dome = Math.sqrt(Math.max(0, 1 - apT * apT))
      r = r * (0.62 + 0.38 * dome)
    }

    // Basal End (t < 0.22): slightly fuller for the embryo attachment shoulder
    if (t < 0.22) {
      const bsT = t / 0.22
      r = r * (0.58 + 0.42 * Math.pow(bsT, 0.55))
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

  // Color palette matching Picture 2 reference photo:
  const vitreousWhite = new THREE.Color(0.97, 0.965, 0.955)
  const chalkyStarch = new THREE.Color(1.0, 1.0, 1.0)
  const amberGermTint = new THREE.Color(0.86, 0.70, 0.44) // Warm amber embryo remnant
  const c = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) // -0.5 (germ) to +0.5 (apex)
    let y = pos.getY(i) // Thickness axis (dorsal > 0, ventral < 0)
    let z = pos.getZ(i) // Width axis

    const t = x + 0.5 // 0.0 at germ, 1.0 at apex
    const s = Math.sin(Math.PI * Math.min(1, Math.max(0, t)))

    // 1. Cross-section scaling (Kolam Raw: 1.4 mm width, 1.3 mm thickness)
    // z is width (scale 1.4 / 1.4 = 1.0), y is thickness (scale 1.3 / 1.4 = 0.928)
    y *= 0.928

    // 2. Dorsal spine arch (natural bow curve seen in Picture 2 "Side Profile")
    const spineArc = Math.sin(Math.PI * t) * 0.042
    y += spineArc

    // 3. Ventral furrow / groove (seen in Picture 2 "Bottom View" and "End View")
    const isVentral = y < spineArc
    if (isVentral) {
      const furrow = Math.exp(-Math.pow(z * 6.5, 2)) * 0.045 * s
      y += furrow * 0.5
    }

    // 4. Distinct NOTCHED TIP on the basal end (Picture 2 "Notched Tip")
    // The embryo detachment creates an oblique bevel on the ventral side
    let notchIntensity = 0
    if (t < 0.24) {
      const k = (0.24 - t) / 0.24 // 0 at t=0.24, 1 at t=0
      // Diagonal cut-in on the ventral face
      if (y < spineArc + 0.06) {
        const cut = k * 0.28 * Math.max(0, (spineArc + 0.06 - y) / 0.4)
        y += cut * 0.55 // bevel inward towards center
        x += k * 0.045  // shorten the ventral tip, leaving dorsal tip overhang
        notchIntensity = k
      }
      // Concave embryo pocket near the notch facet
      const pocketD = Math.hypot(x - (-0.46), y - (-0.04), z - 0.04)
      if (pocketD < 0.12) {
        const depth = (0.12 - pocketD) * 0.24
        y += depth
        notchIntensity = Math.max(notchIntensity, (0.12 - pocketD) / 0.12)
      }
    }

    // 5. BLUNT ROUNDED APEX on the apical end (Picture 2 "Blunt Rounded Tip")
    if (t > 0.86) {
      const apK = (t - 0.86) / 0.14
      // Ensure smooth hemispherical curvature without sharp point
      const domeProfile = Math.sqrt(Math.max(0, 1 - apK * apK))
      y = y * (0.72 + 0.28 * domeProfile)
      z = z * (0.72 + 0.28 * domeProfile)
    }

    if (isInnerCore) {
      x *= 0.90
      y *= 0.76
      z *= 0.76
    }

    pos.setXYZ(i, x, y, z)

    // 6. Vertex Colors:
    // - Vitreous translucent body on perimeter
    // - Chalky opaque white core in center
    // - Amber embryo tint at notched tip
    const distFromAxis = Math.hypot(y - spineArc, z) / (0.45 * Math.max(0.1, s))
    const isCore = Math.max(0, 1 - distFromAxis * 1.25)
    c.copy(vitreousWhite).lerp(chalkyStarch, isCore * 0.65)

    // Amber germ notch tint
    if (notchIntensity > 0.15) {
      const amberFactor = Math.min(1, Math.pow((notchIntensity - 0.15) / 0.85, 1.4) * 0.85)
      c.lerp(amberGermTint, amberFactor)
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
export function makeGrainMaterial(options: string | GrainMaterialOptions = '#fbf7ee') {
  const opt: GrainMaterialOptions = typeof options === 'string' ? { color: options } : options
  const baseColor = opt.color ? new THREE.Color(opt.color) : new THREE.Color('#fbf7ee')

  const { diffuseMap, bumpMap, roughnessMap } = getRiceGrainMaps()

  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    vertexColors: true,
    map: diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.16,
    roughnessMap: roughnessMap,
    roughness: opt.roughness ?? 0.18, // Silky smooth waxy surface
    metalness: 0.0,
    transmission: opt.transmission ?? 0.84, // High optical translucency
    thickness: opt.thickness ?? 1.4, // Volume depth for light refraction & absorption
    ior: opt.ior ?? 1.51, // Organic starch crystal index of refraction
    attenuationColor: new THREE.Color('#faf4e6'), // Milky warm-white internal scatter
    attenuationDistance: 0.75,
    specularIntensity: 1.0,
    specularColor: new THREE.Color('#ffffff'),
    clearcoat: 0.40,
    clearcoatRoughness: 0.20,
    sheen: 0.85,
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.32,
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
