import { useState } from 'react'

export type PartnerUser = {
  name: string
  company: string
  tier: string
  id: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  partnerUser: PartnerUser | null
  setPartnerUser: (user: PartnerUser | null) => void
  onSkipToQuote: () => void
}

export default function PartnerModal({ isOpen, onClose, partnerUser, setPartnerUser, onSkipToQuote }: Props) {
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  // Company registration fields
  const [regCompany, setRegCompany] = useState('')
  const [regGst, setRegGst] = useState('')
  const [regContact, setRegContact] = useState('')
  const [regPhone, setRegPhone] = useState('')

  if (!isOpen) return null

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setPartnerUser({
        name: email.split('@')[0] || 'Partner',
        company: email.includes('deccan') ? 'Deccan Foods Pvt Ltd' : 'Verified Trade Buyer',
        tier: 'Wholesale Tier-1',
        id: 'TC-2026-' + Math.floor(1000 + Math.random() * 9000),
      })
    }, 450)
  }

  const handleQuickDemoSignIn = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setPartnerUser({
        name: 'Ananya Sharma',
        company: 'Deccan Foods Pvt. Ltd.',
        tier: 'Tier 1 Exporter (Karnal Hub)',
        id: 'TC-9482-GOLD',
      })
    }, 250)
  }

  const handleSignOut = () => {
    setPartnerUser(null)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setRegistered(true)
    }, 500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-modal-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-earth/20 bg-ivory text-earth shadow-2xl transition-all">
        {/* Header pattern bar */}
        <div className="h-2 w-full bg-gradient-to-r from-earth via-gold to-earth" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-earth/5 text-earth/60 transition hover:bg-earth/15 hover:text-earth"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="p-6 md:p-8">
          {partnerUser ? (
            /* Logged in state */
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold text-2xl font-serif">
                ✓
              </div>
              <span className="inline-block rounded-full bg-earth/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-earth/80">
                Verified Trade Partner
              </span>
              <h3 id="partner-modal-title" className="mt-3 text-2xl font-serif font-light">
                Welcome back, {partnerUser.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-earth/70">
                {partnerUser.company} · <span className="text-gold font-semibold">{partnerUser.tier}</span>
              </p>
              <div className="mt-2 text-xs text-earth/50">Partner ID: {partnerUser.id}</div>

              <div className="mt-6 rounded-xl border border-earth/15 bg-rice p-4 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-earth/60">Preferred Contract Rate:</span>
                  <span className="font-semibold text-earth">Direct Ex-Mill Pricing</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-earth/60">Priority Allocation:</span>
                  <span className="font-semibold text-earth">Keshar Kali Wada Kolam (Guaranteed)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-earth/60">Dedicated Broker:</span>
                  <span className="font-semibold text-earth">Karnal Mandi Desk (+91 98110 22334)</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={() => {
                    onClose()
                    onSkipToQuote()
                  }}
                  className="flex-1 rounded-full bg-earth px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-rice transition hover:bg-paddy shadow-md"
                >
                  Create Fast Quote
                </button>
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-earth/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-earth/70 transition hover:border-earth hover:text-earth hover:bg-earth/5"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Sign in / Register forms */
            <div>
              <div className="flex items-center gap-2 text-gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">B2B & Wholesale Gateway</span>
              </div>

              <h3 id="partner-modal-title" className="mt-2 text-2xl font-serif font-light md:text-3xl">
                Partner Trade Portal
              </h3>
              <p className="mt-1 text-xs text-earth/60 md:text-sm">
                Access contracted mandi rates, batch certificates, and priority export allocations.
              </p>

              {/* Tabs */}
              <div className="mt-5 flex border-b border-earth/15">
                <button
                  onClick={() => { setTab('signin'); setRegistered(false); }}
                  className={`pb-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
                    tab === 'signin'
                      ? 'border-b-2 border-earth text-earth font-bold'
                      : 'text-earth/50 hover:text-earth'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setTab('register'); setRegistered(false); }}
                  className={`ml-6 pb-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
                    tab === 'register'
                      ? 'border-b-2 border-earth text-earth font-bold'
                      : 'text-earth/50 hover:text-earth'
                  }`}
                >
                  Apply for Account
                </button>
              </div>

              {tab === 'signin' ? (
                <form onSubmit={handleSignIn} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth/60 mb-1">
                      Trade Email / Partner ID
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trade@company.com or TC-8491"
                      className="w-full rounded-lg border border-earth/20 bg-white/70 px-3.5 py-2.5 text-sm text-earth focus:border-earth focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth/60">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => alert('Password reset link sent to registered email.')}
                        className="text-[10px] text-earth/60 hover:text-earth underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-earth/20 bg-white/70 px-3.5 py-2.5 text-sm text-earth focus:border-earth focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-earth/70">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="rounded border-earth/30 text-earth focus:ring-gold"
                      />
                      Remember this workstation
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-earth py-3 text-xs font-semibold uppercase tracking-[0.2em] text-rice transition hover:bg-paddy disabled:opacity-50 shadow-md"
                  >
                    {loading ? 'Authenticating…' : 'Sign In to Portal'}
                  </button>

                  {/* Quick Demo Sign In Button */}
                  <div className="relative my-4 flex items-center justify-center">
                    <span className="absolute inset-x-0 h-px bg-earth/15" />
                    <span className="relative bg-ivory px-3 text-[10px] uppercase tracking-widest text-earth/40">or</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickDemoSignIn}
                    className="w-full rounded-full border border-gold/60 bg-gold/10 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-earth transition hover:bg-gold/25"
                  >
                    ⚡ Quick Demo Sign In (1-Click Preview)
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onSkipToQuote()
                      }}
                      className="text-xs text-earth/60 hover:text-earth transition underline"
                    >
                      Don't have an account? Skip directly to Request a Quote →
                    </button>
                  </div>
                </form>
              ) : registered ? (
                <div className="mt-6 text-center py-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold text-xl">
                    ✓
                  </div>
                  <h4 className="text-xl font-serif">Trade Application Received</h4>
                  <p className="mt-2 text-xs text-earth/70 leading-relaxed max-w-sm mx-auto">
                    Thank you. Our wholesale onboarding team will verify your trade credentials and send access credentials within 4 hours.
                  </p>
                  <button
                    onClick={() => {
                      onClose()
                      onSkipToQuote()
                    }}
                    className="mt-6 rounded-full bg-earth px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-rice hover:bg-paddy"
                  >
                    Proceed to Quote Desk
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth/60 mb-1">Company</label>
                      <input
                        required
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        placeholder="Deccan Foods Pvt Ltd"
                        className="w-full rounded-lg border border-earth/20 bg-white/70 px-3 py-2 text-xs text-earth focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth/60 mb-1">GST / IEC Code</label>
                      <input
                        required
                        value={regGst}
                        onChange={(e) => setRegGst(e.target.value)}
                        placeholder="06AAAAA0000A1Z5"
                        className="w-full rounded-lg border border-earth/20 bg-white/70 px-3 py-2 text-xs text-earth focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth/60 mb-1">Contact Person</label>
                      <input
                        required
                        value={regContact}
                        onChange={(e) => setRegContact(e.target.value)}
                        placeholder="Rajesh Verma"
                        className="w-full rounded-lg border border-earth/20 bg-white/70 px-3 py-2 text-xs text-earth focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth/60 mb-1">Phone / WhatsApp</label>
                      <input
                        required
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98110 00000"
                        className="w-full rounded-lg border border-earth/20 bg-white/70 px-3 py-2 text-xs text-earth focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth/60 mb-1">Business Email</label>
                    <input
                      required
                      type="email"
                      placeholder="procurement@company.com"
                      className="w-full rounded-lg border border-earth/20 bg-white/70 px-3 py-2 text-xs text-earth focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 rounded-full bg-earth py-3 text-xs font-semibold uppercase tracking-[0.2em] text-rice transition hover:bg-paddy disabled:opacity-50"
                  >
                    {loading ? 'Submitting Application…' : 'Submit for Verification'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
