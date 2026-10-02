import { useState } from 'react'
import ScrollStory from './sections/Story'
import Marquee from './sections/Marquee'
import Products from './sections/Products'
import Heritage from './sections/Heritage'
import Voices from './sections/Voices'
import Quote from './sections/Quote'
import Footer from './sections/Footer'

export default function App() {
  const [sel, setSel] = useState(0)
  return (
    <main className="bg-ivory">
      <ScrollStory sel={sel} setSel={setSel} />
      <Marquee />
      <Products sel={sel} setSel={setSel} />
      <Heritage />
      <Voices />
      <Quote sel={sel} setSel={setSel} />
      <Footer />
    </main>
  )
}
