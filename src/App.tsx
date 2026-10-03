import { useState } from 'react'
import ScrollStory from './sections/Story'
import Marquee from './sections/Marquee'
import Products from './sections/Products'
import Heritage from './sections/Heritage'
import Voices from './sections/Voices'
import Quote from './sections/Quote'
import Footer from './sections/Footer'
import PartnerModal, { type PartnerUser } from './components/PartnerModal'
import { scrollToTarget } from './lib/utils'

export default function App() {
  const [sel, setSel] = useState(0)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null)

  return (
    <main className="bg-ivory min-h-screen">
      <ScrollStory
        sel={sel}
        setSel={setSel}
        openAuthModal={() => setAuthModalOpen(true)}
        partnerUser={partnerUser}
      />
      <Marquee />
      <Products
        sel={sel}
        setSel={setSel}
        onSkipToQuote={() => scrollToTarget('quote')}
        openAuthModal={() => setAuthModalOpen(true)}
      />
      <Heritage />
      <Voices />
      <Quote
        sel={sel}
        setSel={setSel}
        partnerUser={partnerUser}
        openAuthModal={() => setAuthModalOpen(true)}
      />
      <Footer
        openAuthModal={() => setAuthModalOpen(true)}
        partnerUser={partnerUser}
      />

      <PartnerModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        partnerUser={partnerUser}
        setPartnerUser={setPartnerUser}
        onSkipToQuote={() => scrollToTarget('quote')}
      />
    </main>
  )
}
