import * as THREE from 'three'

/** Unit grain: length 1 along X, diameter 1. Scale per instance to size it. */
export function makeGrainGeometry() {
  const N = 80
  const raw: [number, number][] = []
  let maxR = 0
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const r = Math.pow(Math.sin(Math.PI * t), 0.72) * (0.86 + 0.28 * (1 - t))
    raw.push([r, t])
    maxR = Math.max(maxR, r)
  }
  const pts = raw.map(([r, t]) => new THREE.Vector2((r / maxR) * 0.5, t - 0.5))
  const g = new THREE.LatheGeometry(pts, 64)
  g.rotateZ(-Math.PI / 2)

  const pos = g.attributes.position
  const col = new Float32Array(pos.count * 3)
  const white = new THREE.Color(1, 1, 1)
  const tipTint = new THREE.Color(0.94, 0.84, 0.62)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i) * 0.88
    const t = x + 0.5
    const s = Math.sin(Math.PI * t)
    const th = Math.atan2(z, y)
    const d = th - Math.PI / 2
    const groove = 1 - 0.1 * Math.exp(-(d * d) / 0.09) * Math.pow(s, 0.5)
    pos.setY(i, y * groove)
    pos.setZ(i, z * groove)
    const tip = Math.pow(Math.abs(t * 2 - 1), 3)
    c.copy(white).lerp(tipTint, tip * 0.55)
    if (t < 0.07) c.multiplyScalar(0.86)
    col[i * 3] = c.r
    col[i * 3 + 1] = c.g
    col[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

function stripeTexture() {
  const cv = document.createElement('canvas')
  cv.width = 256
  cv.height = 128
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 128)
  let v = 0.5
  for (let x = 0; x < 256; x++) {
    v += (Math.random() - 0.5) * 0.22
    v = Math.min(0.85, Math.max(0.15, v))
    const g = Math.floor(v * 255)
    ctx.fillStyle = `rgb(${g},${g},${g})`
    ctx.fillRect(x, 0, 1, 128)
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

export function makeGrainMaterial(color = '#f6edd6') {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    vertexColors: true,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
    sheen: 0.5,
    sheenColor: new THREE.Color('#fff1cf'),
    sheenRoughness: 0.5,
    bumpMap: stripeTexture(),
    bumpScale: 1.5,
  })
}
