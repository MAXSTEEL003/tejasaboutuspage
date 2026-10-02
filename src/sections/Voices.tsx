import { useEffect, useState } from 'react'
import { Label } from './Story'
import { Reveal } from '../components/Reveal'

const QUOTES = [
  {
    q: 'The 1121 cooks up two fingers long and never clumps. Our biryani finally has a signature.',
    name: 'Arjun Mehta',
    role: 'Executive Chef, Moti Mahal Group',
  },
  {
    q: 'Lot after lot, the grading is exactly what the spec sheet says. In twenty years of buying, that is rare.',
    name: 'Fatima Al-Rashid',
    role: 'Import Director, Gulf Pantry Trading',
  },
  {
    q: 'They fixed prices with us before sowing and honoured them through a hard season. That is partnership.',
    name: 'R. Chandran',
    role: 'Procurement Head, Southern Staples Retail',
  },
]

export default function Voices() {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI((v) => (v + 1) % QUOTES.length), 6000)
    return () => clearInterval(t)
  }, [auto])

  const go = (n: number) => {
    setAuto(false)
    setI(((n % QUOTES.length) + QUOTES.length) % QUOTES.length)
  }

  const cur = QUOTES[i]

  return (
    <section id="voices" className="relative overflow-hidden bg-earth px-6 py-24 text-rice md:px-12 md:py-36">
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 select-none font-serif italic leading-none text-rice/[0.04]" style={{ fontSize: 'clamp(14rem,38vw,34rem)' }} aria-hidden>
        ”
      </div>

      <div className="relative mx-auto flex min-h-[320px] max-w-4xl flex-col md:min-h-[340px]">
        <Reveal className="text-center"><Label light>Voices from the Trade</Label></Reveal>

        <div className="relative mt-10 flex-1">
          {QUOTES.map((item, k) => (
            <blockquote
              key={item.name}
              className="absolute inset-0 flex flex-col items-center text-center transition-all duration-700"
              style={{
                opacity: k === i ? 1 : 0,
                transform: `translateY(${k === i ? 0 : 18}px) scale(${k === i ? 1 : 0.985})`,
                filter: k === i ? 'blur(0)' : 'blur(6px)',
                pointerEvents: k === i ? 'auto' : 'none',
              }}
              aria-hidden={k !== i}
            >
              <p className="mx-auto max-w-3xl font-serif text-2xl italic leading-snug text-rice md:text-4xl">
                “{item.q}”
              </p>
              <footer className="mt-8">
                <div className="text-sm font-semibold tracking-wide">{item.name}</div>
                <div className="mt-1 text-xs text-rice/55">{item.role}</div>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            onClick={() => go(i - 1)}
            aria-label="Previous quote"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-rice/25 transition-colors hover:border-rice/70 hover:bg-rice/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex gap-2.5">
            {QUOTES.map((_, k) => (
              <button
                key={k}
                onClick={() => go(k)}
                aria-label={`Quote ${k + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-8 bg-gold' : 'w-1.5 bg-rice/30 hover:bg-rice/60'}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(i + 1)}
            aria-label="Next quote"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-rice/25 transition-colors hover:border-rice/70 hover:bg-rice/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        <span className="sr-only" aria-live="polite">{cur.name}: {cur.q}</span>
      </div>
    </section>
  )
}
