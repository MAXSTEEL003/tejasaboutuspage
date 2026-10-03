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

/* ---------- soft contact shadow (ambient occlusion) texture ---------- */
function makeContactShadowTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = 512
  const ctx = cv.getContext('2d')!
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 240)
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.96)')
  grad.addColorStop(0.24, 'rgba(0, 0, 0, 0.75)')
  grad.addColorStop(0.58, 'rgba(0, 0, 0, 0.32)')
  grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.08)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)
  const tex = new THREE.CanvasTexture(cv)
  return tex
}

/* ---------- dark slate studio table / floor texture ---------- */
function makeStudioGroundTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 1024
  cv.height = 1024
  const ctx = cv.getContext('2d')!
  const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 512)
  grad.addColorStop(0, '#2e333d')
  grad.addColorStop(0.35, '#242830')
  grad.addColorStop(0.7, '#1b1e24')
  grad.addColorStop(1, '#131518')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 1024)
  const tex = new THREE.CanvasTexture(cv)
  return tex
}

/* ---------- Keshar Kali image loader (high-res user upload) ---------- */
let cachedBagImg: HTMLImageElement | null = null
function getKesharBagImage(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === 'undefined') return null
  if (!cachedBagImg) {
    cachedBagImg = new Image()
    if (onLoad) cachedBagImg.onload = onLoad
    cachedBagImg.src = '/images/kesharkali_front_render.png'
  } else if (onLoad) {
    if (cachedBagImg.complete && cachedBagImg.naturalWidth > 0) {
      setTimeout(onLoad, 0)
    } else {
      const prev = cachedBagImg.onload
      cachedBagImg.onload = (e) => {
        if (prev) (prev as (ev: Event) => void)(e)
        onLoad()
      }
    }
  }
  return cachedBagImg
}
if (typeof window !== 'undefined') {
  getKesharBagImage()
}

/* ---------- stitched tape texture (white crepe + red thread) ---------- */
function makeStitchedTapeTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = 64
  const ctx = cv.getContext('2d')!

  // Heavy woven crepe paper tape (cream-white)
  ctx.fillStyle = '#fcf8ee'
  ctx.fillRect(0, 0, 512, 64)

  // Paper/crepe texture lines
  ctx.fillStyle = 'rgba(0,0,0,0.04)'
  for (let x = 0; x < 512; x += 3) {
    ctx.fillRect(x, 0, 1, 64)
  }

  // Top and bottom gold accent border
  ctx.fillStyle = '#d4af37'
  ctx.fillRect(0, 0, 512, 3)
  ctx.fillRect(0, 61, 512, 3)

  // Industrial chain stitch (vibrant red yarn)
  const stitchStep = 18
  for (let x = 6; x < 512; x += stitchStep) {
    // Needle perforation hole
    ctx.fillStyle = '#5c0d16'
    ctx.beginPath()
    ctx.arc(x + 2, 32, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Thick red yarn segment
    ctx.strokeStyle = '#c91e25'
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 4, 30)
    ctx.lineTo(x + 9, 34)
    ctx.stroke()

    // Shadow under stitch
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
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

/* ---------- realistic Keshar Kali bag artwork ---------- */
function drawBag(cv: HTMLCanvasElement, _name: string, front: boolean, onImgLoad?: () => void) {
  const ctx = cv.getContext('2d')!
  const W = cv.width
  const H = cv.height

  ctx.clearRect(0, 0, W, H)

  if (!front) {
    // BACK OF BAG: Deep wine maroon + gold specification sheet
    const bgGrad = ctx.createLinearGradient(0, 0, W, 0)
    bgGrad.addColorStop(0, '#420813')
    bgGrad.addColorStop(0.5, '#5e0f1e')
    bgGrad.addColorStop(1, '#420813')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Side gold gusset strips
    const gussetW = W * 0.11
    const goldGrad = ctx.createLinearGradient(0, 0, gussetW, 0)
    goldGrad.addColorStop(0, '#df9b15')
    goldGrad.addColorStop(0.5, '#f8c73c')
    goldGrad.addColorStop(1, '#cb8a0e')
    ctx.fillStyle = goldGrad
    ctx.fillRect(0, 0, gussetW, H)
    ctx.fillRect(W - gussetW, 0, gussetW, H)

    // Vertical text on back side gussets
    ctx.save()
    ctx.fillStyle = '#5c0d16'
    ctx.font = '800 20px Manrope, sans-serif'
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '7px'
    ctx.translate(gussetW / 2, H * 0.5)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('KESHAR KALI ★ WADA KOLAM', 0, 7)
    ctx.restore()

    ctx.save()
    ctx.fillStyle = '#5c0d16'
    ctx.font = '800 20px Manrope, sans-serif'
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '7px'
    ctx.translate(W - gussetW / 2, H * 0.5)
    ctx.rotate(Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('KESHAR KALI ★ WADA KOLAM', 0, 7)
    ctx.restore()

    // Inner parchment card for nutrition and specs
    const cardX = W * 0.14
    const cardY = H * 0.08
    const cardW = W * 0.72
    const cardH = H * 0.84
    ctx.fillStyle = '#fefaf0'
    ctx.fillRect(cardX, cardY, cardW, cardH)
    ctx.strokeStyle = '#d4af37'
    ctx.lineWidth = 3
    ctx.strokeRect(cardX, cardY, cardW, cardH)
    ctx.strokeStyle = '#5e0f1e'
    ctx.lineWidth = 1
    ctx.strokeRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12)

    // Header inside card
    ctx.textAlign = 'center'
    ctx.fillStyle = '#5e0f1e'
    ctx.font = '900 38px "Instrument Serif", Georgia, serif'
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '3px'
    ctx.fillText('KESHAR KALI', W / 2, cardY + 54)
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

    ctx.font = '700 18px Manrope, sans-serif'
    ctx.fillStyle = '#b38210'
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '4px'
    ctx.fillText('PREMIUM WADA KOLAM RICE', W / 2, cardY + 86)
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

    ctx.font = 'italic 600 20px Georgia, serif'
    ctx.fillStyle = '#55111f'
    ctx.fillText('“ Khila Khila Dana ”', W / 2, cardY + 116)

    // Divider
    ctx.strokeStyle = '#d4af37'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cardX + 30, cardY + 132)
    ctx.lineTo(cardX + cardW - 30, cardY + 132)
    ctx.stroke()

    // Nutrition Table
    const nx = cardX + 24
    const ny = cardY + 152
    const nw = cardW - 48
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(nx, ny, nw, H * 0.28)
    ctx.strokeStyle = '#ded0ab'
    ctx.strokeRect(nx, ny, nw, H * 0.28)

    ctx.fillStyle = '#5e0f1e'
    ctx.textAlign = 'left'
    ctx.font = '700 18px Manrope, sans-serif'
    ctx.fillText('NUTRITIONAL VALUES (PER 100g UNCOOKED)', nx + 18, ny + 32)

    const facts = [
      ['Energy', '354 kcal'],
      ['Carbohydrates', '78.4 g'],
      ['Dietary Fiber', '1.8 g'],
      ['Protein', '7.8 g'],
      ['Total Fat', '0.5 g'],
      ['Moisture', '< 12.8%'],
    ]
    ctx.font = '500 17px Manrope, sans-serif'
    facts.forEach(([label, val], idx) => {
      const ly = ny + 64 + idx * 30
      ctx.fillStyle = '#4e3b2b'
      ctx.fillText(label, nx + 20, ly)
      ctx.fillStyle = '#1c150e'
      ctx.textAlign = 'right'
      ctx.fillText(val, nx + nw - 20, ly)
      ctx.textAlign = 'left'
    })

    // Wada Kolam Cooking Instructions
    const cy = ny + H * 0.32
    ctx.fillStyle = '#5e0f1e'
    ctx.font = '700 20px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CULINARY INSTRUCTIONS', W / 2, cy)

    const steps = [
      '1. WASH: Rinse 1 cup rice gently 2-3 times in fresh cold water.',
      '2. SOAK: Soak for 20 minutes to allow natural starch hydration.',
      '3. COOK: Add 2 cups water, simmer covered on low heat 10-12 mins.',
      '4. REST: Rest for 5 mins, fluff with fork for fluffy, distinct grains.',
    ]
    ctx.font = '500 15px Manrope, sans-serif'
    ctx.fillStyle = '#443322'
    steps.forEach((st, i) => {
      ctx.fillText(st, W / 2, cy + 34 + i * 26)
    })

    // Manufacturer Details
    const my = cy + 155
    ctx.fillStyle = '#5e0f1e'
    ctx.font = '700 18px Manrope, sans-serif'
    ctx.fillText('PROCESSED & PACKED BY:', W / 2, my)
    ctx.fillStyle = '#22150d'
    ctx.font = '600 16px Manrope, sans-serif'
    ctx.fillText('TEJAS AGRO COMMODITIES PVT. LTD.', W / 2, my + 26)
    ctx.font = '500 14px Manrope, sans-serif'
    ctx.fillStyle = '#665340'
    ctx.fillText('Grain Market Road, Karnal, Haryana 132001, India', W / 2, my + 48)
    ctx.fillText('FSSAI LIC NO: 10014064000382 • ISO 22000:2018', W / 2, my + 68)

    // Barcode & Net weight badge
    const footY = cardY + cardH - 58
    ctx.fillStyle = '#5e0f1e'
    ctx.font = '800 24px Manrope, sans-serif'
    ctx.fillText('NET WT. 30 KG ( 66.1 LBS )', W / 2, footY)
    ctx.font = '600 13px Manrope, sans-serif'
    ctx.fillStyle = '#887258'
    ctx.fillText('BATCH: KK-2026/09 • 100% SORTEX CLEANED', W / 2, footY + 24)
    return
  }

  // FRONT OF BAG: Authentic Keshar Kali Bag Design
  // 1. Base wine burgundy / deep maroon gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, 0)
  bgGrad.addColorStop(0, '#420813')
  bgGrad.addColorStop(0.12, '#5e0f1e')
  bgGrad.addColorStop(0.5, '#731427')
  bgGrad.addColorStop(0.88, '#5e0f1e')
  bgGrad.addColorStop(1, '#420813')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Subtle damask pattern
  ctx.fillStyle = 'rgba(235, 186, 50, 0.04)'
  const dStep = 48
  for (let y = 0; y < H; y += dStep) {
    for (let x = 0; x < W; x += dStep) {
      if ((x / dStep + y / dStep) % 2 === 0) {
        ctx.beginPath()
        ctx.arc(x + 24, y + 24, 7, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // 2. Check if authentic Keshar Kali 3D packaging render is loaded
  const img = getKesharBagImage(onImgLoad)
  if (img && img.complete && img.naturalWidth > 0) {
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    // Crop strictly to the bag boundaries from the high-resolution studio render
    // Bounding box: minX=182, maxX=526, minY=57, maxY=598 (size: 616x658)
    const sx = nw * 0.293
    const sy = nh * 0.084
    const sw = nw * 0.560
    const sh = nh * 0.825

    // Draw authentic Keshar Kali packaging artwork across front face
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
  } else {
    // Procedural Fallback while image is loading
    // Golden-Yellow Side Gussets
    const gussetW = W * 0.125
    const goldGradL = ctx.createLinearGradient(0, 0, gussetW, 0)
    goldGradL.addColorStop(0, '#df9b15')
    goldGradL.addColorStop(0.5, '#f8c73c')
    goldGradL.addColorStop(1, '#cb8a0e')
    ctx.fillStyle = goldGradL
    ctx.fillRect(0, 0, gussetW, H)

    const goldGradR = ctx.createLinearGradient(W - gussetW, 0, W, 0)
    goldGradR.addColorStop(0, '#cb8a0e')
    goldGradR.addColorStop(0.5, '#f8c73c')
    goldGradR.addColorStop(1, '#df9b15')
    ctx.fillStyle = goldGradR
    ctx.fillRect(W - gussetW, 0, gussetW, H)

    // Gusset inner boundary red pinstripes
    ctx.fillStyle = '#3a060f'
    ctx.fillRect(gussetW - 3, 0, 3, H)
    ctx.fillRect(W - gussetW, 0, 3, H)

    // Gusset vertical typography
    ctx.save()
    ctx.fillStyle = '#5c0d16'
    ctx.font = '900 24px Manrope, sans-serif'
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '10px'
    ctx.translate(gussetW / 2, H * 0.5)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('KESHAR KALI ★ WADA KOLAM', 0, 8)
    ctx.restore()

    ctx.save()
    ctx.fillStyle = '#5c0d16'
    ctx.font = '900 24px Manrope, sans-serif'
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '10px'
    ctx.translate(W - gussetW / 2, H * 0.5)
    ctx.rotate(Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('KESHAR KALI ★ WADA KOLAM', 0, 8)
    ctx.restore()

    // Procedural emblem & cartouche
    const emblemY = H * 0.22
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    // Arched shield
    ctx.fillStyle = '#f2efe6'
    ctx.beginPath()
    ctx.arc(W / 2, emblemY, 70, Math.PI, 0, false)
    ctx.lineTo(W / 2 + 70, emblemY + 60)
    ctx.lineTo(W / 2, emblemY + 110)
    ctx.lineTo(W / 2 - 70, emblemY + 60)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#d4af37'
    ctx.lineWidth = 4
    ctx.stroke()

    // Brand Name
    ctx.fillStyle = '#ffd24d'
    ctx.font = '900 72px "Instrument Serif", Georgia, serif'
    ctx.fillText('KESHAR KALI', W / 2, H * 0.44)

    // Ribbon
    ctx.fillStyle = '#f8c73c'
    ctx.fillRect(W * 0.16, H * 0.48, W * 0.68, 54)
    ctx.fillStyle = '#5e0f1e'
    ctx.font = '800 26px Manrope, sans-serif'
    ctx.fillText('PREMIUM WADA KOLAM RICE', W / 2, H * 0.518)

    // Tagline
    ctx.fillStyle = '#ffffff'
    ctx.font = 'italic 700 48px Georgia, serif'
    ctx.fillText('Khila Khila Dana', W / 2, H * 0.60)

    // White Crepe Top Hem with Red Stitching
    const topTapeH = H * 0.075
    ctx.fillStyle = '#fbf7ee'
    ctx.fillRect(0, 0, W, topTapeH)
    ctx.fillStyle = '#cfa035'
    ctx.fillRect(0, topTapeH - 3, W, 3)

    // Top tape text
    ctx.fillStyle = '#5e0f1e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '800 20px Manrope, sans-serif'
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '6px'
    ctx.fillText('★ KESHAR KALI ★ KHILA KHILA DANA ★', W / 2, topTapeH * 0.44)
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

    // Red chain stitch line across top
    ctx.strokeStyle = '#c61d23'
    ctx.lineWidth = 3.5
    ctx.setLineDash([14, 10])
    ctx.beginPath()
    ctx.moveTo(0, topTapeH * 0.8)
    ctx.lineTo(W, topTapeH * 0.8)
    ctx.stroke()
    ctx.setLineDash([])

    // Bottom Folded Hem
    const btmH = H * 0.05
    ctx.fillStyle = '#4a0b16'
    ctx.fillRect(0, H - btmH, W, btmH)
    ctx.fillStyle = '#cfa035'
    ctx.fillRect(0, H - btmH, W, 3)

    ctx.strokeStyle = '#c61d23'
    ctx.lineWidth = 3.5
    ctx.setLineDash([14, 10])
    ctx.beginPath()
    ctx.moveTo(0, H - btmH * 0.4)
    ctx.lineTo(W, H - btmH * 0.4)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Cylindrical Volume & Fabric Weave Lighting Vignette
  const vig = ctx.createLinearGradient(0, 0, W, 0)
  vig.addColorStop(0, 'rgba(20, 5, 8, 0.28)')
  vig.addColorStop(0.12, 'rgba(20, 5, 8, 0.04)')
  vig.addColorStop(0.5, 'rgba(255, 255, 255, 0.07)')
  vig.addColorStop(0.88, 'rgba(20, 5, 8, 0.04)')
  vig.addColorStop(1, 'rgba(20, 5, 8, 0.28)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)
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

  const onImgLoad = () => {
    drawBag(frontCv, name, true)
    frontTex.needsUpdate = true
  }

  drawBag(frontCv, name, true, onImgLoad)
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
      bumpScale: 0.045, // Subtle realistic woven poly weave without blotches
      roughness: 0.28,
      metalness: 0.01,
      sheen: 0.75, // Fabric sheen catching light on woven fibers
      sheenColor: new THREE.Color('#fff0d0'),
      sheenRoughness: 0.3,
      clearcoat: 0.45, // Authentic BOPP glossy protective film lamination
      clearcoatRoughness: 0.16,
      side: THREE.FrontSide,
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

  // 3D Dangling Sewing Thread Tail (iconic red machine-stitched bag closure feature)
  const threadPts = [
    new THREE.Vector3(w + 0.04, h + 0.05, 0.02),
    new THREE.Vector3(w + 0.09, h - 0.02, 0.03),
    new THREE.Vector3(w + 0.08, h - 0.14, 0.01),
    new THREE.Vector3(w + 0.11, h - 0.28, 0.02),
  ]
  const threadCurve = new THREE.CatmullRomCurve3(threadPts)
  const threadGeo = new THREE.TubeGeometry(threadCurve, 20, 0.008, 8, false)
  const threadMat = new THREE.MeshStandardMaterial({
    color: '#c91e25',
    roughness: 0.5,
  })
  const threadMesh = new THREE.Mesh(threadGeo, threadMat)

  // 3D Folded Bottom Base Rim
  const baseRimGeo = new THREE.BoxGeometry(w * 2 - 0.04, 0.08, 0.12)
  const baseRimMat = new THREE.MeshStandardMaterial({
    color: '#420813',
    roughness: 0.6,
  })
  const baseRimMesh = new THREE.Mesh(baseRimGeo, baseRimMat)
  baseRimMesh.position.set(0, -h + 0.03, 0)

  const g = new THREE.Group()
  g.add(frontMesh, backMesh, topTapeMesh, threadMesh, baseRimMesh)
  g.position.set(-1.35, h - 0.02, -0.5)
  g.rotation.y = 0.2

  const redraw = (n: string) => {
    drawBag(frontCv, n, true, () => {
      frontTex.needsUpdate = true
    })
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

/* ---------- procedural dense rice substrate texture for full mound core ---------- */
function makeRiceBedTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = 512
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#fcf8ee'
  ctx.fillRect(0, 0, 512, 512)

  // Dense stipple pattern of thousands of micro-grains to simulate dense subsurface rice
  const r = rng(101)
  for (let i = 0; i < 3500; i++) {
    const x = r() * 512
    const y = r() * 512
    const len = 9 + r() * 9
    const ang = r() * Math.PI
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.fillStyle = r() < 0.28 ? '#ffffff' : r() < 0.78 ? '#fcf9f1' : '#ede2ca'
    ctx.beginPath()
    ctx.ellipse(0, 0, len * 0.5, 2.4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(120, 95, 60, 0.08)'
    ctx.lineWidth = 0.75
    ctx.stroke()
    ctx.restore()
  }

  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(5, 5)
  return tex
}

/* ---------- bowl & inner full rice mound core ---------- */
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
    color: '#d4a843', // Rich artisanal Indian spun brass platter
    roughness: 0.22,
    metalness: 0.72,
    clearcoat: 0.65,
    clearcoatRoughness: 0.12,
    sheen: 0.4,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.position.set(BOWL.x, 0, BOWL.z)

  // Solid, perfectly curved inner rice mound core (guarantees bowl looks 100% full with ZERO gaps)
  const innerRimR = R - 0.065 // 1.085
  const innerRimY = top + 0.018 // 0.708
  const peakH = 0.38
  const bedPts: THREE.Vector2[] = []
  const steps = 36
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps
    const r = frac * innerRimR
    const h = innerRimY + peakH * Math.pow(Math.max(0, 1 - Math.pow(frac, 1.75)), 0.76)
    bedPts.push(new THREE.Vector2(Math.max(0.001, r), h))
  }
  // Step down inside the inner brass wall so it forms a seamless watertight solid core
  bedPts.push(new THREE.Vector2(innerRimR, innerRimY - 0.25))
  bedPts.push(new THREE.Vector2(0.001, innerRimY - 0.25))

  const bedGeo = new THREE.LatheGeometry(bedPts, 64)
  const bedTex = makeRiceBedTexture()
  const bedMat = new THREE.MeshStandardMaterial({
    map: bedTex,
    roughness: 0.35,
    metalness: 0.02,
  })
  const bedMesh = new THREE.Mesh(bedGeo, bedMat)
  bedMesh.position.set(BOWL.x, 0, BOWL.z)
  bedMesh.receiveShadow = true

  return {
    mesh,
    bedMesh,
    dispose: () => {
      geo.dispose()
      mat.dispose()
      bedGeo.dispose()
      bedMat.dispose()
      bedTex.dispose()
    },
  }
}

/* ---------- grains ---------- */
type Inst = { rest: THREE.Vector3; rot: THREE.Vector3; start: THREE.Vector3; spin: THREE.Vector3; a: number; sc: number }

function buildInstances(): Inst[] {
  const r = rng(7)
  const out: Inst[] = []
  const { R, H } = BOWL
  const topY = 0.07 + H
  const innerRimR = R - 0.065
  const innerRimY = topY + 0.018
  const peakH = 0.38

  const mk = (rest: THREE.Vector3, rot: THREE.Vector3, sc = 1) => {
    out.push({
      rest,
      rot,
      sc,
      start: new THREE.Vector3(rest.x + (r() - 0.5) * 9, rest.y + 5 + r() * 7, rest.z + 1.5 + r() * 4),
      spin: new THREE.Vector3((r() - 0.5) * 8, (r() - 0.5) * 8, (r() - 0.5) * 8),
      a: r(),
    })
  }

  // 1. DENSE RIM SEALING RING (300 grains)
  // Completely eliminates any visible boundary gap between the brass rim and the rice mound
  const rimGrains = 300
  for (let i = 0; i < rimGrains; i++) {
    const ang = (i / rimGrains) * Math.PI * 2 + (r() - 0.5) * 0.018
    const rad = innerRimR * (0.97 + r() * 0.065)
    const y = innerRimY + 0.012 + (r() - 0.4) * 0.025
    const rot = new THREE.Vector3(
      Math.sin(ang) * -0.22 + (r() - 0.5) * 0.28,
      ang + Math.PI / 2 + (r() - 0.5) * 0.35,
      Math.cos(ang) * -0.22 + (r() - 0.5) * 0.28,
    )
    const sc = 0.95 + r() * 0.16
    mk(new THREE.Vector3(BOWL.x + Math.cos(ang) * rad, y, BOWL.z + Math.sin(ang) * rad), rot, sc)
  }

  // 2. HEAPED OVERFLOWING RICE MOUND (2,500 grains)
  // Multi-layered interlocking grains spanning from crest dome down across the rim
  for (let i = 0; i < 2500; i++) {
    const u = Math.sqrt(r())
    const rad = u * innerRimR * 0.985
    const ang = r() * Math.PI * 2
    const frac = rad / innerRimR
    const dome = Math.pow(Math.max(0, 1 - Math.pow(frac, 1.75)), 0.76)
    const surf = innerRimY + peakH * dome

    const layerType = r()
    const depth = layerType < 0.60
      ? 0.014 * r()
      : layerType < 0.88
        ? 0.038 + 0.025 * r()
        : 0.075 + 0.04 * r()
    const y = surf - depth

    const slope = -Math.atan2(peakH * 1.75 * Math.pow(frac, 0.75), innerRimR) * 0.45
    const rot = new THREE.Vector3(
      Math.sin(ang) * slope + (r() - 0.5) * 0.32,
      r() * Math.PI * 2,
      Math.cos(ang) * slope + (r() - 0.5) * 0.32,
    )
    const sc = 0.92 + r() * 0.18
    mk(new THREE.Vector3(BOWL.x + Math.cos(ang) * rad, y, BOWL.z + Math.sin(ang) * rad), rot, sc)
  }

  // 3. GENEROUS GROUND CASCADE SPILL (950 grains)
  // Cascades over the front-left rim of the bowl and fans toward the sack
  for (let i = 0; i < 950; i++) {
    const u = r()
    const d = 0.85 + u * 2.4
    const spreadW = 0.22 + u * 0.85
    const lateral = (r() - 0.5) * spreadW

    const baseAngle = Math.PI * 0.82 + Math.sin(u * 2.1) * 0.28
    const x = BOWL.x + Math.cos(baseAngle) * d + lateral * Math.sin(baseAngle)
    const z = BOWL.z + Math.sin(baseAngle) * d * 0.95 - lateral * Math.cos(baseAngle)

    let y: number
    if (d < 1.35) {
      const pourFrac = (1.35 - d) / 0.5
      y = 0.04 + pourFrac * 0.48 * (0.6 + 0.4 * r())
    } else {
      const moundCenter = 1 - Math.abs(lateral / (spreadW * 0.5 + 0.001))
      y = 0.022 + moundCenter * (1 - u * 0.7) * 0.045 * (0.5 + 0.5 * r())
    }

    const rot = new THREE.Vector3(
      (r() - 0.5) * 0.16,
      baseAngle + (r() - 0.5) * 1.2,
      (r() - 0.5) * 0.16,
    )
    const sc = 0.92 + r() * 0.18
    mk(new THREE.Vector3(x, y, z), rot, sc)
  }

  // 4. PLATTER BASE PERIMETER HEAP (650 grains)
  // Grains pooled tightly around the brass platter base
  for (let i = 0; i < 650; i++) {
    const ang = r() * Math.PI * 2
    const dist = 1.14 + Math.pow(r(), 1.6) * 0.45
    const x = BOWL.x + Math.cos(ang) * dist
    const z = BOWL.z + Math.sin(ang) * dist * 0.88
    const closeness = Math.max(0, 1 - (dist - 1.14) / 0.45)
    const y = 0.022 + closeness * 0.035 * r()

    const rot = new THREE.Vector3((r() - 0.5) * 0.14, r() * Math.PI * 2, (r() - 0.5) * 0.14)
    const sc = 0.90 + r() * 0.18
    mk(new THREE.Vector3(x, y, z), rot, sc)
  }

  // 5. EXTENDED FLOOR SCATTER & DRIFTS (800 grains)
  // Loose artistic stray grains scattered across the entire studio table
  let placed = 0
  let attempts = 0
  while (placed < 800 && attempts < 2500) {
    attempts++
    const gx = -2.8 + r() * 5.8
    const gz = -0.5 + r() * 3.8

    if (Math.abs(gx - (-1.35)) < 1.15 && Math.abs(gz - (-0.48)) < 0.42) continue
    if (Math.hypot(gx - BOWL.x, gz - BOWL.z) < 1.12) continue

    const gy = 0.021 + r() * 0.008
    const rot = new THREE.Vector3((r() - 0.5) * 0.10, r() * Math.PI * 2, (r() - 0.5) * 0.10)
    const sc = 0.90 + r() * 0.20
    mk(new THREE.Vector3(gx, gy, gz), rot, sc)
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
    scene.environmentIntensity = 0.75

    // Primary warm sunlight (soft studio spotlight key)
    const sun = new THREE.DirectionalLight('#fff3df', 3.8)
    sun.position.set(-4.5, 8.5, 5.5)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const sc = sun.shadow.camera
    sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 25
    sun.shadow.radius = 8
    sun.shadow.bias = -0.0003
    sun.shadow.normalBias = 0.02

    // Soft warm ambient light (eliminates harsh black shadows)
    const amb = new THREE.AmbientLight('#faeedc', 0.85)

    // Soft sky fill
    const fill = new THREE.DirectionalLight('#e0ecd8', 1.1)
    fill.position.set(6, 3.5, 4)

    // Back rim light (picks up bag woven sheen, crepe tape & rice translucency)
    const backRim = new THREE.DirectionalLight('#ffffff', 2.2)
    backRim.position.set(-2, 4.5, -5)

    // Warm floor bounce point light
    const floorBounce = new THREE.PointLight('#fce5b3', 1.8, 8)
    floorBounce.position.set(0.5, 0.4, 1.0)

    scene.add(sun, amb, fill, backRim, floorBounce)

    // Studio ground plane with subtle warm satin gradient
    const groundTex = makeStudioGroundTexture()
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.65,
      metalness: 0.02,
    })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.002
    ground.receiveShadow = true
    scene.add(ground)

    // Contact shadows (Ambient Occlusion grounding)
    const contactTex = makeContactShadowTexture()
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    })

    // Contact shadow directly beneath 30kg sack base
    const bagContact = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.45), contactMat)
    bagContact.rotation.x = -Math.PI / 2
    bagContact.position.set(-1.35, 0.004, -0.48)
    scene.add(bagContact)

    // Contact shadow directly beneath brass bowl
    const bowlContact = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), contactMat)
    bowlContact.rotation.x = -Math.PI / 2
    bowlContact.position.set(BOWL.x, 0.004, BOWL.z)
    scene.add(bowlContact)

    // Soft contact shadow under the spilled rice cascade
    const spillContact = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), contactMat)
    spillContact.rotation.x = -Math.PI / 2
    spillContact.position.set(BOWL.x - 1.0, 0.003, BOWL.z + 0.45)
    scene.add(spillContact)

    const bag = makeBag(P.current.name)
    const bowl = makeBowl()
    scene.add(bag.group, bowl.mesh, bowl.bedMesh)

    // Translucent grains for bowl and falling curtain
    const geo = makeGrainGeometry(false)
    const mat = makeGrainMaterial({
      color: '#fdfbf4',
      transmission: 0.74,
      thickness: 1.4,
      roughness: 0.2,
      ior: 1.51,
    })

    const insts = buildInstances()
    const riceMesh = new THREE.InstancedMesh(geo, mat, insts.length)
    riceMesh.castShadow = true
    riceMesh.receiveShadow = true
    riceMesh.frustumCulled = false

    // Natural tone variations across individual grains in the pile
    const toneRand = rng(882)
    const cVar = new THREE.Color()
    for (let i = 0; i < insts.length; i++) {
      const v = toneRand()
      if (v < 0.22) {
        cVar.set('#ffffff') // pure chalky white
      } else if (v < 0.82) {
        cVar.set('#fdf9f0') // pearlescent translucent white
      } else {
        cVar.set('#f7eedb') // aged golden-cream grain
      }
      riceMesh.setColorAt(i, cVar)
    }
    riceMesh.instanceColor!.needsUpdate = true
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
    for (let i = 0; i < curtain.length; i++) {
      const v = toneRand()
      cVar.set(v < 0.22 ? '#ffffff' : v < 0.82 ? '#fdf9f0' : '#f7eedb')
      curtainMesh.setColorAt(i, cVar)
    }
    curtainMesh.instanceColor!.needsUpdate = true
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
        dummy.scale.set(Lg * n.sc, Tg * n.sc, Tg * n.sc)
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
      const bedProgress = sm(t, 0.04, 0.36)
      bowl.bedMesh.scale.set(1, 0.2 + 0.8 * bedProgress, 1)
      bowl.bedMesh.position.y = (1 - bedProgress) * -0.06
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
      groundMat.dispose()
      groundTex.dispose()
      bagContact.geometry.dispose()
      bowlContact.geometry.dispose()
      spillContact.geometry.dispose()
      contactMat.dispose()
      contactTex.dispose()
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
