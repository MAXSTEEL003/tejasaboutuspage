import GrainField from "../components/GrainField"
import SplitText from "../components/SplitText"
import Button from "../components/Button"
import Parallax from "../components/Parallax"
import { CountUp } from "../components/Reveal"

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` })

export default function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_72%_38%,rgba(217,164,65,.2),transparent_70%),radial-gradient(ellipse_50%_50%_at_8%_95%,rgba(236,138,42,.12),transparent_70%)]" />
      <GrainField />
      <div className="vignette pointer-events-none absolute inset-0" />
      <div className="wrap relative grid-12 w-full items-end pb-16 pt-24 sm:pt-36 md:pb-28">
        <div className="col-span-12 lg:col-span-9">
          <p className="reveal in eyebrow text-gold" style={d(1500)}>
            Karnal · Haryana · Est. two decades of grain
          </p>
          <Parallax speed={0.06}>
            <SplitText
              id="hero-title"
              as="h1"
              text={"The _grain_\nof kings."}
              delay={1500}
              step={90}
              immediate
              className="display-xl mt-4 sm:mt-7"
            />
          </Parallax>
          <p className="reveal in lede mt-6 sm:mt-10 text-sand" style={d(2000)}>
            Five varieties, aged up to twenty-four months in silence, graded by
            eye and by machine. Rice worth the wait.
          </p>
          <div
            className="reveal in mt-8 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5"
            style={d(2200)}
          >
            <Button href="#top" className="w-full sm:w-auto">
              Begin the journey <span aria-hidden="true">↓</span>
            </Button>
            <Button href="#quote" variant="line" className="w-full sm:w-auto">
              Request a quote
            </Button>
          </div>

          {/* Mobile At a Glance Ribbon */}
          <div
            className="reveal in mt-8 grid grid-cols-3 gap-2 border-y border-gold/20 py-3.5 lg:hidden"
            style={d(2400)}
          >
            {[
              ["24", " mo", "Silo ageing"],
              ["8.4", " mm", "Longest grain"],
              ["5", "", "Varieties"],
            ].map(([n, u, l]) => (
              <div key={l} className="text-center">
                <dd className="font-display text-2xl sm:text-3xl italic text-gold">
                  <CountUp
                    to={parseFloat(n)}
                    decimals={n.includes(".") ? 1 : 0}
                    suffix={u}
                  />
                </dd>
                <dt className="eyebrow text-[9px] text-sand/80 mt-0.5">{l}</dt>
              </div>
            ))}
          </div>
        </div>
        <aside
          aria-label="At a glance"
          className="reveal in col-span-12 mt-16 hidden lg:col-span-3 lg:mt-0 lg:block"
          style={d(2400)}
        >
          <dl className="border-t border-gold/30">
            {[
              ["24", " mo", "Silo ageing"],
              ["8.4", " mm", "Longest grain"],
              ["5", "", "Varieties"],
            ].map(([n, u, l]) => (
              <div
                key={l}
                className="flex items-baseline justify-between border-b border-gold/15 py-5"
              >
                <dt className="eyebrow text-sand">{l}</dt>
                <dd className="font-display text-5xl italic">
                  <CountUp
                    to={parseFloat(n)}
                    decimals={n.includes(".") ? 1 : 0}
                    suffix={u}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      <div
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="eyebrow text-sand">Scroll</span>
        <span className="scroll-cue block h-10 w-px bg-gold" />
      </div>
    </section>
  )
}
