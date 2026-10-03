import { Logo } from './Story'
import { Reveal } from '../components/Reveal'
import { scrollToTarget } from '../lib/utils'
import type { PartnerUser } from '../components/PartnerModal'

type Props = {
  openAuthModal?: () => void
  partnerUser?: PartnerUser | null
}

export default function Footer({ openAuthModal, partnerUser }: Props) {
  return (
    <footer className="relative overflow-hidden bg-earth px-6 pb-10 pt-20 text-rice md:px-12 md:pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <Reveal>
            <div>
              <div className="text-rice">
                <button onClick={() => scrollToTarget('top')} className="cursor-pointer focus:outline-none">
                  <Logo />
                </button>
              </div>
              <p className="mt-5 max-w-xs font-serif text-2xl italic leading-snug text-rice/85">
                Quality in every grain — since 1993.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => scrollToTarget('quote')}
                  className="rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-earth hover:bg-[#d8a846] transition shadow-sm cursor-pointer"
                >
                  Skip to Quote Desk →
                </button>
                {openAuthModal && (
                  <button
                    onClick={openAuthModal}
                    className="rounded-full border border-rice/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rice hover:bg-rice/10 transition cursor-pointer"
                  >
                    {partnerUser ? `Portal: ${partnerUser.name}` : 'Partner Sign In'}
                  </button>
                )}
              </div>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-rice/45">Explore & Jump</div>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  ['The Collection', 'products'],
                  ['Our Heritage', 'heritage'],
                  ['Voices from the Trade', 'voices'],
                  ['Request a Quote', 'quote'],
                  ['Back to Beginning', 'top'],
                ].map(([label, id]) => (
                  <li key={id + label}>
                    <button
                      onClick={() => scrollToTarget(id)}
                      className="text-left text-rice/75 transition-colors hover:text-rice cursor-pointer"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={180}>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-rice/45">Trade desk</div>
              <ul className="mt-4 space-y-3 text-sm text-rice/75">
                <li>trade@tejascanvassing.in</li>
                <li>+91 98110 22334</li>
                <li>Grain Market Road, Karnal,<br />Haryana 132001, India</li>
                <li className="pt-2">
                  <span className="inline-block rounded-full bg-rice/10 px-3 py-1 text-[10px] uppercase tracking-wider text-rice/70">
                    B2B & Mandi Dispatches
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="pointer-events-none mt-16 select-none overflow-hidden md:mt-20" aria-hidden>
          <div className="whitespace-nowrap text-center font-serif italic leading-[0.85] text-rice/[0.07]" style={{ fontSize: 'clamp(3rem,10.5vw,9.5rem)' }}>
            Tejas Canvassing
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-rice/10 pt-6 text-[11px] text-rice/45 md:flex-row">
          <span>© {new Date().getFullYear()} Tejas Canvassing. All rights reserved.</span>
          <span>Carefully sourced · Thoughtfully processed · Delivered with trust</span>
        </div>
      </div>
    </footer>
  )
}
