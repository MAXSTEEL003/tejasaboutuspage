import { VARIETIES } from '../data'
import { Grain, Label } from './Story'
import { Reveal } from '../components/Reveal'

type Props = { sel: number; setSel: (n: number) => void }

export default function Products({ sel, setSel }: Props) {
  const pick = (i: number) => setSel(i)
  const pickAndQuote = (i: number) => {
    setSel(i)
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="products" className="relative bg-ivory px-6 py-24 md:px-12 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Reveal><Label>The Collection</Label></Reveal>
            <Reveal delay={90}>
              <h2 className="mt-4 text-[clamp(2.2rem,5.5vw,4.6rem)] font-light leading-[1.02] tracking-tight">
                Five grains,<br /><span className="font-serif italic">five characters.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={180} className="max-w-xs">
            <p className="text-sm leading-relaxed text-earth/65">
              Every variety is milled to order, aged for depth, and packed in food-grade wholesale bags. Featuring our flagship Keshar Kali Wada Kolam.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 border-t border-earth/15 md:mt-20">
          {VARIETIES.map((v, i) => (
            <Reveal key={v.name} delay={i * 70}>
              <div
                className={`prow group relative grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 border-b border-earth/15 px-2 py-7 md:grid-cols-[64px_96px_1.2fr_1fr_auto] md:gap-x-8 md:px-4 md:py-9 ${i === sel ? 'bg-rice/70' : ''}`}
                style={{ transitionProperty: 'background-color' }}
                onMouseEnter={() => pick(i)}
              >
                <span className="font-serif text-2xl italic text-earth/40 md:text-3xl">0{i + 1}</span>

                <span className="row-span-2 w-20 md:row-span-1 md:w-24">
                  <Grain v={v} className="prow-grain block w-full drop-shadow-sm" />
                </span>

                <span className="col-span-2 md:col-span-1">
                  <button onClick={() => pick(i)} className="block text-left">
                    <div className="flex items-center gap-2">
                      <span className="block text-xl font-light tracking-tight md:text-3xl">{v.name}</span>
                      {v.name === 'Keshar Kali' && (
                        <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-earth">★ Flagship Bag</span>
                      )}
                    </div>
                    <span className="mt-1 block text-xs text-earth/55 md:text-sm">{v.subname} · {v.best}</span>
                  </button>
                </span>

                <span className="col-span-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-earth/60 md:col-span-1 md:text-sm">
                  <span><span className="text-earth/40">Length</span> · {v.len}</span>
                  <span><span className="text-earth/40">Aroma</span> · {v.aroma}</span>
                  <span><span className="text-earth/40">Aged</span> · {v.aged.replace('Aged ', '')}</span>
                </span>

                <span className="col-span-2 flex items-center justify-between gap-4 md:col-span-1 md:justify-end md:gap-7">
                  <span className="whitespace-nowrap">
                    <span className="font-serif text-2xl italic md:text-3xl">{v.price}</span>
                    <span className="ml-1 text-xs text-earth/50">/ kg</span>
                  </span>
                  <button
                    onClick={() => pickAndQuote(i)}
                    className="flex min-h-[44px] items-center gap-2 rounded-full border border-earth/25 px-5 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-500 hover:border-earth hover:bg-earth hover:text-rice"
                  >
                    Quote
                    <svg className="prow-arrow h-3.5 w-3.5 opacity-60" style={{ transform: 'rotate(-45deg)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-6 text-xs tracking-wide text-earth/50">
            Prices indicative for 25&nbsp;kg food-grade bags, ex-mill. Custom packing, private labels and export documentation available on request.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
