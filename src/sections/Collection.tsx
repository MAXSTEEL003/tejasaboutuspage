import { useState } from "react"
import { GrainViewer3D as GrainViewer } from "../components/Lazy3D"
import { useInView } from "../components/Reveal"
import { VARIETIES, MAX_MM } from "../data"
import VarietyBag from "../components/VarietyBag"
import Reveal, { CountUp } from "../components/Reveal"
import SplitText from "../components/SplitText"
import SectionLabel from "../components/SectionLabel"
import Tilt from "../components/Tilt"
import Button from "../components/Button"

function Meter({ l, n }: { l: string; n: number }) {
  const [r, seen] = useInView<HTMLDivElement>(0.4)
  return (
    <div ref={r}>
      <div className="eyebrow flex justify-between text-sand">
        <span>{l}</span>
        <span className="text-gold">{seen ? <CountUp to={n} /> : 0}</span>
      </div>
      <div
        className="mt-2 h-px bg-gold/20"
        role="meter"
        aria-label={l}
        aria-valuenow={n}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-[2px] -translate-y-px bg-gold transition-[width] duration-[1600ms] ease-out"
          style={{ width: seen ? `${n}%` : "0%" }}
        />
      </div>
    </div>
  )
}

export default function Collection({
  sel,
  setSel,
}: {
  sel: number
  setSel: (n: number) => void
}) {
  const v = VARIETIES[sel]
  const [bag, setBag] = useState(false)
  const [viewMode, setViewMode] = useState<"both" | "bag" | "grain">("both")
  const [vref, seen] = useInView<HTMLDivElement>(0.1)
  return (
    <section
      id="collection"
      aria-labelledby="collection-title"
      className="section relative overflow-hidden bg-coal"
    >
      <div className="pointer-events-none absolute -right-40 top-20 h-[600px] w-[600px] rounded-full bg-gold/10 blur-[140px]" />
      <div className="wrap relative">
        <SectionLabel n="03">The collection</SectionLabel>
        <SplitText
          id="collection-title"
          text={"Five _characters,_\none harvest."}
          className="display-lg mt-6"
        />

        <div className="grid-12 mt-10 sm:mt-16 gap-y-8 sm:gap-y-12">
          <div
            role="tablist"
            aria-label="Varieties"
            className="no-scrollbar col-span-12 flex gap-2 lg:col-span-3 overflow-x-auto lg:flex-col lg:gap-0 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {VARIETIES.map((x, i) => (
              <button
                key={x.name}
                role="tab"
                aria-selected={i === sel}
                onClick={() => setSel(i)}
                className={`group flex min-h-[48px] sm:min-h-[56px] shrink-0 items-baseline gap-3 sm:gap-4 border-b border-gold/15 px-3 sm:px-4 py-3 sm:py-5 text-left transition-all lg:px-0 ${
                  i === sel ? "text-ivory" : "text-sand hover:text-ivory"
                }`}
              >
                <span
                  className={`font-mono text-[10px] sm:text-[11px] ${
                    i === sel ? "text-gold" : ""
                  }`}
                >
                  0{i + 1}
                </span>
                <span
                  className={`font-display text-xl sm:text-2xl transition-all duration-500 md:text-3xl ${
                    i === sel ? "italic lg:translate-x-3 text-gold" : ""
                  }`}
                >
                  {x.name}
                </span>
              </button>
            ))}
          </div>

          <div key={sel} className="reveal in col-span-12 lg:col-span-9">
            <Tilt max={2.5}>
              <div className="relative overflow-hidden border border-gold/20 bg-gradient-to-br from-vault to-ink p-4 sm:p-6 md:p-12">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6">
                  <div>
                    <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-sand">
                      {v.subname}
                    </p>
                    <h3 className="mt-2 sm:mt-3 font-display text-3xl sm:text-5xl md:text-7xl italic">
                      {v.name}
                    </h3>
                  </div>
                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1 sm:gap-2 border-t border-gold/15 pt-2 sm:border-0 sm:pt-0 sm:text-right">
                    <div className="font-display text-2xl sm:text-4xl md:text-5xl text-gold">
                      {v.bagWeight}
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-sand">
                      Export Sack
                    </div>
                  </div>
                </div>

                {/* Dual Visual Showcase: The Packaging & The Grain */}
                <div className="my-6 sm:my-10">
                  <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-gold/15 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                      <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-sand">
                        Inspection · Packaging & Grain
                      </span>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center rounded-full border border-gold/25 bg-black/40 p-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-sand">
                      <button
                        type="button"
                        onClick={() => setViewMode("both")}
                        className={`rounded-full px-2.5 sm:px-3 py-1 transition-all ${
                          viewMode === "both"
                            ? "bg-gold text-ink font-semibold shadow-xs"
                            : "hover:text-ivory"
                        }`}
                      >
                        <span className="sm:hidden">Both</span>
                        <span className="hidden sm:inline">Both Side-by-Side</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("bag")}
                        className={`rounded-full px-2.5 sm:px-3 py-1 transition-all ${
                          viewMode === "bag"
                            ? "bg-gold text-ink font-semibold shadow-xs"
                            : "hover:text-ivory"
                        }`}
                      >
                        Bag
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("grain")}
                        className={`rounded-full px-2.5 sm:px-3 py-1 transition-all ${
                          viewMode === "grain"
                            ? "bg-gold text-ink font-semibold shadow-xs"
                            : "hover:text-ivory"
                        }`}
                      >
                        3D Grain
                      </button>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div
                    className={`grid gap-4 md:gap-5 ${
                      viewMode === "both"
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {/* CARD 1: Authentic Bag / Packaging */}
                    {(viewMode === "both" || viewMode === "bag") && (
                      <div
                        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-b from-black/50 to-black/35 p-5 backdrop-blur-md transition-all duration-300 hover:border-gold/45"
                        style={{
                          minHeight: viewMode === "both" ? "380px" : "440px",
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
                          <span className="inline-flex items-center gap-1.5 text-gold">
                            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                            COMMERCIAL EXPORT SACK
                          </span>
                          <span className="rounded border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-sand font-semibold">
                            {v.bagWeight.toUpperCase()} SACK
                          </span>
                        </div>

                        {/* Bag presentation with ambient floor glow */}
                        <div className="relative my-auto flex h-[270px] md:h-[320px] items-center justify-center py-2">
                          <VarietyBag name={v.name} className="h-full w-full" />
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gold/15 pt-2.5 text-[11px] text-sand">
                          <span className="truncate">
                            High-Barrier BOPP · Stitched Crepe Band
                          </span>
                          <span className="font-mono text-[10px] text-gold/80 shrink-0">
                            Official Packaging
                          </span>
                        </div>
                      </div>
                    )}

                    {/* CARD 2: 3D Grain Anatomy Viewer */}
                    {(viewMode === "both" || viewMode === "grain") && (
                      <div
                        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-b from-black/50 to-black/35 p-5 backdrop-blur-md transition-all duration-300 hover:border-gold/45"
                        style={{
                          minHeight: viewMode === "both" ? "380px" : "440px",
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
                          <span className="inline-flex items-center gap-1.5 text-gold">
                            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                            3D GRAIN ANATOMY
                          </span>
                          <span className="rounded border border-gold/30 bg-gold/10 px-2 py-0.5 text-sand">
                            {v.len} · CALIBRATED
                          </span>
                        </div>

                        {/* 3D Grain Viewer */}
                        <div
                          ref={vref}
                          className="relative my-auto flex h-[270px] md:h-[320px] w-full items-center justify-center"
                        >
                          <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                              background: `radial-gradient(ellipse 50% 60% at 50% 50%, ${v.tone[2]}33, transparent 70%)`,
                            }}
                          />
                          <div
                            className="relative h-full w-full"
                            role="img"
                            aria-label={`${v.name} rice grain in 3D. Drag to rotate.`}
                          >
                            <GrainViewer
                              mm={v.mm}
                              width={v.width}
                              thickness={v.thickness}
                              color={v.tone[0]}
                              active={seen}
                              onTouch={() => {}}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gold/15 pt-2.5 text-[11px] text-sand">
                          <span className="truncate">
                            ⟷ Drag to rotate in 3D · Calibrated Ratio
                          </span>
                          <span className="font-mono text-[10px] text-gold/80 shrink-0">
                            {v.len} / {MAX_MM} MM
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="max-w-2xl text-lg font-light leading-relaxed text-ivory/85">
                  {v.note}
                </p>

                <div className="mt-12 grid gap-x-12 gap-y-6 md:grid-cols-2">
                  {v.meters.map(([l, n]) => (
                    <Meter key={l} l={l} n={n} />
                  ))}
                </div>

                <div className="mt-12 grid grid-cols-2 gap-px bg-gold/15 md:grid-cols-3">
                  {Object.entries(v.specs).map(([k, val]) => (
                    <div key={k} className="bg-ink p-5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-sand">
                        {k.replace(/([A-Z])/g, " $1")}
                      </div>
                      <div className="mt-2 text-sm text-ivory">{val}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-sm text-sand">
                  <span>
                    <span className="text-gold font-medium">{v.aged}.</span> Best for{" "}
                    {v.best.toLowerCase()}.
                  </span>
                  <Button
                    variant="line"
                    onClick={() => setBag(!bag)}
                    magnetic={false}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    {bag ? "Added to quote ✓" : "Add to quote"}
                  </Button>
                </div>
              </div>
            </Tilt>
            <ul className="mt-6 grid gap-2.5 text-sm text-sand md:grid-cols-2">
              {v.pins.map((p) => (
                <li key={p} className="flex items-baseline gap-2.5">
                  <span className="font-mono text-xs text-gold/70 select-none">—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
