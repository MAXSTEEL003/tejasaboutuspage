import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import GrainViewer from '../three/GrainViewer'
import FinalScene from '../three/FinalScene'
import { VARIETIES, MAX_MM } from '../data'

/* ---------- assets ---------- */
const U = (id: string, w = 1800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&fit=crop&auto=format&q=80`
const IMG = {
  farm: U('1728895604559-a4e16081504e', 2200),
  hand: U('1711060221380-acfa2c82cc99', 2200),
  scoop: U('1711060266983-92bd378c850c'),
  sack: U('1645331465778-eb409d112198'),
  pile: U('1686820740687-426a7b9b2043'),
  pile2: U('1723475158232-819e29803f4d'),
}

/* ---------- math ---------- */
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
const ez = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const s = (p: number, a: number, b: number) => ez(seg(p, a, b))
const win = (p: number, a: number, b: number, c: number, d: number) =>
  s(p, a, b) * (1 - s(p, c, d))

const RM =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
const M = RM ? 0 : 1 // motion multiplier for zoom / parallax

const TOTAL_VH = 1600
const CHAPTERS = [
  { name: 'Farm', at: 0.0 },
  { name: 'Harvest', at: 0.19 },
  { name: 'Grain', at: 0.46 },
  { name: 'Process', at: 0.72 },
  { name: 'Product', at: 0.91 },
]

/* ---------- smoothed scroll progress ---------- */
function useStageProgress(ref: RefObject<HTMLElement | null>) {
  const [state, setState] = useState({ p: 0, past: false })
  useEffect(() => {
    let target = 0
    let pastTarget = false
    let cur = 0
    let raf = 0
    const loop = () => {
      raf = 0
      cur += (target - cur) * (RM ? 1 : 0.075)
      if (Math.abs(target - cur) < 0.00008) cur = target
      setState((prev) =>
        Math.abs(prev.p - cur) < 0.0001 && prev.past === pastTarget
          ? prev
          : { p: cur, past: pastTarget },
      )
      if (cur !== target) raf = requestAnimationFrame(loop)
    }
    const read = () => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      target = clamp(-r.top / Math.max(1, r.height - window.innerHeight))
      pastTarget = r.bottom < window.innerHeight * 0.5
      if (!raf) raf = requestAnimationFrame(loop)
    }
    read()
    cur = target
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return state
}

/* ---------- grain illustration ---------- */
export function Grain({
  v, className = '', svgRef, sheenRef,
}: {
  v: (typeof VARIETIES)[number]; className?: string; svgRef?: RefObject<SVGSVGElement | null>; sheenRef?: RefObject<SVGGElement | null>
}) {
  const W = 300 * v.length + 120
  const H = 100
  const id = 'g' + useId().replace(/:/g, '')
  const body = `M2 50 C ${W * 0.1} 6, ${W * 0.62} -2, ${W - 2} 50 C ${W * 0.62} 102, ${W * 0.1} 94, 2 50 Z`
  return (
    <svg ref={svgRef} viewBox={`-4 -8 ${W + 8} ${H + 16}`} className={className} style={{ overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={v.tone[0]} />
          <stop offset="0.55" stopColor={v.tone[1]} />
          <stop offset="1" stopColor={v.tone[2]} />
        </linearGradient>
        <linearGradient id={id + 'e'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={v.tone[2]} stopOpacity=".5" />
          <stop offset="0.15" stopColor={v.tone[2]} stopOpacity="0" />
          <stop offset="0.85" stopColor={v.tone[2]} stopOpacity="0" />
          <stop offset="1" stopColor={v.tone[2]} stopOpacity=".55" />
        </linearGradient>
        <radialGradient id={id + 's'}>
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id + 'c'}><path d={body} /></clipPath>
      </defs>
      <path d={body} fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`}>
        <path d={body} fill={`url(#${id}e)`} />
        {[0.3, 0.5, 0.7].map((f, i) => (
          <path key={i} d={`M6 ${H * f} C ${W * 0.3} ${H * f - 8 * (1 - f)}, ${W * 0.65} ${H * f - 8 * (1 - f)}, ${W - 6} ${H * 0.5 + (f - 0.5) * 12}`}
            stroke={v.tone[2]} strokeOpacity={i === 1 ? 0.5 : 0.25} strokeWidth={i === 1 ? 1.6 : 1} fill="none" />
        ))}
        <g ref={sheenRef}>
          <ellipse cx={W * 0.42} cy="24" rx={W * 0.28} ry="12" fill={`url(#${id}s)`} />
        </g>
        <path d={`M2 50 C ${W * 0.1} 94, ${W * 0.62} 102, ${W - 2} 50`} stroke="#6b5636" strokeOpacity=".22" strokeWidth="10" fill="none" style={{ filter: 'blur(5px)' }} />
      </g>
    </svg>
  )
}

/* ---------- small pieces ---------- */
export function Label({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${light ? 'text-white/80' : 'text-paddy'}`}>
      {children}
    </span>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 22V8M12 8c-3-1-4-4-4-6 3 0 4 3 4 6zm0 0c3-1 4-4 4-6-3 0-4 3-4 6zm0 6c-3-1-4-3-4-5m4 5c3-1 4-3 4-5m-4 9c-2-1-3-2-3-4m3 4c2-1 3-2 3-4" />
      </svg>
      <span className="text-[12px] font-semibold uppercase tracking-[0.3em]">Tejas Canvassing</span>
    </div>
  )
}

const layer = (o: number): React.CSSProperties => ({
  opacity: o,
  visibility: o < 0.005 ? 'hidden' : 'visible',
  pointerEvents: o > 0.6 ? 'auto' : 'none',
})

/* ---------- Scene 1 ---------- */
function Farm({ p }: { p: number }) {
  const z = 1 + 2.1 * s(p, 0, 0.22) * M
  const out = 1 - s(p, 0.17, 0.24)
  const head = 1 - s(p, 0.02, 0.09)
  const cap = win(p, 0.08, 0.12, 0.15, 0.19)
  return (
    <div className="absolute inset-0 bg-earth" style={layer(out)}>
      <img
        src={IMG.farm} alt="Golden rice paddy at sunrise"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{ transform: `scale(${z}) translate3d(0, ${-s(p, 0, 0.22) * 5 * M}%, 0)`, transformOrigin: '50% 64%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 to-black/65" />
      <div
        className="absolute inset-x-6 bottom-[17vh] max-w-3xl text-white md:left-12"
        style={{ opacity: head, transform: `translate3d(0, ${(1 - head) * -50}px, 0)` }}
      >
        <div className="rise" style={{ animationDelay: '.1s' }}><Label light>Scene 01 · The Farm</Label></div>
        <h1 className="mt-4 text-[clamp(2.7rem,8.4vw,6.8rem)] font-light leading-[0.98] tracking-tight">
          <span className="rise block" style={{ animationDelay: '.25s' }}>From the Earth,</span>
          <span className="rise block font-serif italic" style={{ animationDelay: '.45s' }}>to Your Table.</span>
        </h1>
        <p className="rise mt-5 max-w-sm text-base text-white/85" style={{ animationDelay: '.7s' }}>
          Discover the journey behind every grain.
        </p>
      </div>
      <div className="rise absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/80" style={{ opacity: head, animationDelay: '1.1s' }}>
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="scroll-cue block h-8 w-px bg-white/80" />
      </div>
      <div className="absolute inset-x-6 top-1/2 max-w-xl text-white md:left-12" style={{ opacity: cap, transform: `translate3d(0, ${-50 + (1 - cap) * 4}%, 0)` }}>
        <p className="font-serif text-4xl italic leading-tight md:text-6xl">Every stalk carries a season of patience.</p>
      </div>
    </div>
  )
}

/* ---------- Scene 2 ---------- */
function Harvest({ p }: { p: number }) {
  const o = s(p, 0.17, 0.24) * (1 - s(p, 0.38, 0.45))
  const arrive = s(p, 0.17, 0.3)
  const z = (1.5 - 0.5 * arrive) * (1 + 1.7 * s(p, 0.3, 0.44)) * (M ? 1 : 1.0)
  const txt = win(p, 0.25, 0.3, 0.33, 0.37)
  const look = win(p, 0.34, 0.39, 0.4, 0.44)
  return (
    <div className="absolute inset-0 bg-earth" style={layer(o)}>
      <img
        src={IMG.hand} alt="Hands holding freshly harvested grain"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{ transform: `scale(${M ? z : 1})`, transformOrigin: '50% 56%', filter: `blur(${(1 - arrive) * 10 * M}px)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/35" />
      <div
        className="absolute inset-x-6 bottom-[14vh] max-w-xl text-white md:left-12"
        style={{ opacity: txt, transform: `translate3d(0, ${(1 - txt) * 36}px, 0)` }}
      >
        <Label light>Scene 02 · The Harvest</Label>
        <h2 className="mt-4 text-[clamp(2.3rem,6vw,4.6rem)] font-light leading-tight tracking-tight">
          Gathered by hand,<br /><span className="font-serif italic">judged by eye.</span>
        </h2>
        <p className="mt-4 max-w-sm text-white/85">Each lot is sourced from trusted growers and inspected at the field edge.</p>
      </div>
      <div className="absolute inset-x-0 top-[38%] text-center text-white" style={{ opacity: look, transform: `scale(${0.96 + look * 0.04})` }}>
        <p className="font-serif text-4xl italic md:text-6xl">Now, look closer.</p>
      </div>
    </div>
  )
}

/* ---------- Scene 3 : explore the grain ---------- */
function Explore({ p, sel, setSel }: { p: number; sel: number; setSel: (n: number) => void }) {
  const v = VARIETIES[sel]
  const o = s(p, 0.4, 0.47) * (1 - s(p, 0.69, 0.72))
  const entry = s(p, 0.41, 0.5)
  const ui = s(p, 0.47, 0.53) * (1 - s(p, 0.6, 0.64))
  const exit = s(p, 0.62, 0.71)
  const active = o > 0.02 && exit < 0.98
  const [touched, setTouched] = useState(false)

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setSel((sel + 1) % VARIETIES.length)
    if (e.key === 'ArrowLeft') setSel((sel + VARIETIES.length - 1) % VARIETIES.length)
  }

  const scale = (0.3 + 0.7 * entry) * (1 + exit * exit * 7)
  const blur = (1 - entry) * 14 * M

  return (
    <div className="absolute inset-0 overflow-hidden bg-ivory" style={layer(o)}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 48%, #fffdf7 0%, #f3ead8 60%, #e9dfc8 100%)' }} />
      <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: v.tint, opacity: 0.45, mixBlendMode: 'multiply' }} />

      <div key={v.name} className="ghost-in pointer-events-none absolute inset-x-0 top-[26%] select-none whitespace-nowrap text-center font-serif italic leading-none text-earth/[0.055]" style={{ fontSize: 'clamp(6rem,24vw,22rem)', opacity: ui }}>
        {v.name.split(' ')[0]}
      </div>

      <div className="relative mx-auto grid h-full max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] gap-2 px-6 pb-5 pt-20 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] md:grid-rows-[minmax(0,1fr)_auto] md:gap-x-10 md:px-12 md:pb-8 md:pt-24">
        <div className="min-w-0 md:self-center" style={{ opacity: ui, transform: `translate3d(0, ${(1 - ui) * 30}px, 0)` }}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Label>Scene 03 · Explore the Grain</Label>
            <span className="h-px w-8 bg-earth/25" />
            <span className="whitespace-nowrap text-[11px] tabular-nums tracking-[0.2em] text-earth/55">0{sel + 1} / 0{VARIETIES.length}</span>
          </div>
          <h2 key={v.name} className="rise mt-3 text-[clamp(2rem,5vw,4rem)] font-light leading-[1.02] tracking-tight">{v.name}</h2>
          <p key={v.note} className="rise mt-2 max-w-sm text-sm leading-relaxed text-earth/70 md:text-base" style={{ animationDelay: '.08s' }}>{v.note}</p>

          <div className="mt-6 hidden md:block">
            <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-earth/50">Length, drawn to scale</div>
            <div className="space-y-2.5">
              {VARIETIES.map((x, i) => (
                <button key={x.name} onClick={() => setSel(i)} className="group flex min-h-[28px] w-full items-center gap-3 text-left" aria-label={`Select ${x.name}`}>
                  <span className="w-24 shrink-0 text-xs text-earth/60 transition-colors group-hover:text-earth">{x.name}</span>
                  <span className="relative h-[3px] flex-1 rounded-full bg-earth/10">
                    <span className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${i === sel ? 'bg-paddy' : 'bg-earth/35 group-hover:bg-earth/55'}`} style={{ width: `${(x.mm / MAX_MM) * 100}%`, height: i === sel ? 5 : 3, top: i === sel ? -1 : 0 }} />
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-earth/60">{x.len}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-0 min-w-0" role="img" aria-label={`${v.name} rice grain in 3D. Drag to rotate.`}>
          <div className="absolute inset-0" style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity: 1 - s(p, 0.66, 0.705) }}>
            <GrainViewer mm={v.mm} width={v.width} color={v.tone[0]} active={active} onTouch={() => setTouched(true)} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-[2%] flex flex-col items-center" style={{ opacity: ui * (1 - seg(p, 0.6, 0.62)) }}>
            <div className="relative h-3 transition-[width] duration-1000 ease-out" style={{ width: `${(v.mm / MAX_MM) * 80}%` }}>
              <span className="absolute inset-x-0 top-1/2 h-px bg-earth/35" />
              <span className="absolute left-0 top-0 h-full w-px bg-earth/50" />
              <span className="absolute right-0 top-0 h-full w-px bg-earth/50" />
            </div>
            <span className="mt-1 text-[11px] tabular-nums tracking-[0.2em] text-earth/65">{v.len} · avg. raw length</span>
          </div>

          <div className="pointer-events-none absolute right-0 top-3 flex items-center gap-2 whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-earth/50 transition-opacity duration-500" style={{ opacity: touched ? 0 : ui }}>
            <span className="nudge inline-block">⟷</span> Drag to inspect
          </div>
        </div>

        <div className="min-w-0 md:col-span-2" style={{ opacity: ui, transform: `translate3d(0, ${(1 - ui) * 40}px, 0)` }}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-earth/15 pt-4 text-sm md:grid-cols-4">
            {[['Grain length', v.len], ['Texture', v.texture], ['Aroma', v.aroma], ['Ageing', v.aged]].map(([k, val]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.25em] text-earth/50">{k}</dt>
                <dd key={val} className="rise mt-0.5 font-medium">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="no-scrollbar -mx-6 mt-4 flex w-[calc(100%+3rem)] min-w-0 gap-2 overflow-x-auto px-6 md:mx-0 md:grid md:w-full md:grid-cols-4 md:px-0" role="tablist" aria-label="Rice variety" onKeyDown={onKey}>
            {VARIETIES.map((x, i) => (
              <button
                key={x.name} role="tab" aria-selected={i === sel} tabIndex={i === sel ? 0 : -1}
                onClick={() => setSel(i)}
                className={`group relative flex min-h-[44px] shrink-0 items-center gap-3 overflow-hidden rounded-full border px-4 py-3 text-left text-sm transition-all duration-500 md:justify-center ${
                  i === sel ? 'border-earth bg-earth text-rice shadow-lg shadow-earth/20' : 'border-earth/20 text-earth/80 hover:border-earth/55 hover:bg-rice/60'
                }`}
              >
                <span className="h-2.5 shrink-0 rounded-[50%] transition-transform duration-500 group-hover:scale-110" style={{ width: 10 + (x.mm / MAX_MM) * 18, background: `linear-gradient(${x.tone[0]}, ${x.tone[2]})`, border: '1px solid rgba(0,0,0,.12)' }} />
                <span className="whitespace-nowrap">{x.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Scene 4 ---------- */
const STAGES = [
  { t: 'Cleaning', d: 'Stones, husk fragments and dust are lifted away by air and sieve.', chip: '99.9% impurities removed', img: IMG.sack, pos: '50% 40%' },
  { t: 'Dehusking & Polishing', d: 'Gentle rollers lift the husk; polishing leaves a soft, even sheen.', chip: 'Low-heat, low-breakage', img: IMG.scoop, pos: '50% 62%' },
  { t: 'Sorting & Grading', d: 'Optical sorters separate whole grains by length, colour and purity.', chip: 'Colour + length optical sort', img: IMG.pile2, pos: '50% 50%' },
  { t: 'Quality Inspection', d: 'Every batch is sampled, measured and signed off by our quality team.', chip: 'Lab-tested, every lot', img: IMG.pile, pos: '50% 50%' },
]

function Processing({ p, sel }: { p: number; sel: number }) {
  const v = VARIETIES[sel]
  const o = s(p, 0.66, 0.69) * (1 - s(p, 0.875, 0.915))
  const cream = 1 - s(p, 0.69, 0.75)
  const ui = s(p, 0.72, 0.76)
  const q = seg(p, 0.73, 0.86)
  const idx = Math.min(3, Math.floor(q * 4))
  const polished = idx >= 1
  return (
    <div className="absolute inset-0 bg-earth text-rice" style={layer(o)}>
      {STAGES.map((st, i) => {
        const x = i === 0 ? Math.max(q * 4, 0.5) : i === 3 ? Math.min(q * 4, 3.5) : q * 4
        const op = clamp(1.6 - Math.abs(x - (i + 0.5)) * 2.2)
        const local = clamp(q * 4 - i, -0.5, 1.5)
        return (
          <img
            key={st.t} src={st.img} alt={st.t}
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{
              opacity: op * 0.62, objectPosition: st.pos,
              transform: `scale(${1.08 + local * 0.08 * M}) translate3d(${(0.5 - local) * 3 * M}%, 0, 0)`,
              filter: i === 0 ? 'sepia(.35) brightness(.85)' : i === 1 ? 'saturate(.8) brightness(.85)' : 'brightness(.95)',
            }}
          />
        )
      })}
      <div className="absolute inset-0 bg-gradient-to-b from-earth/85 via-earth/25 to-earth/95" />

      {/* dust */}
      {idx === 0 && !RM && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: ui }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="dust absolute top-0 rounded-full bg-[#d7c08a]" style={{
              left: `${(i * 37) % 100}%`, width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
              animationDuration: `${5 + (i % 5)}s`, animationDelay: `${-(i * 0.7)}s`, ['--dx' as string]: `${(i % 2 ? 1 : -1) * (20 + i * 4)}px`,
            }} />
          ))}
        </div>
      )}
      {idx === 3 && !RM && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full">
          <div className="scan absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        </div>
      )}

      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-between px-6 pb-10 pt-24 md:px-12" style={{ opacity: ui }}>
        <div style={{ transform: `translate3d(0, ${(1 - ui) * -24}px, 0)` }}>
          <Label light>Scene 04 · The Processing</Label>
          <h2 className="mt-3 max-w-xl text-[clamp(2rem,5vw,3.8rem)] font-light leading-tight tracking-tight">
            Clean, calm, <span className="font-serif italic">exacting.</span>
          </h2>
        </div>

        <div style={{ transform: `translate3d(0, ${(1 - ui) * 40}px, 0)` }}>
          <div key={idx} className="rise mb-8 max-w-md">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-5xl italic text-gold md:text-7xl">0{idx + 1}</span>
              <span className="text-lg font-medium md:text-2xl">{STAGES[idx].t}</span>
            </div>
            <p className="mt-3 text-sm text-rice/85 md:text-base">{STAGES[idx].d}</p>
            <span className="mt-4 inline-block rounded-full border border-white/25 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-rice/80 backdrop-blur">{STAGES[idx].chip}</span>
          </div>

          <div className="relative h-10">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
            <div className="absolute left-0 top-1/2 h-px bg-gold" style={{ width: `${q * 100}%` }} />
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-white/50 transition-colors duration-500" style={{ left: `calc(${i * 33.33}% )`, background: q * 3 >= i - 0.01 ? '#b8914a' : 'transparent' }} />
            ))}
            <div className="absolute top-1/2 w-14 -translate-y-1/2 md:w-20" style={{ left: `calc(${q * 100}% - ${q * 56}px)`, filter: polished ? 'brightness(1.08)' : 'brightness(.85) sepia(.3)', transition: 'filter 1s' }}>
              <Grain v={v} className="block w-full" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-[0.16em] md:text-xs">
            {STAGES.map((st, i) => (
              <div key={st.t} className="transition-opacity duration-500" style={{ opacity: i === idx ? 1 : 0.4, textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center' }}>{st.t.split(' &')[0]}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0" style={{ background: '#f1e7cf', opacity: cream }} />
    </div>
  )
}

/* ---------- Scene 5 : cinematic reveal ---------- */
function Final({ p, sel }: { p: number; sel: number }) {
  const v = VARIETIES[sel]
  const t = seg(p, 0.885, 0.99)
  const o = s(p, 0.885, 0.91)
  const info = s(t, 0.62, 0.86)
  const close = s(t, 0.86, 1)
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 900)
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 900)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const rise = (k: number, d = 0) => ({ opacity: seg(info, d, d + 0.6) * k, transform: `translate3d(0, ${(1 - seg(info, d, d + 0.6)) * 26}px, 0)` })

  return (
    <div className="absolute inset-0" style={{ ...layer(o), background: 'linear-gradient(180deg, #f0e7d2 0%, #e6dabf 55%, #d6c6a2 100%)' }}>
      <div className="absolute inset-x-0 top-0 h-[54%] md:inset-y-0 md:h-full">
        <FinalScene t={t} visible={o > 0.005} mm={v.mm} width={v.width} name={v.name} shift={wide ? 0.21 : 0} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[46%] flex-col justify-center px-6 pb-5 md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[38%] md:justify-center md:px-0 md:pr-14 md:pb-0">
        <div className="pointer-events-auto">
          <div style={rise(1, 0)}><Label>The Final Product</Label></div>
          <h2 className="mt-2 text-[clamp(2rem,4.6vw,3.6rem)] font-light leading-[1.02] tracking-tight" style={rise(1, 0.1)}>{v.name}</h2>
          <p className="mt-2 max-w-sm text-sm text-earth/75 md:mt-4 md:text-base" style={rise(1, 0.2)}>{v.note}</p>
          <dl className="mt-4 grid max-w-sm grid-cols-3 gap-x-4 border-t border-earth/15 pt-3 text-sm md:mt-7 md:pt-4" style={rise(1, 0.3)}>
            {[['Length', v.len], ['Texture', v.texture.split(',')[0]], ['Packing', '5–50 kg']].map(([k, val]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.22em] text-earth/50">{k}</dt>
                <dd className="mt-0.5 font-medium">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 grid max-w-sm grid-cols-2 gap-2 md:mt-7 md:gap-3" style={rise(1, 0.4)}>
            <a href="#products" className="rounded-full bg-earth px-4 py-3.5 text-center text-sm font-medium text-rice transition hover:bg-paddy">Explore Products</a>
            <a href="#quote" className="rounded-full border border-earth/40 px-4 py-3.5 text-center text-sm font-medium transition hover:border-earth hover:bg-earth/5">Request a Quote</a>
          </div>
          <div className="mt-5 md:mt-9" style={{ opacity: close, transform: `translate3d(0, ${(1 - close) * 18}px, 0)` }}>
            <p className="font-serif text-2xl italic leading-none md:text-4xl">Quality in Every Grain.</p>
            <p className="mt-2 text-[11px] text-earth/60 md:text-xs">Carefully sourced. Thoughtfully processed. Delivered with trust.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- chrome ---------- */
const SECTION_LINKS = [
  { name: 'Collection', href: '#products' },
  { name: 'Heritage', href: '#heritage' },
  { name: 'Voices', href: '#voices' },
  { name: 'Quote', href: '#quote' },
]

function Chrome({ p, past, go }: { p: number; past: boolean; go: (at: number) => void }) {
  const active = p < 0.19 ? 0 : p < 0.45 ? 1 : p < 0.7 ? 2 : p < 0.9 ? 3 : 4
  return (
    <>
      <div className="pointer-events-none fixed left-6 top-6 z-30 text-white mix-blend-difference md:left-12 md:top-9">
        <a href="#top" className="pointer-events-auto block" aria-label="Back to top"><Logo /></a>
      </div>

      {/* section links — appear after the story */}
      <nav
        aria-label="Sections"
        className="fixed right-6 top-6 z-30 flex items-center gap-5 text-white mix-blend-difference transition-all duration-700 md:right-12 md:top-9 md:gap-7"
        style={{ opacity: past ? 1 : 0, transform: `translateY(${past ? 0 : -12}px)`, pointerEvents: past ? 'auto' : 'none' }}
      >
        {SECTION_LINKS.map((l) => (
          <a key={l.name} href={l.href} className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70 transition-opacity hover:opacity-100 md:block">
            {l.name}
          </a>
        ))}
        <a href="#quote" className="rounded-full border border-white/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-black">
          Quote
        </a>
      </nav>

      {/* chapter dots — story only */}
      <nav
        aria-label="Chapters"
        className="fixed right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-3 text-white mix-blend-difference transition-opacity duration-700 md:right-8"
        style={{ opacity: past ? 0 : 1, pointerEvents: past ? 'none' : 'auto' }}
      >
        {CHAPTERS.map((c, i) => (
          <button key={c.name} onClick={() => go(c.at)} aria-label={c.name} aria-current={i === active} className="group flex items-center gap-3 py-1">
            <span className={`hidden text-[10px] uppercase tracking-[0.25em] transition-all duration-500 md:block ${i === active ? 'opacity-100' : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-70'}`}>{c.name}</span>
            <span className={`block rounded-full bg-white transition-all duration-500 ${i === active ? 'h-6 w-[3px]' : 'h-[6px] w-[6px] opacity-50 group-hover:opacity-100'}`} />
          </button>
        ))}
      </nav>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[2px]">
        <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${p})` }} />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-20 opacity-[0.07] mix-blend-multiply"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }}
      />
      <div className="pointer-events-none fixed inset-0 z-20" style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(40,28,14,.22) 100%)' }} />
    </>
  )
}

/* ---------- story root ---------- */
export default function ScrollStory({ sel, setSel }: { sel: number; setSel: (n: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { p, past } = useStageProgress(ref)

  const go = (at: number) => {
    const el = ref.current
    if (!el) return
    const top = el.offsetTop + at * (el.offsetHeight - window.innerHeight)
    window.scrollTo({ top, behavior: RM ? 'auto' : 'smooth' })
  }

  return (
    <>
      <div ref={ref} style={{ height: `${TOTAL_VH}vh` }} className="relative" id="top">
        <div className="sticky top-0 h-dvh overflow-hidden">
          <Farm p={p} />
          <Harvest p={p} />
          <Explore p={p} sel={sel} setSel={setSel} />
          <Processing p={p} sel={sel} />
          <Final p={p} sel={sel} />
        </div>
      </div>
      <Chrome p={p} past={past} go={go} />
    </>
  )
}
