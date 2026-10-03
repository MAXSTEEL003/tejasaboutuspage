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



/* ---------- photorealistic flagship Keshar Kali bag ---------- */
function makeBag(_name?: string) {
  const g = new THREE.Group()

  // Real packaging aspect ratio: 610w x 862h
  const h = 3.3
  const w = h * (610 / 862) // 2.335

  // Subtle natural convex curvature so it catches real-time specular light and shadow
  const segmentsX = 24
  const segmentsY = 32
  const geo = new THREE.PlaneGeometry(w, h, segmentsX, segmentsY)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const u = x / (w * 0.5) // -1 to 1
    const v = y / (h * 0.5) // -1 to 1
    // Subtle plump pillow bulge that settles more in lower half
    const bulge = Math.cos(u * Math.PI * 0.45) * 0.16 * (0.85 - 0.25 * v)
    pos.setZ(i, bulge)
  }
  geo.computeVertexNormals()

  const texLoader = new THREE.TextureLoader()
  const tex = texLoader.load('/images/kesharkali_cutout_perfect.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16

  const bumpTex = makeWovenSackBumpTexture(24, 36)
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex,
    bumpMap: bumpTex,
    bumpScale: 0.002,
    transparent: true,
    alphaTest: 0.1,
    depthWrite: true,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.65,
    clearcoatRoughness: 0.14,
    sheen: 0.5,
    side: THREE.DoubleSide,
  })

  const bagMesh = new THREE.Mesh(geo, mat)
  bagMesh.castShadow = true
  bagMesh.receiveShadow = true
  // Center is at y = h / 2, so bottom rests right on ground (y = 0)
  bagMesh.position.set(0, h * 0.5, 0)

  g.add(bagMesh)
  g.position.set(-1.45, 0, -0.2)
  g.rotation.y = 0.06

  const redraw = (_n?: string) => {
    tex.needsUpdate = true
  }

  const dispose = () => {
    geo.dispose()
    mat.dispose()
    tex.dispose()
    bumpTex.dispose()
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
    const bagContact = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.4), contactMat)
    bagContact.rotation.x = -Math.PI / 2
    bagContact.position.set(-1.45, 0.004, -0.2)
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

    const cam0 = new THREE.Vector3(0.5, 2.2, 8.4)
    const look0 = new THREE.Vector3(0.1, 1.45, 0.4)
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

      // camera pull-back & composition framing
      const aspect = w / h
      const dEnd = Math.max(8.8, 7.6 / (2 * Math.tan((fov * Math.PI) / 360) * aspect))
      const look1 = new THREE.Vector3(0.1, 1.45, 0.4)
      const cam1 = new THREE.Vector3(0.5, 2.2, dEnd)
      camera.position.lerpVectors(cam0, cam1, tc)
      tgt.lerpVectors(look0, look1, tc)
      const dist = camera.position.distanceTo(tgt)
      const visW = 2 * dist * Math.tan((fov * Math.PI) / 360) * aspect
      tgt.x += p.shift * visW * tc
      camera.lookAt(tgt)

      bag.group.position.y = (1 - sm(t, 0.1, 0.6)) * 0.08
      const bedProgress = sm(t, 0.04, 0.36)
      bowl.bedMesh.scale.set(1, 0.2 + 0.8 * bedProgress, 1)
      bowl.bedMesh.position.y = (1 - bedProgress) * -0.06
      renderer.toneMappingExposure = 0.92 + 0.18 * tc
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
