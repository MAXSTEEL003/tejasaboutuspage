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

/* ---------- textures ---------- */
function weaveTexture(repeatX: number, repeatY: number) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#777'
  ctx.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 4) {
    for (let x = 0; x < 128; x += 4) {
      const on = ((x + y) / 4) % 2 === 0
      ctx.fillStyle = on ? '#a8a8a8' : '#5c5c5c'
      ctx.fillRect(x, y, 4, 4)
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  return tex
}

const LEAF =
  'M12 22V8M12 8c-3-1-4-4-4-6 3 0 4 3 4 6zm0 0c3-1 4-4 4-6-3 0-4 3-4 6zm0 6c-3-1-4-3-4-5m4 5c3-1 4-3 4-5m-4 9c-2-1-3-2-3-4m3 4c2-1 3-2 3-4'

function drawBag(cv: HTMLCanvasElement, name: string, front: boolean) {
  const ctx = cv.getContext('2d')!
  const W = cv.width
  const H = cv.height
  const olive = '#5d6b43'
  const earth = '#3b2f22'
  ctx.clearRect(0, 0, W, H)
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, '#efe5cf')
  g.addColorStop(0.5, '#f5eedd')
  g.addColorStop(1, '#eadfc7')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = 0.05
  ctx.fillStyle = earth
  for (let y = 0; y < H; y += 5) ctx.fillRect(0, y, W, 1)
  for (let x = 0; x < W; x += 5) ctx.fillRect(x, 0, 1, H)
  ctx.globalAlpha = 1

  ctx.fillStyle = olive
  ctx.fillRect(0, 0, W, H * 0.085)
  ctx.fillRect(0, H * 0.945, W, H * 0.055)
  ctx.strokeStyle = 'rgba(245,238,221,.75)'
  ctx.lineWidth = 3
  ctx.setLineDash([16, 12])
  ctx.beginPath()
  ctx.moveTo(0, H * 0.052)
  ctx.lineTo(W, H * 0.052)
  ctx.stroke()
  ctx.setLineDash([])
  if (!front) return

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.save()
  ctx.translate(W / 2 - 42, H * 0.2)
  ctx.scale(3.5, 3.5)
  ctx.strokeStyle = olive
  ctx.lineWidth = 1.3
  ctx.lineCap = 'round'
  ctx.stroke(new Path2D(LEAF))
  ctx.restore()

  ctx.fillStyle = earth
  ctx.font = '600 44px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '16px'
  ctx.fillText('TEJAS CANVASSING', W / 2 + 8, H * 0.3)
  ctx.strokeStyle = 'rgba(59,47,34,.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W * 0.2, H * 0.345)
  ctx.lineTo(W * 0.8, H * 0.345)
  ctx.stroke()

  ctx.fillStyle = olive
  ctx.font = '600 30px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '12px'
  ctx.fillText('PREMIUM RICE', W / 2 + 6, H * 0.4)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  ctx.fillStyle = earth
  let size = 190
  ctx.font = `italic ${size}px "Instrument Serif", Georgia, serif`
  while (ctx.measureText(name).width > W * 0.82 && size > 60) {
    size -= 6
    ctx.font = `italic ${size}px "Instrument Serif", Georgia, serif`
  }
  ctx.fillText(name, W / 2, H * 0.53)

  // simple grain mark
  const gy = H * 0.64
  const gg = ctx.createLinearGradient(0, gy - 40, 0, gy + 40)
  gg.addColorStop(0, '#fffdf5')
  gg.addColorStop(1, '#cdbb90')
  ctx.fillStyle = gg
  ctx.strokeStyle = 'rgba(59,47,34,.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(W / 2, gy, 150, 36, -0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(59,47,34,.7)'
  ctx.font = '500 30px Manrope, sans-serif'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '8px'
  ctx.fillText('WHOLESALE RICE', W / 2 + 4, H * 0.82)
  ctx.fillText('NET WT. 25 KG', W / 2 + 4, H * 0.88)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'
}

/* ---------- bag ---------- */
function makeBag(name: string) {
  const w = 1.3
  const h = 1.95
  const D = 0.62
  const build = (sign: 1 | -1) => {
    const geo = new THREE.PlaneGeometry(w * 2, h * 2, 30, 44)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i)
      const y = pos.getY(i)
      const u = x / w
      const vv = y / h
      let bulge = D * Math.pow(Math.max(0, 1 - u * u), 0.55) * Math.pow(Math.max(0, 1 - vv * vv), 0.3)
      const k = THREE.MathUtils.smoothstep(vv, 0.76, 0.95)
      bulge *= 1 - k * 0.93
      x *= 1 - 0.05 * k
      const wr = Math.sin(x * 5.3 + y * 1.7) * 0.5 + Math.sin(x * 9.1 - y * 4.3) * 0.35 + Math.sin(y * 7.7 + x * 2.1) * 0.25
      let z = bulge + 0.014 * wr * (bulge / D) + k * 0.018 * Math.sin(x * 46)
      z = Math.max(0, z)
      pos.setX(i, x)
      pos.setZ(i, z * sign)
    }
    geo.computeVertexNormals()
    return geo
  }
  const frontCv = document.createElement('canvas')
  frontCv.width = 1024
  frontCv.height = 1536
  const backCv = document.createElement('canvas')
  backCv.width = 512
  backCv.height = 768
  drawBag(frontCv, name, true)
  drawBag(backCv, name, false)
  const frontTex = new THREE.CanvasTexture(frontCv)
  const backTex = new THREE.CanvasTexture(backCv)
  for (const t of [frontTex, backTex]) {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  }
  const bump = weaveTexture(26, 39)
  const mk = (map: THREE.Texture) =>
    new THREE.MeshPhysicalMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.5,
      roughness: 0.5,
      sheen: 0.6,
      sheenColor: new THREE.Color('#ffffff'),
      sheenRoughness: 0.55,
      clearcoat: 0.12,
      side: THREE.DoubleSide,
    })
  const fm = mk(frontTex)
  const bm = mk(backTex)
  const front = new THREE.Mesh(build(1), fm)
  const back = new THREE.Mesh(build(-1), bm)
  for (const m of [front, back]) {
    m.castShadow = true
    m.receiveShadow = true
  }
  const g = new THREE.Group()
  g.add(front, back)
  g.position.set(-1.35, h - 0.02, -0.5)
  g.rotation.y = 0.2
  const redraw = (n: string) => {
    drawBag(frontCv, n, true)
    frontTex.needsUpdate = true
  }
  const dispose = () => {
    front.geometry.dispose()
    back.geometry.dispose()
    fm.dispose()
    bm.dispose()
    frontTex.dispose()
    backTex.dispose()
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
    color: '#6b7a4e',
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: 0.2,
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
    scene.environmentIntensity = 0.55

    const sun = new THREE.DirectionalLight('#ffe3b8', 3.4)
    sun.position.set(-5, 7.5, 5)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const sc = sun.shadow.camera
    sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 25
    sun.shadow.radius = 7
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.02
    const fill = new THREE.DirectionalLight('#dfe6cc', 0.6)
    fill.position.set(6, 3, 4)
    scene.add(sun, fill)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.3 }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const bag = makeBag(P.current.name)
    const bowl = makeBowl()
    scene.add(bag.group, bowl.mesh)

    const geo = makeGrainGeometry()
    const mat = makeGrainMaterial('#f8f0dc')
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
      renderer.toneMappingExposure = 0.78 + 0.27 * tc
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
