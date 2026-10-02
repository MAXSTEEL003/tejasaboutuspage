const WORDS = [
  'Keshar Kali',
  'Premium Wada Kolam',
  'Khila Khila Dana',
  '5.1 mm Slender Grain',
  'Sortex Optical Cleaned',
  'Aged with Patience',
  'Natural Vitreous Luster',
  'From Trusted Growers',
]

function GrainMark() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden className="shrink-0 opacity-70">
      <ellipse cx="13" cy="6" rx="12" ry="4.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 6.4 C 9 4.6, 17 4.6, 22 6.4" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  )
}

export default function Marquee() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {WORDS.map((w) => (
        <span key={key + w} className="flex items-center">
          <span className="whitespace-nowrap px-7 font-serif text-2xl italic text-rice/90 md:px-10 md:text-3xl">{w}</span>
          <GrainMark />
        </span>
      ))}
    </div>
  )
  return (
    <div className="marquee relative overflow-hidden border-y border-white/10 bg-earth py-5 md:py-6" aria-hidden>
      <div className="marquee-track flex w-max">
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
