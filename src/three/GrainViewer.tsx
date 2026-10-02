import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { makeGrainGeometry, makeGrainMaterial } from './grain'

type Props = {
  mm: number
  width: number
  thickness?: number
  color: string
  active: boolean
  onTouch: () => void
}

const BASE_MM = 5.1
const VIEW_W = 10
const FILL = 7.6

export default function GrainViewer(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const shadow = useRef<HTMLDivElement>(null)
  const P = useRef(props)
  P.current = props
  const st = useRef({ yaw: 0.15, roll: -0.22, vy: 0, vr: 0, drag: false, lx: 0, ly: 0, touched: false, pulse: 0, lastMm: props.mm })

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ canvas: canvas.current!, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const pm = new THREE.PMREMGenerator(renderer)
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.95

    // Lighting specifically tuned for translucent organic rice grain volume
    const key = new THREE.DirectionalLight('#fff8eb', 3.0)
    key.position.set(-3.5, 4.5, 4.5)

    // Backlight: shines directly THROUGH the grain volume towards camera to illuminate translucency
    const backlight = new THREE.DirectionalLight('#ffffff', 3.8)
    backlight.position.set(0.8, 1.8, -5.5)

    const rim = new THREE.DirectionalLight('#e6f0ff', 2.0)
    rim.position.set(4.5, 1.2, -2.5)

    const fill = new THREE.DirectionalLight('#faf5ed', 1.3)
    fill.position.set(0, -3, 3)

    const ambient = new THREE.AmbientLight('#ffffff', 0.75)
    scene.add(key, backlight, rim, fill, ambient)

    const fov = 14
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100)

    // Outer translucent vitreous hull (matching Picture 2 reference)
    const geo = makeGrainGeometry(false)
    const mat = makeGrainMaterial({
      transmission: 0.85,
      thickness: 1.4,
      roughness: 0.18,
      ior: 1.51,
    })
    const mesh = new THREE.Mesh(geo, mat)

    // Inner chalky starchy core (gives internal depth seen in real rice photos)
    const coreGeo = makeGrainGeometry(true)
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#faf7f2'),
      roughness: 0.68,
      metalness: 0.0,
      transparent: true,
      opacity: 0.84,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)

    const group = new THREE.Group()
    group.add(coreMesh)
    group.add(mesh)
    scene.add(group)

    const initTh = P.current.thickness ?? 1.3
    const cur = {
      L: (FILL * P.current.mm) / BASE_MM,
      W: (FILL * P.current.width) / BASE_MM,
      Th: (FILL * initTh) / BASE_MM,
    }
    const tint = new THREE.Color(P.current.color)
    mat.color.copy(tint)

    const resize = () => {
      const w = Math.max(1, el.clientWidth)
      const h = Math.max(1, el.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      const d = VIEW_W / 2 / (Math.tan((fov * Math.PI) / 360) * camera.aspect)
      camera.position.set(0, 0, d)
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const p = P.current
      const dt = Math.min(2, (now - last) / 16.7)
      last = now
      if (!p.active) return
      const k = st.current

      if (p.mm !== k.lastMm) {
        k.lastMm = p.mm
        k.vy += 8
        k.pulse = 1
      }
      k.pulse *= 0.93

      const targetTh = p.thickness ?? 1.3
      const tL = (FILL * p.mm) / BASE_MM
      const tW = (FILL * p.width) / BASE_MM
      const tTh = (FILL * targetTh) / BASE_MM

      cur.L += (tL - cur.L) * 0.11 * dt
      cur.W += (tW - cur.W) * 0.11 * dt
      cur.Th += (tTh - cur.Th) * 0.11 * dt
      tint.set(p.color)
      mat.color.lerp(tint, 0.1)

      if (!k.drag) {
        k.yaw += k.vy * dt
        k.roll += k.vr * dt
        k.vy *= 0.94
        k.vr *= 0.94
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          k.roll += 0.005 * dt
          k.yaw += (Math.sin(now / 1900) * 0.22 - k.yaw) * 0.012 * dt
        }
      }
      const bump = 1 + k.pulse * 0.06
      mesh.scale.set(cur.L * bump, cur.Th * bump, cur.W * bump)
      coreMesh.scale.set(cur.L * bump, cur.Th * bump, cur.W * bump)
      group.rotation.set(k.roll, k.yaw, -0.10, 'ZYX')
      renderer.render(scene, camera)

      const sd = shadow.current
      if (sd) {
        const pxu = el.clientWidth / VIEW_W
        const spread = Math.abs(Math.cos(k.yaw)) * 0.3 + 0.7
        sd.style.width = `${cur.L * pxu * 0.9 * spread}px`
        sd.style.transform = `translate(-50%, ${(cur.Th * 0.5 + 0.9) * pxu}px)`
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      geo.dispose()
      mat.dispose()
      coreGeo.dispose()
      coreMat.dispose()
      pm.dispose()
      renderer.dispose()
    }
  }, [])

  const onDown = (e: React.PointerEvent) => {
    st.current.drag = true
    st.current.lx = e.clientX
    st.current.ly = e.clientY
    st.current.vy = 0
    st.current.vr = 0
    if (!st.current.touched) {
      st.current.touched = true
      props.onTouch()
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onMove = (e: React.PointerEvent) => {
    if (!st.current.drag) return
    const dx = e.clientX - st.current.lx
    const dy = e.clientY - st.current.ly
    st.current.lx = e.clientX
    st.current.ly = e.clientY
    st.current.yaw += dx * 0.008
    st.current.roll += dy * 0.008
    st.current.vy = dx * 0.008
    st.current.vr = dy * 0.008
  }

  const onUp = (e: React.PointerEvent) => {
    st.current.drag = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  return (
    <div ref={host} className="relative h-full w-full select-none touch-none cursor-grab active:cursor-grabbing" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div ref={shadow} className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-8 -translate-x-1/2 rounded-full bg-earth/25 blur-xl transition-all duration-700" />
    </div>
  )
}
