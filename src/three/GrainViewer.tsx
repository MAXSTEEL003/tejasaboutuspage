import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { makeGrainGeometry, makeGrainMaterial } from './grain'

type Props = {
  mm: number
  width: number
  color: string
  active: boolean
  onTouch: () => void
}

const MAX_MM = 8.3
const VIEW_W = 10
const FILL = 8

export default function GrainViewer(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const shadow = useRef<HTMLDivElement>(null)
  const P = useRef(props)
  P.current = props
  const st = useRef({ yaw: 0, roll: -0.25, vy: 0, vr: 0, drag: false, lx: 0, ly: 0, touched: false, pulse: 0, lastMm: props.mm })

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ canvas: canvas.current!, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const pm = new THREE.PMREMGenerator(renderer)
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.95

    // Lighting specifically tuned for translucent organic materials
    const key = new THREE.DirectionalLight('#fff6e6', 2.8)
    key.position.set(-4, 5, 5)
    
    // Backlight: shines directly THROUGH the grain towards the camera to illuminate the translucent volume
    const backlight = new THREE.DirectionalLight('#ffffff', 3.4)
    backlight.position.set(1, 2, -6)
    
    const rim = new THREE.DirectionalLight('#e8f2ff', 1.8)
    rim.position.set(5, 1, -3)
    
    const fill = new THREE.DirectionalLight('#faf4ea', 1.2)
    fill.position.set(0, -3, 3)
    
    const ambient = new THREE.AmbientLight('#ffffff', 0.7)
    scene.add(key, backlight, rim, fill, ambient)

    const fov = 14
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100)
    
    // Outer translucent vitreous hull
    const geo = makeGrainGeometry(false)
    const mat = makeGrainMaterial({
      transmission: 0.82,
      thickness: 1.6,
      roughness: 0.18,
      ior: 1.51,
    })
    const mesh = new THREE.Mesh(geo, mat)

    // Inner chalky starchy core (gives deep translucent realism seen in real rice photos)
    const coreGeo = makeGrainGeometry(true)
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#faf7f0'),
      roughness: 0.7,
      metalness: 0.0,
      transparent: true,
      opacity: 0.82,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)

    const group = new THREE.Group()
    group.add(coreMesh)
    group.add(mesh)
    scene.add(group)

    const cur = { L: (FILL * P.current.mm) / MAX_MM, T: (FILL * P.current.width) / MAX_MM }
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
        k.vy += 9
        k.pulse = 1
      }
      k.pulse *= 0.93
      const tL = (FILL * p.mm) / MAX_MM
      const tT = (FILL * p.width) / MAX_MM
      cur.L += (tL - cur.L) * 0.11 * dt
      cur.T += (tT - cur.T) * 0.11 * dt
      tint.set(p.color)
      mat.color.lerp(tint, 0.1)

      if (!k.drag) {
        k.yaw += k.vy * dt
        k.roll += k.vr * dt
        k.vy *= 0.94
        k.vr *= 0.94
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          k.roll += 0.006 * dt
          k.yaw += (Math.sin(now / 1800) * 0.24 - k.yaw) * 0.012 * dt
        }
      }
      const bump = 1 + k.pulse * 0.06
      mesh.scale.set(cur.L * bump, cur.T * bump, cur.T * bump)
      coreMesh.scale.set(cur.L * bump, cur.T * bump, cur.T * bump)
      group.rotation.set(k.roll, k.yaw, -0.12, 'ZYX')
      renderer.render(scene, camera)

      const sd = shadow.current
      if (sd) {
        const pxu = el.clientWidth / VIEW_W
        const spread = Math.abs(Math.cos(k.yaw)) * 0.3 + 0.7
        sd.style.width = `${cur.L * pxu * 0.9 * spread}px`
        sd.style.transform = `translate(-50%, ${(cur.T * 0.5 + 0.9) * pxu}px)`
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
    const k = st.current
    k.drag = true
    k.lx = e.clientX
    k.ly = e.clientY
    k.vy = 0
    k.vr = 0
    e.currentTarget.setPointerCapture(e.pointerId)
    if (!k.touched) {
      k.touched = true
      P.current.onTouch()
    }
  }
  const onMove = (e: React.PointerEvent) => {
    const k = st.current
    if (!k.drag) return
    const dx = e.clientX - k.lx
    const dy = e.clientY - k.ly
    k.lx = e.clientX
    k.ly = e.clientY
    k.yaw += dx * 0.009
    k.roll -= dy * 0.011
    k.vy = dx * 0.005
    k.vr = -dy * 0.006
  }
  const onUp = () => {
    st.current.drag = false
  }

  return (
    <div
      ref={host}
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div ref={shadow} className="pointer-events-none absolute left-1/2 top-1/2 h-10 rounded-[50%] bg-earth/25 blur-2xl" />
      <canvas ref={canvas} className="relative block h-full w-full" />
    </div>
  )
}
