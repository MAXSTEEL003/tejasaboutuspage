import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { makeGrainGeometry, makeGrainMaterial } from './grain'

type Props = { t: number; visible: boolean; mm: number; width: number; name: string; shift: number }

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ez = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)
const sm = (t: number, a: number, b: number) => ez(clamp((t - a) / (b - a)))

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- realistic woven sack bump texture ---------- */
function makeWovenSackBumpTexture(repeatX = 36, repeatY = 54): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 256
  cv.height = 256
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 256)

  const step = 8
  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 256; x += step) {
      const isOver = ((x / step + y / step) % 2 === 0)
      const grad = ctx.createLinearGradient(
        isOver ? x : x,
        isOver ? y : y,
        isOver ? x + step : x,
        isOver ? y : y + step
      )
      if (isOver) {
        grad.addColorStop(0, '#666666')
        grad.addColorStop(0.5, '#b0b0b0')
        grad.addColorStop(1, '#666666')
      } else {
        grad.addColorStop(0, '#555555')
        grad.addColorStop(0.5, '#999999')
        grad.addColorStop(1, '#555555')
      }
      ctx.fillStyle = grad
      ctx.fillRect(x, y, step, step)
    }
  }

  // Add subtle fiber micro-noise
  const imgData = ctx.getImageData(0, 0, 256, 256)
  const d = imgData.data
  let s = 123
  for (let i = 0; i < d.length; i += 4) {
    s = (s * 16807) % 2147483647
    const noise = ((s - 1) / 2147483646 - 0.5) * 24
    d[i] = Math.min(255, Math.max(0, d[i] + noise))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise))
  }
  ctx.putImageData(imgData, 0, 0)

  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  return tex
}

/* ---------- stitched tape texture ---------- */
function makeStitchedTapeTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = 64
  const ctx = cv.getContext('2d')!

  // Heavy woven crepe tape (olive-forest)
  ctx.fillStyle = '#3a4a2b'
  ctx.fillRect(0, 0, 512, 64)

  // Paper/crepe texture lines
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let x = 0; x < 512; x += 3) {
    ctx.fillRect(x, 0, 1, 64)
  }

  // Top and bottom stitch border
  ctx.fillStyle = '#d4af37'
  ctx.fillRect(0, 2, 512, 2)
  ctx.fillRect(0, 60, 512, 2)

  // Industrial chain stitch (thick cream yarn)
  const stitchStep = 18
  for (let x = 6; x < 512; x += stitchStep) {
    // Needle perforation hole
    ctx.fillStyle = '#1c2414'
    ctx.beginPath()
    ctx.arc(x + 2, 32, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Thick white/cream yarn segment
    ctx.strokeStyle = '#fffcee'
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 4, 30)
    ctx.lineTo(x + 9, 34)
    ctx.stroke()

    // Shadow under stitch
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - 4, 33)
    ctx.lineTo(x + 9, 37)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.repeat.set(4, 1)
  return tex
}

/* ---------- realistic wholesale bag artwork ---------- */
function drawBag(cv: HTMLCanvasElement, name: string, front: boolean) {
  const ctx = cv.getContext('2d')!
  const W = cv.width
  const H = cv.height

  ctx.clearRect(0, 0, W, H)

  // 1. Natural woven polypropylene / jute fabric base
  const bgGrad = ctx.createLinearGradient(0, 0, W, 0)
  bgGrad.addColorStop(0, '#eadfc7')
  bgGrad.addColorStop(0.08, '#f5edd9')
  bgGrad.addColorStop(0.5, '#fbf6ea')
  bgGrad.addColorStop(0.92, '#f5edd9')
  bgGrad.addColorStop(1, '#e5d9bf')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Subtle woven grid lines on fabric
  ctx.fillStyle = 'rgba(74, 56, 36, 0.035)'
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1)
  for (let x = 0; x < W; x += 6) ctx.fillRect(x, 0, 1, H)

  // Vignette shading along outer edges (simulating round cylindrical sack)
  const edgeVig = ctx.createLinearGradient(0, 0, W, 0)
  edgeVig.addColorStop(0, 'rgba(40, 28, 18, 0.15)')
  edgeVig.addColorStop(0.08, 'rgba(40, 28, 18, 0.0)')
  edgeVig.addColorStop(0.92, 'rgba(40, 28, 18, 0.0)')
  edgeVig.addColorStop(1, 'rgba(40, 28, 18, 0.18)')
  ctx.fillStyle = edgeVig
  ctx.fillRect(0, 0, W, H)

  const forest = '#2e3d23'
  const gold = '#c49a38'
  const darkEarth = '#241a12'
  const deepRed = '#8c2828'

  // Top sewn crepe band
  ctx.fillStyle = forest
  ctx.fillRect(0, 0, W, H * 0.085)
  // Gold accent lines
  ctx.fillStyle = gold
  ctx.fillRect(0, H * 0.082, W, 4)
  ctx.fillRect(0, H * 0.015, W, 2)

  // Top tape text banner
  ctx.fillStyle = '#fffdf5'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '600 24px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '10px'
  ctx.fillText('★ 100% PURE AGED BASMATI ★ EXTRA LONG GRAIN ★ EXPORT QUALITY ★', W / 2, H * 0.048)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  // Top stitch line
  ctx.strokeStyle = 'rgba(255, 252, 238, 0.85)'
  ctx.lineWidth = 3
  ctx.setLineDash([14, 10])
  ctx.beginPath()
  ctx.moveTo(0, H * 0.072)
  ctx.lineTo(W, H * 0.072)
  ctx.stroke()
  ctx.setLineDash([])

  // Bottom folded reinforced hem
  ctx.fillStyle = forest
  ctx.fillRect(0, H * 0.94, W, H * 0.06)
  ctx.fillStyle = gold
  ctx.fillRect(0, H * 0.938, W, 3)
  ctx.strokeStyle = 'rgba(255, 252, 238, 0.85)'
  ctx.lineWidth = 3
  ctx.setLineDash([14, 10])
  ctx.beginPath()
  ctx.moveTo(0, H * 0.958)
  ctx.lineTo(W, H * 0.958)
  ctx.stroke()
  ctx.setLineDash([])

  if (!front) {
    // BACK OF BAG: Nutritional Table, Cooking Directions, Exporter Details
    ctx.fillStyle = darkEarth
    ctx.font = '700 36px Manrope, sans-serif'
    ctx.fillText('PRODUCT SPECIFICATION & NUTRITION', W / 2, H * 0.15)

    ctx.strokeStyle = gold
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(W * 0.15, H * 0.18)
    ctx.lineTo(W * 0.85, H * 0.18)
    ctx.stroke()

    // Nutrition Box
    const bx = W * 0.15
    const by = H * 0.22
    const bw = W * 0.7
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillRect(bx, by, bw, H * 0.32)
    ctx.strokeStyle = darkEarth
    ctx.lineWidth = 1.5
    ctx.strokeRect(bx, by, bw, H * 0.32)

    ctx.fillStyle = darkEarth
    ctx.textAlign = 'left'
    ctx.font = '700 24px Manrope, sans-serif'
    ctx.fillText('NUTRITIONAL VALUES (PER 100g SERVING)', bx + 24, by + 40)

    const facts = [
      ['Energy', '356 kcal'],
      ['Carbohydrates', '78.2 g'],
      ['Dietary Fiber', '2.4 g'],
      ['Protein', '8.6 g'],
      ['Total Fat', '0.5 g'],
      ['Cholesterol', '0 mg'],
      ['Moisture', '< 12.5%'],
    ]
    ctx.font = '500 22px Manrope, sans-serif'
    facts.forEach(([label, val], idx) => {
      const ly = by + 80 + idx * 34
      ctx.fillStyle = '#443525'
      ctx.fillText(label, bx + 30, ly)
      ctx.fillStyle = '#1c150e'
      ctx.textAlign = 'right'
      ctx.fillText(val, bx + bw - 30, ly)
      ctx.textAlign = 'left'
    })

    // Cooking Instructions
    const cy = H * 0.58
    ctx.fillStyle = darkEarth
    ctx.font = '700 28px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CULINARY INSTRUCTIONS', W / 2, cy)

    const steps = [
      '1. SOAK: Gently rinse 1 cup rice, soak in lukewarm water for 30 minutes.',
      '2. OPEN POT: Add soaked rice to 5 cups boiling water. Cook uncovered 8-10 mins.',
      '3. REST & SERVE: Drain water thoroughly, fluff with fork, let rest 3 mins.',
    ]
    ctx.font = '500 20px Manrope, sans-serif'
    ctx.fillStyle = '#4a3826'
    steps.forEach((st, i) => {
      ctx.fillText(st, W / 2, cy + 45 + i * 36)
    })

    // Manufacturer Details
    const my = H * 0.76
    ctx.fillStyle = forest
    ctx.font = '700 26px Manrope, sans-serif'
    ctx.fillText('PROCESSED & PACKED BY:', W / 2, my)
    ctx.fillStyle = darkEarth
    ctx.font = '600 22px Manrope, sans-serif'
    ctx.fillText('TEJAS AGRO COMMODITIES PVT. LTD.', W / 2, my + 34)
    ctx.font = '500 19px Manrope, sans-serif'
    ctx.fillStyle = '#554230'
    ctx.fillText('Grain Market Road, Karnal, Haryana 132001, India', W / 2, my + 62)
    ctx.fillText('FSSAI LIC NO: 10014064000382 • ISO 22000:2018 CERTIFIED', W / 2, my + 88)

    // Handling symbols
    ctx.fillStyle = darkEarth
    ctx.font = '600 18px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('KEEP IN COOL & DRY PLACE • STORE ELEVATED FROM FLOOR', W / 2, H * 0.88)
    return
  }

  // FRONT OF BAG: Export packaging design
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // 2. Heritage Laurel Emblem & Sunburst
  const emblemY = H * 0.17
  ctx.save()
  ctx.translate(W / 2, emblemY)

  // Golden wheat / laurel wreath
  ctx.strokeStyle = gold
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(-45, -10, 42, Math.PI * 0.4, Math.PI * 1.5, false)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(45, -10, 42, Math.PI * 1.5, Math.PI * 2.6, false)
  ctx.stroke()

  // Central star
  ctx.fillStyle = gold
  ctx.font = '36px sans-serif'
  ctx.fillText('★', 0, -4)

  // Ribbon text
  ctx.fillStyle = forest
  ctx.font = '700 16px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '4px'
  ctx.fillText('ESTD. 1993', 0, 22)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'
  ctx.restore()

  // 3. Brand Header
  ctx.fillStyle = darkEarth
  ctx.font = '800 46px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '14px'
  ctx.fillText('TEJAS ROYAL', W / 2 + 7, H * 0.25)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  // Decorative divider
  ctx.strokeStyle = gold
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W * 0.18, H * 0.275)
  ctx.lineTo(W * 0.82, H * 0.275)
  ctx.stroke()

  // Sub-header
  ctx.fillStyle = forest
  ctx.font = '700 26px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '10px'
  ctx.fillText('AUTHENTIC INDIAN BASMATI', W / 2 + 5, H * 0.32)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  // 4. Variety Name (Main Focal Title)
  let size = 160
  ctx.font = `italic 700 ${size}px "Instrument Serif", Georgia, serif`
  while (ctx.measureText(name).width > W * 0.84 && size > 64) {
    size -= 4
    ctx.font = `italic 700 ${size}px "Instrument Serif", Georgia, serif`
  }

  // Embossed gold drop shadow behind name
  ctx.fillStyle = 'rgba(196, 154, 56, 0.45)'
  ctx.fillText(name, W / 2 + 3, H * 0.445 + 3)

  // Crisp roasted earth name
  ctx.fillStyle = darkEarth
  ctx.fillText(name, W / 2, H * 0.445)

  // Subtitle
  ctx.fillStyle = '#63503d'
  ctx.font = '600 20px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '6px'
  ctx.fillText('NATURALLY AGED FOR TWO YEARS • EXTRA LONG SLENDER GRAIN', W / 2 + 3, H * 0.485)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  // 5. Central Golden Medallion with Grain Showcase
  const medY = H * 0.60
  const medR = 110

  // Outer gold ring
  ctx.strokeStyle = gold
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(W / 2, medY, medR, 0, Math.PI * 2)
  ctx.stroke()

  // Inner dashed ring
  ctx.strokeStyle = 'rgba(46, 61, 35, 0.6)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 6])
  ctx.beginPath()
  ctx.arc(W / 2, medY, medR - 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Medallion inner fill
  const medGrad = ctx.createRadialGradient(W / 2, medY - 20, 10, W / 2, medY, medR - 10)
  medGrad.addColorStop(0, '#fffef8')
  medGrad.addColorStop(0.7, '#f7edd2')
  medGrad.addColorStop(1, '#e8d4a6')
  ctx.fillStyle = medGrad
  ctx.beginPath()
  ctx.arc(W / 2, medY, medR - 10, 0, Math.PI * 2)
  ctx.fill()

  // Medallion grain illustrations (cluster of 3 slender translucent grains)
  ctx.save()
  ctx.translate(W / 2, medY - 10)
  for (let rot of [-0.28, 0.05, 0.38]) {
    ctx.save()
    ctx.rotate(rot)
    const gr = ctx.createLinearGradient(-35, 0, 35, 0)
    gr.addColorStop(0, '#ffffff')
    gr.addColorStop(0.5, '#fff9eb')
    gr.addColorStop(1, '#dfce9c')
    ctx.fillStyle = gr
    ctx.strokeStyle = 'rgba(74, 56, 36, 0.45)'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.ellipse(0, 0, 48, 14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()

  // Medallion text banner
  ctx.fillStyle = forest
  ctx.font = '800 16px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '3px'
  ctx.fillText('100% SORTEX CLEANED', W / 2 + 1, medY + 62)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  // 6. Quality Certification Pills / Badges
  const badgeY = H * 0.725
  const badgeLabels = [
    ['8.3 mm+', 'AVG LENGTH'],
    ['AGED 24M', 'IN SILOS'],
    ['RICH AROMA', 'NATURAL'],
    ['ZERO PEST', 'TESTED'],
  ]
  const badgeW = W * 0.17
  const totalBadgesW = 4 * badgeW + 3 * 16
  let startX = (W - totalBadgesW) / 2

  badgeLabels.forEach(([top, btm], i) => {
    const x = startX + i * (badgeW + 16)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillRect(x, badgeY - 26, badgeW, 52)
    ctx.strokeStyle = gold
    ctx.lineWidth = 1.8
    ctx.strokeRect(x, badgeY - 26, badgeW, 52)

    ctx.fillStyle = forest
    ctx.font = '800 17px Manrope, sans-serif'
    ctx.fillText(top, x + badgeW / 2, badgeY - 4)

    ctx.fillStyle = darkEarth
    ctx.font = '600 12px Manrope, sans-serif'
    ctx.fillText(btm, x + badgeW / 2, badgeY + 16)
  })

  // 7. Wholesale Weight & Stencil Block
  const weightY = H * 0.835
  ctx.fillStyle = darkEarth
  ctx.font = '900 68px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '6px'
  ctx.fillText('NET WT. 25 KG', W / 2 + 3, weightY)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  ctx.fillStyle = deepRed
  ctx.font = '700 24px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '4px'
  ctx.fillText('( 55.12 LBS )', W / 2 + 2, weightY + 30)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  // 8. Industrial Packaging Details & Barcode
  const footY = H * 0.905

  // Left stamp
  ctx.textAlign = 'left'
  ctx.fillStyle = '#4a3826'
  ctx.font = '600 15px Manrope, sans-serif'
  ctx.fillText('BATCH: TJ-2026/09', W * 0.14, footY - 14)
  ctx.fillText('LOT NO: 418-EXP', W * 0.14, footY + 8)
  ctx.fillText('PKD: OCT 2026', W * 0.14, footY + 30)

  // Right barcode simulation
  const barX = W * 0.64
  const barY = footY - 22
  const barW = W * 0.22
  const barH = 42

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(barX - 6, barY - 4, barW + 12, barH + 20)
  ctx.fillStyle = '#1c150e'

  // Draw authentic vertical barcode bars
  let bx = barX
  const pattern = [2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 2, 1, 3, 1, 4, 2, 1, 2, 3]
  for (let p of pattern) {
    ctx.fillRect(bx, barY, p * 2.2, barH)
    bx += (p + 1.8) * 2.2
  }
  ctx.font = '600 13px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('8 901234 567890', barX + barW / 2, barY + barH + 12)
}

/* ---------- realistic 3D sack geometry & assembly ---------- */
function makeBag(name: string) {
  const w = 1.34
  const h = 1.95
  const D = 0.58

  // Build high-resolution volumetric front & back shells with realistic fabric creases,
  // rounded corners, side gussets, settled rice bulge, and pinched top hem
  const buildShell = (sign: 1 | -1) => {
    const segmentsX = 48
    const segmentsY = 64
    const geo = new THREE.PlaneGeometry(w * 2, h * 2, segmentsX, segmentsY)
    const pos = geo.attributes.position

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i)
      const y = pos.getY(i)
      const u = x / w // -1 to 1 across width
      const v = y / h // -1 (bottom) to 1 (top)

      // Base width and depth profile:
      // Bulge reaches maximum at y ~ -0.3 to -0.6 (lower third where rice settles)
      const bellyFactor = Math.pow(Math.max(0, 1 - u * u), 0.62)
      
      // Vertical fullness profile
      let vertFullness: number
      if (v < -0.8) {
        // Bottom resting flat on the ground
        vertFullness = 0.65 + 0.35 * ((v + 1) / 0.2)
      } else if (v < 0.2) {
        // Plump lower belly
        vertFullness = 1.0 + 0.12 * Math.sin((v + 0.8) * Math.PI * 0.8)
      } else if (v < 0.72) {
        // Upper mid body
        vertFullness = 0.95 - 0.28 * ((v - 0.2) / 0.52)
      } else {
        // Top empty fabric tapering to pinched sewn seam
        const topK = (v - 0.72) / 0.28
        vertFullness = 0.67 * Math.pow(1 - topK, 1.8) + 0.04
      }

      let zBulge = D * bellyFactor * vertFullness

      // Side gusset inward crease (real sacks fold inward at left and right edges)
      const edgeDist = Math.abs(u)
      if (edgeDist > 0.75 && v > -0.85 && v < 0.8) {
        const gussetFold = Math.pow((edgeDist - 0.75) / 0.25, 1.6) * 0.08 * (1 - Math.abs(v) * 0.5)
        zBulge -= gussetFold
      }

      // Natural cloth wrinkles:
      // 1. Horizontal compression waves across lower belly
      const horizontalFolds = Math.sin(y * 8.5) * 0.016 * Math.exp(-Math.pow(v + 0.2, 2) / 0.4)
      
      // 2. Diagonal tension creases radiating from top corners
      const topTension = THREE.MathUtils.smoothstep(v, 0.4, 0.95)
      const diag1 = Math.sin(x * 6.2 + y * 4.1) * 0.018 * topTension
      const diag2 = Math.sin(x * 6.2 - y * 4.1) * 0.014 * topTension

      // 3. Stitched edge crimping near the top rim
      const crimp = THREE.MathUtils.smoothstep(v, 0.82, 1.0) * Math.sin(x * 48) * 0.012

      let finalZ = Math.max(0.01, zBulge + horizontalFolds + diag1 + diag2 + crimp)

      // Slight corner rounding
      if (Math.abs(u) > 0.88 && v < -0.85) {
        const cornerRounding = (Math.abs(u) - 0.88) * 0.06
        x -= Math.sign(x) * cornerRounding
      }

      pos.setX(i, x)
      pos.setZ(i, finalZ * sign)
    }

    geo.computeVertexNormals()
    return geo
  }

  // Canvas textures for front and back
  const frontCv = document.createElement('canvas')
  frontCv.width = 1024
  frontCv.height = 1536
  const backCv = document.createElement('canvas')
  backCv.width = 1024
  backCv.height = 1536

  drawBag(frontCv, name, true)
  drawBag(backCv, name, false)

  const frontTex = new THREE.CanvasTexture(frontCv)
  const backTex = new THREE.CanvasTexture(backCv)
  for (const t of [frontTex, backTex]) {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  }

  const bump = makeWovenSackBumpTexture(32, 48)

  const mkMaterial = (map: THREE.Texture) =>
    new THREE.MeshPhysicalMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.7,
      roughness: 0.46, // Woven polypropylene with silky finish
      metalness: 0.02,
      sheen: 0.85, // Strong fabric sheen catching light on woven fibers
      sheenColor: new THREE.Color('#fff7e6'),
      sheenRoughness: 0.4,
      clearcoat: 0.16, // BOPP laminated film shine
      clearcoatRoughness: 0.35,
      side: THREE.DoubleSide,
    })

  const fm = mkMaterial(frontTex)
  const bm = mkMaterial(backTex)

  const frontMesh = new THREE.Mesh(buildShell(1), fm)
  const backMesh = new THREE.Mesh(buildShell(-1), bm)

  for (const m of [frontMesh, backMesh]) {
    m.castShadow = true
    m.receiveShadow = true
  }

  // 3D Top Stitched Binding Tape across top rim
  const tapeTex = makeStitchedTapeTexture()
  const tapeMat = new THREE.MeshStandardMaterial({
    map: tapeTex,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide,
  })
  const tapeGeo = new THREE.BoxGeometry(w * 2 + 0.08, 0.12, 0.06)
  const topTapeMesh = new THREE.Mesh(tapeGeo, tapeMat)
  topTapeMesh.position.set(0, h + 0.04, 0)
  topTapeMesh.castShadow = true

  // 3D Dangling Sewing Thread Tail (iconic machine-stitched bag closure feature)
  const threadPts = [
    new THREE.Vector3(w + 0.04, h + 0.05, 0.02),
    new THREE.Vector3(w + 0.09, h - 0.02, 0.03),
    new THREE.Vector3(w + 0.08, h - 0.14, 0.01),
    new THREE.Vector3(w + 0.11, h - 0.28, 0.02),
  ]
  const threadCurve = new THREE.CatmullRomCurve3(threadPts)
  const threadGeo = new THREE.TubeGeometry(threadCurve, 20, 0.008, 8, false)
  const threadMat = new THREE.MeshStandardMaterial({
    color: '#fffef0',
    roughness: 0.6,
  })
  const threadMesh = new THREE.Mesh(threadGeo, threadMat)

  // 3D Folded Bottom Base Rim
  const baseRimGeo = new THREE.BoxGeometry(w * 2 - 0.04, 0.08, 0.12)
  const baseRimMat = new THREE.MeshStandardMaterial({
    color: '#2a3821',
    roughness: 0.6,
  })
  const baseRimMesh = new THREE.Mesh(baseRimGeo, baseRimMat)
  baseRimMesh.position.set(0, -h + 0.03, 0)

  const g = new THREE.Group()
  g.add(frontMesh, backMesh, topTapeMesh, threadMesh, baseRimMesh)
  g.position.set(-1.35, h - 0.02, -0.5)
  g.rotation.y = 0.2

  const redraw = (n: string) => {
    drawBag(frontCv, n, true)
    frontTex.needsUpdate = true
  }

  const dispose = () => {
    frontMesh.geometry.dispose()
    backMesh.geometry.dispose()
    topTapeMesh.geometry.dispose()
    threadMesh.geometry.dispose()
    baseRimMesh.geometry.dispose()
    fm.dispose()
    bm.dispose()
    tapeMat.dispose()
    threadMat.dispose()
    baseRimMat.dispose()
    frontTex.dispose()
    backTex.dispose()
    tapeTex.dispose()
    bump.dispose()
  }

  return { group: g, redraw, dispose }
}

/* ---------- bowl ---------- */
const BOWL = { x: 1.55, z: 1.0, R: 1.15, H: 0.62 }
function makeBowl() {
  const { R, H } = BOWL
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.001, 0), new THREE.Vector2(R * 0.44, 0), new THREE.Vector2(R * 0.46, 0.07)]
  const n = 22
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2)
    pts.push(new THREE.Vector2(R * 0.46 + (R - R * 0.46) * Math.sin(a), 0.07 + H * (1 - Math.cos(a))))
  }
  const top = 0.07 + H
  pts.push(new THREE.Vector2(R + 0.012, top + 0.02), new THREE.Vector2(R - 0.035, top + 0.028), new THREE.Vector2(R - 0.075, top))
  for (let i = n; i >= 0; i--) {
    const a = (i / n) * (Math.PI / 2)
    pts.push(new THREE.Vector2((R - 0.075) * (0.47 + 0.53 * Math.sin(a)), 0.17 + (H - 0.1) * (1 - Math.cos(a))))
  }
  pts.push(new THREE.Vector2(0.001, 0.17))
  const geo = new THREE.LatheGeometry(pts, 96)
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#4e5c38', // Deep glazed olive ceramic
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    sheen: 0.25,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.position.set(BOWL.x, 0, BOWL.z)
  return { mesh, dispose: () => { geo.dispose(); mat.dispose() } }
}

/* ---------- grains ---------- */
type Inst = { rest: THREE.Vector3; rot: THREE.Vector3; start: THREE.Vector3; spin: THREE.Vector3; a: number; sc: number }

function buildInstances(): Inst[] {
  const r = rng(7)
  const out: Inst[] = []
  const { R, H } = BOWL
  const topY = 0.07 + H
  const RR = R - 0.14
  const mk = (rest: THREE.Vector3, rot: THREE.Vector3, sc = 1) => {
    out.push({
      rest,
      rot,
      sc,
      start: new THREE.Vector3(rest.x + (r() - 0.5) * 9, rest.y + 5 + r() * 7, rest.z + 1.5 + r() * 4),
      spin: new THREE.Vector3((r() - 0.5) * 12, (r() - 0.5) * 12, (r() - 0.5) * 12),
      a: r(),
    })
  }
  for (let i = 0; i < 900; i++) {
    const rad = RR * Math.sqrt(r())
    const ang = r() * Math.PI * 2
    const surf = topY + 0.02 + 0.26 * (1 - (rad / RR) ** 2)
    const y = surf - r() * r() * 0.16
    mk(new THREE.Vector3(BOWL.x + Math.cos(ang) * rad, y, BOWL.z + Math.sin(ang) * rad), new THREE.Vector3((r() - 0.5) * 0.9, r() * Math.PI * 2, (r() - 0.5) * 0.9))
  }
  let placed = 0
  while (placed < 420) {
    const spill = r() < 0.45
    let x: number
    let z: number
    if (spill) {
      const u = r()
      x = BOWL.x - 1.0 - u * 2.2 + (r() - 0.5) * 0.7 * (0.4 + u)
      z = BOWL.z + 0.5 + Math.sin(u * 2.4) * 0.6 + (r() - 0.5) * 0.9 * (0.3 + u)
    } else {
      const a = r() * Math.PI * 2
      const d = 1.25 + Math.abs(r() + r() - 1) * 1.4
      x = BOWL.x + Math.cos(a) * d
      z = BOWL.z + Math.sin(a) * d * 0.8
    }
    if (Math.hypot(x - BOWL.x, z - BOWL.z) < 1.3) continue
    if (Math.abs(x + 1.35) < 1.5 && z < 0.4) continue
    if (z > 3.2 || z < -0.6) continue
    mk(new THREE.Vector3(x, 0.04, z), new THREE.Vector3((r() - 0.5) * 0.25, r() * Math.PI * 2, (r() - 0.5) * 0.25))
    placed++
  }
  return out
}

/* ---------- component ---------- */
export default function FinalScene(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const P = useRef(props)
  P.current = props
  const api = useRef<{ redraw: (n: string) => void; dirty: () => void } | null>(null)

  useEffect(() => {
    api.current?.redraw(props.name)
    api.current?.dirty()
  }, [props.name, props.mm, props.width])

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ canvas: canvas.current!, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const pm = new THREE.PMREMGenerator(renderer)
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.65

    // Primary warm sunlight
    const sun = new THREE.DirectionalLight('#ffe8c6', 3.6)
    sun.position.set(-5, 7.5, 5)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const sc = sun.shadow.camera
    sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 25
    sun.shadow.radius = 6
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.02

    // Soft sky fill
    const fill = new THREE.DirectionalLight('#e2edd8', 0.9)
    fill.position.set(6, 3, 4)

    // Back rim light (picks up bag woven sheen & rice translucency)
    const backRim = new THREE.DirectionalLight('#ffffff', 1.8)
    backRim.position.set(-2, 4, -5)

    scene.add(sun, fill, backRim)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.32 }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const bag = makeBag(P.current.name)
    const bowl = makeBowl()
    scene.add(bag.group, bowl.mesh)

    // Translucent grains for bowl and falling curtain
    const geo = makeGrainGeometry(false)
    const mat = makeGrainMaterial({
      color: '#fcf8ee',
      transmission: 0.55,
      thickness: 1.3,
      roughness: 0.22,
      ior: 1.51,
    })

    const insts = buildInstances()
    const riceMesh = new THREE.InstancedMesh(geo, mat, insts.length)
    riceMesh.castShadow = true
    riceMesh.receiveShadow = true
    riceMesh.frustumCulled = false
    scene.add(riceMesh)

    const cam0 = new THREE.Vector3(1.2, 1.3, 4.2)
    const look0 = new THREE.Vector3(1.3, 0.85, 0.9)
    const fwd = look0.clone().sub(cam0).normalize()
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize()
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize()
    const r = rng(21)
    const curtain = Array.from({ length: 300 }, () => {
      const d = 1.1 + r() * 5
      const p0 = cam0.clone().addScaledVector(fwd, d).addScaledVector(right, (r() - 0.5) * d * 0.95).addScaledVector(up, (r() - 0.5) * d * 0.7)
      return {
        p0,
        drop: new THREE.Vector3((r() - 0.5) * 1.5, -(6 + r() * 5), (r() - 0.5) * 2),
        rot: new THREE.Vector3(r() * 6, r() * 6, r() * 6),
        spin: new THREE.Vector3((r() - 0.5) * 8, (r() - 0.5) * 8, (r() - 0.5) * 8),
        a: r(),
      }
    })
    const curtainMesh = new THREE.InstancedMesh(geo, mat, curtain.length)
    curtainMesh.castShadow = false
    curtainMesh.frustumCulled = false
    scene.add(curtainMesh)

    const fov = 28
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 100)
    const dummy = new THREE.Object3D()
    const tgt = new THREE.Vector3()
    let w = 1
    let h = 1
    let needs = true
    let lastKey = ''

    const resize = () => {
      w = Math.max(1, el.clientWidth)
      h = Math.max(1, el.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      needs = true
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    api.current = { redraw: bag.redraw, dirty: () => (needs = true) }
    document.fonts?.ready.then(() => {
      bag.redraw(P.current.name)
      needs = true
    })

    const frame = () => {
      const p = P.current
      const t = clamp(p.t)
      const Lg = 0.34 * (p.mm / 8.3)
      const Tg = Lg * (p.width / p.mm)
      const tc = sm(t, 0.06, 0.78)

      // grains
      for (let i = 0; i < insts.length; i++) {
        const n = insts[i]
        const a = 0.03 + n.a * 0.42
        const k = sm(t, a, a + 0.32)
        const inv = 1 - k
        dummy.position.set(
          n.rest.x + (n.start.x - n.rest.x) * inv,
          n.rest.y + (n.start.y - n.rest.y) * inv * inv,
          n.rest.z + (n.start.z - n.rest.z) * inv,
        )
        dummy.rotation.set(n.rot.x + n.spin.x * inv, n.rot.y + n.spin.y * inv, n.rot.z + n.spin.z * inv)
        if (n.rest.y < 0.1) dummy.position.y = Math.max(dummy.position.y, Tg * 0.42)
        dummy.scale.set(Lg, Tg, Tg)
        dummy.updateMatrix()
        riceMesh.setMatrixAt(i, dummy.matrix)
      }
      riceMesh.instanceMatrix.needsUpdate = true

      for (let i = 0; i < curtain.length; i++) {
        const c = curtain[i]
        const k = sm(t, 0.02 + c.a * 0.22, 0.3 + c.a * 0.3)
        dummy.position.copy(c.p0).addScaledVector(c.drop, k)
        dummy.rotation.set(c.rot.x + c.spin.x * k, c.rot.y + c.spin.y * k, c.rot.z + c.spin.z * k)
        const s = (1 - k * 0.4) * 1.15
        dummy.scale.set(Lg * s, Tg * s, Tg * s)
        dummy.updateMatrix()
        curtainMesh.setMatrixAt(i, dummy.matrix)
      }
      curtainMesh.instanceMatrix.needsUpdate = true

      // camera pull-back
      const aspect = w / h
      const dEnd = Math.max(10.5, 7.4 / (2 * Math.tan((fov * Math.PI) / 360) * aspect))
      const look1 = new THREE.Vector3(0, 1.55, 0)
      const cam1 = new THREE.Vector3(0.7, 2.7, dEnd)
      camera.position.lerpVectors(cam0, cam1, tc)
      tgt.lerpVectors(look0, look1, tc)
      const dist = camera.position.distanceTo(tgt)
      const visW = 2 * dist * Math.tan((fov * Math.PI) / 360) * aspect
      tgt.x += p.shift * visW * tc
      camera.lookAt(tgt)

      bag.group.position.y = 1.93 - (1 - sm(t, 0.1, 0.6)) * 0.35
      renderer.toneMappingExposure = 0.82 + 0.25 * tc
      renderer.render(scene, camera)
    }

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const p = P.current
      if (!p.visible) return
      const key = `${p.t.toFixed(4)}|${p.mm}|${p.width}|${p.shift}`
      if (!needs && key === lastKey) return
      lastKey = key
      needs = false
      frame()
    }
    frame()
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      bag.dispose()
      bowl.dispose()
      geo.dispose()
      mat.dispose()
      ground.geometry.dispose()
      ;(ground.material as THREE.Material).dispose()
      pm.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={host} className="absolute inset-0" aria-hidden>
      <canvas ref={canvas} className="block h-full w-full" />
    </div>
  )
}
