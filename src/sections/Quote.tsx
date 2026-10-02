import { useState } from 'react'
import { VARIETIES, MAX_MM } from '../data'
import { Label } from './Story'
import { Reveal } from '../components/Reveal'

type Props = { sel: number; setSel: (n: number) => void }

const SIZES = ['25 kg bags', '50 kg bags', 'Bulk container', 'Private label']

export default function Quote({ sel, setSel }: Props) {
  const [sent, setSent] = useState(false)
  const [size, setSize] = useState(SIZES[0])
  const v = VARIETIES[sel]

  return (
    <section id="quote" className="relative bg-ivory px-6 py-24 md:px-12 md:py-36">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <div>
          <Reveal><Label>Request a Quote</Label></Reveal>
          <Reveal delay={90}>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.2rem)] font-light leading-[1.03] tracking-tight">
              Let’s fill<br /><span className="font-serif italic">your silo.</span>
            </h2>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-earth/70 md:text-base">
              Tell us the variety, the volume and the destination. Our trade desk replies within one working day with a landed price.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10">
              <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-earth/50">Variety</div>
              <div className="flex flex-wrap gap-2">
                {VARIETIES.map((x, i) => (
                  <button
                    key={x.name}
                    onClick={() => setSel(i)}
                    aria-pressed={i === sel}
                    className={`flex min-h-[44px] items-center gap-2.5 rounded-full border px-4 text-sm transition-all duration-500 ${
                      i === sel
                        ? 'border-earth bg-earth text-rice shadow-lg shadow-earth/20'
                        : 'border-earth/20 text-earth/80 hover:border-earth/55 hover:bg-rice/60'
                    }`}
                  >
                    <span
                      className="h-2.5 shrink-0 rounded-[50%]"
                      style={{ width: 10 + (x.mm / MAX_MM) * 18, background: `linear-gradient(${x.tone[0]}, ${x.tone[2]})`, border: '1px solid rgba(0,0,0,.12)' }}
                    />
                    {x.name}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex max-w-sm items-baseline justify-between border-t border-earth/15 pt-4 text-sm">
                <span className="text-earth/55">Selected</span>
                <span className="font-serif text-xl italic">{v.name} · {v.price}/kg</span>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="relative overflow-hidden rounded-[2px] border border-earth/12 bg-rice p-7 shadow-xl shadow-earth/10 md:p-10">
            {sent ? (
              <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                <svg className="pop-check h-20 w-20" viewBox="0 0 80 80" fill="none" aria-hidden>
                  <circle className="draw-ring" cx="40" cy="40" r="34" stroke="#5d6b43" strokeWidth="2" />
                  <path d="M27 41.5 36.5 51 54 32" stroke="#5d6b43" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mt-7 font-serif text-3xl italic">Request noted.</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-earth/65">
                  Our trade desk will reply with a landed price for {v.name} ({size}) within one working day.
                </p>
                <p className="mt-5 text-[11px] text-earth/45">
                  Demo build — submissions stay in this browser until a backend is connected.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-7 min-h-[44px] rounded-full border border-earth/30 px-6 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:border-earth hover:bg-earth hover:text-rice"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
                className="space-y-7"
              >
                <div className="grid gap-7 md:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-earth/50">Name</span>
                    <input required className="field" placeholder="Ananya Sharma" autoComplete="name" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-earth/50">Company</span>
                    <input className="field" placeholder="Deccan Foods Pvt. Ltd." autoComplete="organization" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-earth/50">Email</span>
                  <input required type="email" className="field" placeholder="you@company.com" autoComplete="email" />
                </label>
                <div className="grid gap-7 md:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-earth/50">Packing</span>
                    <select className="field cursor-pointer" value={size} onChange={(e) => setSize(e.target.value)}>
                      {SIZES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-earth/50">Est. volume (tonnes)</span>
                    <input type="number" min={1} className="field" placeholder="24" inputMode="numeric" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-earth/50">Message</span>
                  <textarea rows={3} className="field resize-none" placeholder={`Interested in ${v.name} for…`} />
                </label>
                <button
                  type="submit"
                  className="group flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-earth text-sm font-semibold uppercase tracking-[0.2em] text-rice transition-colors duration-500 hover:bg-paddy"
                >
                  Send request
                  <svg className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
