import { Logo } from './Story'
import { Reveal } from '../components/Reveal'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-earth px-6 pb-10 pt-20 text-rice md:px-12 md:pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <Reveal>
            <div>
              <div className="text-rice"><Logo /></div>
              <p className="mt-5 max-w-xs font-serif text-2xl italic leading-snug text-rice/85">
                Quality in every grain — since 1993.
              </p>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-rice/45">Explore</div>
              <ul className="mt-4 space-y-3 text-sm">
                {[['Collection', '#products'], ['Heritage', '#heritage'], ['Voices', '#voices'], ['Request a quote', '#quote'], ['The journey', '#top']].map(([label, href]) => (
                  <li key={href + label}>
                    <a href={href} className="text-rice/75 transition-colors hover:text-rice">{label}</a>
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
