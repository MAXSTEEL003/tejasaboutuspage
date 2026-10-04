import { useState } from 'react'
import { VARIETIES } from '../data'
import { Grain, Label } from './Story'
import { Reveal } from '../components/Reveal'
import { scrollToTarget } from '../lib/utils'

type Props = {
  sel: number
  setSel: (n: number) => void
  onSkipToQuote?: () => void
  openAuthModal?: () => void
}

export default function Products({ sel, setSel, onSkipToQuote, openAuthModal }: Props) {
  const [photoView, setPhotoView] = useState<'kitchen' | 'field'>('kitchen')
  const pick = (i: number) => setSel(i)
  const pickAndQuote = (i: number) => {
    setSel(i)
    if (onSkipToQuote) {
      onSkipToQuote()
    } else {
      scrollToTarget('quote')
    }
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
          <Reveal delay={180} className="max-w-md">
            <p className="text-sm leading-relaxed text-earth/65">
              Every variety is milled to order, aged for depth, and packed in food-grade wholesale bags. Featuring our flagship Keshar Kali Wada Kolam.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => (onSkipToQuote ? onSkipToQuote() : scrollToTarget('quote'))}
                className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-earth hover:bg-[#d8a846] transition shadow-sm cursor-pointer"
              >
                <span>Skip to Quote</span>
                <span>→</span>
              </button>
              {openAuthModal && (
                <button
                  onClick={openAuthModal}
                  className="rounded-full border border-earth/25 px-4 py-2 text-xs font-medium text-earth hover:border-earth hover:bg-earth/5 transition cursor-pointer"
                >
                  Partner Sign In
                </button>
              )}
            </div>
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

        {/* Flagship Real-World Packaging Showcase */}
        <Reveal delay={160}>
          <div className="mt-14 overflow-hidden rounded-3xl border border-earth/15 bg-rice/80 p-6 md:mt-20 md:p-10 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gold/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-earth">
                    Flagship Packaging Reference
                  </span>
                  <span className="text-xs text-earth/50">· 30 kg Wada Kolam</span>
                </div>
                <h3 className="mt-3 text-2xl font-light tracking-tight text-earth md:text-3xl">
                  Keshar Kali <span className="font-serif italic font-normal">Authentic 30 kg Pack</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-earth/70">
                  Real physical wholesale packaging as photographed across culinary kitchen studios and golden harvest fields. Engineered with high-barrier laminated BOPP woven poly fabric, heat-sealed carry handle, multi-script regional branding, and certified Khila Khila Dana Wada Kolam rice.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => setPhotoView('kitchen')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                      photoView === 'kitchen'
                        ? 'bg-earth text-rice shadow-sm'
                        : 'border border-earth/20 bg-earth/5 text-earth hover:bg-earth/10'
                    }`}
                  >
                    Culinary Context (Kitchen Studio)
                  </button>
                  <button
                    onClick={() => setPhotoView('field')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                      photoView === 'field'
                        ? 'bg-earth text-rice shadow-sm'
                        : 'border border-earth/20 bg-earth/5 text-earth hover:bg-earth/10'
                    }`}
                  >
                    Origin Context (Paddy Harvest Field)
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-earth/15 pt-5 text-xs text-earth/70 sm:grid-cols-3">
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-earth/40">Gross Weight</span>
                    <span className="font-medium text-earth">30 kg & 26 kg</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-earth/40">Material Grade</span>
                    <span className="font-medium text-earth">Multi-Layer BOPP Woven</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-earth/40">Grain Spec</span>
                    <span className="font-medium text-earth">5.2 mm · Medium Slender</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => pickAndQuote(0)}
                    className="rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-earth hover:bg-[#d8a846] transition shadow-sm cursor-pointer"
                  >
                    Request 30kg Quote →
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('story')
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className="rounded-full border border-earth/30 px-5 py-2.5 text-xs font-medium text-earth hover:bg-earth/5 transition cursor-pointer"
                  >
                    View 3D Interactive Model (Scene 05)
                  </button>
                </div>
              </div>

              {/* Photo Display Card */}
              <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-earth/15 bg-white shadow-md lg:mx-0">
                <img
                  src={
                    photoView === 'kitchen'
                      ? '/images/kesharkali_product_kitchen.jpg'
                      : '/images/kesharkali_product_field.jpg'
                  }
                  alt={
                    photoView === 'kitchen'
                      ? 'Keshar Kali 30kg Bag in Kitchen Studio'
                      : 'Keshar Kali 30kg Bag in Harvest Paddy Field'
                  }
                  className="aspect-square w-full object-cover transition-all duration-700 hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#f8c73c]">
                    {photoView === 'kitchen' ? 'Kitchen Studio Reference' : 'Paddy Harvest Reference'}
                  </div>
                  <div className="text-xs text-white/85">
                    {photoView === 'kitchen'
                      ? 'Authentic 30kg BOPP sack beside cooked Wada Kolam plate'
                      : 'Standing on log round in sunlit golden harvest field'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
