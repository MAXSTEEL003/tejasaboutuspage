import { useEffect, useRef, useState } from 'react'
import { Label } from './Story'
import { Reveal } from '../components/Reveal'

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&fit=crop&auto=format&q=80`

const STATS: [number, string, string][] = [
  [32, '', 'Harvest seasons'],
  [480, '+', 'Grower families'],
  [26000, '', 'Tonnes each year'],
  [14, '', 'Export countries'],
]

function CountUp({ to, suffix, run }: { to: number; suffix: string; run: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const dur = 1800
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      const e = 1 - Math.pow(1 - k, 4)
      setN(Math.round(to * e))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, to])
  return (
    <span className="tabular-nums">
      {n.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

/* gentle parallax on scroll */
function Parallax({ children, speed = 0.08, className = '' }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current!
    let raf = 0
    const read = () => {
      const r = el.getBoundingClientRect()
      const mid = r.top + r.height / 2 - window.innerHeight / 2
      el.style.transform = `translate3d(0, ${(-mid * speed).toFixed(1)}px, 0)`
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [speed])
  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  )
}

export default function Heritage() {
  const ref = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setRun(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="heritage" className="relative overflow-hidden bg-rice px-6 py-24 md:px-12 md:py-40">
      <div
        className="pointer-events-none absolute inset-x-0 top-10 select-none whitespace-nowrap text-center font-serif italic leading-none text-earth/[0.045]"
        style={{ fontSize: 'clamp(5rem,18vw,16rem)' }}
        aria-hidden
      >
        Est. 1993
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-14 md:grid-cols-[1.1fr_1fr] md:gap-10">
          <div>
            <Reveal><Label>Our Heritage</Label></Reveal>
            <Reveal delay={90}>
              <h2 className="mt-4 text-[clamp(2.2rem,5.5vw,4.4rem)] font-light leading-[1.04] tracking-tight">
                Three decades<br />in the <span className="font-serif italic">paddies.</span>
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-earth/70 md:text-base">
                What began as a single paddy mandi in 1993 is now a network of grower families across the
                northern plains. We still buy the way we always have — at the field edge, by hand, on trust —
                and we still mill in small lots so no harvest loses its character.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-earth/70 md:text-base">
                Seed selection, water stewardship, fair prices fixed before sowing: the unglamorous work that
                makes a grain worth cooking.
              </p>
            </Reveal>

            <div ref={ref} className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:mt-16">
              {STATS.map(([n, suffix, label], i) => (
                <Reveal key={label} delay={i * 90}>
                  <div className="border-t border-earth/15 pt-4">
                    <div className="font-serif text-4xl italic tracking-tight text-earth md:text-6xl">
                      <CountUp to={n} suffix={suffix} run={run} />
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-earth/55 md:text-xs">{label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-12 gap-4 md:mt-0">
            <Parallax speed={0.06} className="col-span-8">
              <Reveal>
                <img
                  src={U('1500382017468-9049fed747ef', 1400)}
                  alt="Golden field at sunset"
                  className="aspect-[4/5] w-full rounded-[2px] object-cover shadow-xl shadow-earth/15"
                  loading="lazy"
                />
              </Reveal>
            </Parallax>
            <Parallax speed={-0.05} className="col-span-4 self-end">
              <Reveal delay={140}>
                <img
                  src={U('1592982537447-7440770cbfc9', 900)}
                  alt="Farmer tending young crop"
                  className="aspect-[3/4] w-full rounded-[2px] object-cover shadow-xl shadow-earth/15"
                  loading="lazy"
                />
              </Reveal>
            </Parallax>
            <Parallax speed={0.04} className="col-span-7 col-start-4 -mt-6 md:-mt-14">
              <Reveal delay={220}>
                <figure>
                  <img
                    src={U('1500937386664-56d1dfef3854', 1200)}
                    alt="Grower partnership in the field"
                    className="aspect-[16/10] w-full rounded-[2px] object-cover shadow-xl shadow-earth/15"
                    loading="lazy"
                  />
                  <figcaption className="mt-3 text-[10px] uppercase tracking-[0.22em] text-earth/50">
                    Prices fixed before sowing · every season
                  </figcaption>
                </figure>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  )
}
