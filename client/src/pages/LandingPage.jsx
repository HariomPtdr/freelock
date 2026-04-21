import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Hero3D         from '../components/Hero3D'
import FooterParticles from '../components/FooterParticles'
import { LogoMark } from '../components/SafeLancerLogo'

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════ */
const T = {
  bg:       '#0B0501',
  surface:  'rgba(255,255,255,0.038)',
  glass:    'rgba(18,10,2,0.82)',
  border:   'rgba(255,104,3,0.15)',
  borderB:  'rgba(255,104,3,0.55)',
  blue:     '#FF6803',
  violet:   '#AE3A02',
  cyan:     '#BFBFBF',
  neon:     '#BFBFBF',
  text:     '#F5EDE4',
  muted:    '#BFBFBF',
  faint:    'rgba(245,237,228,0.12)',
  gradB:    'linear-gradient(135deg,#FF6803 0%,#AE3A02 100%)',
  gradBt:   'linear-gradient(135deg,#FF6803,#AE3A02)',
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect() } }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, on]
}

function Reveal({ children, delay = 0, y = 50, style = {} }) {
  const [ref, on] = useReveal()
  return (
    <div ref={ref} style={{
      opacity:    on ? 1 : 0,
      transform:  on ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity .80s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .80s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* True per-card mouse-tilt */
function TiltCard({ children, accent = T.blue, style = {}, className = '' }) {
  const ref = useRef(null)
  const rAF = useRef(null)
  const onMove = useCallback(e => {
    cancelAnimationFrame(rAF.current)
    rAF.current = requestAnimationFrame(() => {
      const el = ref.current; if (!el) return
      const r  = el.getBoundingClientRect()
      const x  = (e.clientX - r.left)  / r.width  - 0.5
      const y  = (e.clientY - r.top)   / r.height - 0.5
      el.style.transform    = `perspective(900px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateZ(8px)`
      el.style.borderColor  = `${accent}50`
      el.style.boxShadow    = `0 20px 60px rgba(0,0,0,.7), 0 0 40px ${accent}25, inset 0 1px 0 rgba(255,255,255,.09)`
      const spot = el.querySelector('.card-spot')
      if (spot) { spot.style.opacity = '1'; spot.style.left = `${(x+.5)*100}%`; spot.style.top = `${(y+.5)*100}%` }
    })
  }, [accent])
  const onLeave = useCallback(() => {
    cancelAnimationFrame(rAF.current)
    const el = ref.current; if (!el) return
    el.style.transform   = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)'
    el.style.borderColor = T.border
    el.style.boxShadow   = '0 4px 24px rgba(0,0,0,.5)'
    const spot = el.querySelector('.card-spot'); if (spot) spot.style.opacity = '0'
  }, [])
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={className}
      style={{
        background:   T.glass,
        backdropFilter: 'blur(28px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
        border:       `1px solid ${T.border}`,
        boxShadow:    '0 4px 24px rgba(0,0,0,.5)',
        borderRadius: '20px',
        transition:   'transform .40s cubic-bezier(.16,1,.3,1), border-color .3s, box-shadow .3s',
        willChange:   'transform',
        position:     'relative',
        overflow:     'hidden',
        ...style,
      }}>
      <div className="card-spot" style={{
        position: 'absolute', width: '240px', height: '240px', borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        transform: 'translate(-50%,-50%)', pointerEvents: 'none', opacity: 0,
        transition: 'opacity .3s', zIndex: 0,
      }}/>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

/* Counter */
function Counter({ end, prefix = '', suffix = '', color = T.blue }) {
  const [val, setVal] = useState(0)
  const [ref, on]     = useReveal(0.5)
  useEffect(() => {
    if (!on) return
    let v = 0; const step = end / 70
    const id = setInterval(() => { v += step; if (v >= end) { setVal(end); clearInterval(id) } else setVal(Math.floor(v)) }, 22)
    return () => clearInterval(id)
  }, [on, end])
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(40px,5.5vw,76px)', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1, background: `linear-gradient(135deg,${color},${T.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: "transparent" }}>
        {prefix}{val.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: T.muted, marginTop: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {['Funds Secured', 'Contracts Protected', 'Dispute Resolution', 'Deliverables'][['₹', '', '', ''][['₹','','',''].indexOf(prefix)] || 0] || ''}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const nav = useNavigate()

  /* Intro overlay state */
  const [phase, setPhase] = useState(0) // 0=visible, 1=sliding out, 2=gone
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => { setPhase(1); document.body.style.overflow = '' }, 2000)
    const t2 = setTimeout(() => setPhase(2), 2900)
    return () => { clearTimeout(t1); clearTimeout(t2); document.body.style.overflow = '' }
  }, [])

  /* 3D → 2D scroll fade */
  const heroCanvasRef = useRef(null)
  useEffect(() => {
    const tick = () => {
      const el = heroCanvasRef.current; if (!el) return
      const p  = Math.min(1, window.scrollY / (window.innerHeight * 0.65))
      el.style.opacity   = Math.max(0, 1 - p * 1.6).toString()
      el.style.transform = `scale(${1 - p * 0.06})`
      el.style.filter    = `blur(${p * 12}px)`
    }
    window.addEventListener('scroll', tick, { passive: true })
    return () => window.removeEventListener('scroll', tick)
  }, [])

  return (
    <div style={{ background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", color: T.text, overflowX: 'hidden' }}>

      {/* ╔══════════════════════════════════════════════════════
          INTRO OVERLAY
      ══════════════════════════════════════════════════════╗ */}
      {phase < 2 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: T.bg,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px',
          transform:  phase === 1 ? 'translateY(-100%)' : 'none',
          transition: 'transform .85s cubic-bezier(.76,0,.24,1)',
          pointerEvents: phase > 0 ? 'none' : 'all',
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: T.gradB, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 60px ${T.blue}60`, animation: 'i-pop .5s cubic-bezier(.16,1,.3,1) .1s both' }}><LogoMark size={30} color="white" keyholeColor="#7A2200" /></div>
          <div style={{ fontWeight: 900, fontSize: 'clamp(28px,5vw,58px)', letterSpacing: '-0.07em', color: T.text, animation: 'i-blur .7s ease .25s both' }}>SafeLancer</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.22em', color: T.muted, textTransform: 'uppercase', fontWeight: 500, animation: 'i-blur .6s ease .55s both' }}>Freelance · Escrow · Verified</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,transparent,${T.blue},${T.violet},transparent)`, transformOrigin: 'left', animation: 'i-bar 1.8s ease .3s both' }} />
        </div>
      )}

      {/* ╔══════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════╗ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(4,4,12,0.75)', backdropFilter: 'blur(22px) saturate(1.8)', WebkitBackdropFilter: 'blur(22px) saturate(1.8)', borderBottom: `1px solid ${T.border}`, padding: '0 6%' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '66px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => nav('/')}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: T.gradB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoMark size={17} color="white" keyholeColor="#7A2200" /></div>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.05em' }}>SafeLancer</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: T.neon, background: `${T.blue}1a`, border: `1px solid ${T.blue}35`, borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.07em' }}>BETA</span>
          </div>
          <div style={{ display: 'flex', gap: '36px' }}>
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Features',     href: '#features' },
              { label: 'Pricing',      href: '#pricing' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: '13px', fontWeight: 500, color: T.muted, textDecoration: 'none', transition: 'color .18s' }}
                onMouseEnter={e => e.target.style.color = T.text}
                onMouseLeave={e => e.target.style.color = T.muted}>{label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '9px' }}>
            <button onClick={() => nav('/login')} style={{ background: 'none', border: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 500, color: T.muted, cursor: 'pointer', padding: '8px 18px', borderRadius: '9px', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderB; e.currentTarget.style.color = T.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted }}>
              Log in
            </button>
            <button onClick={() => nav('/register')} style={{ background: T.gradB, color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 20px ${T.blue}44`, transition: 'transform .15s, box-shadow .2s, opacity .15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 32px ${T.blue}66` }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 2px 20px ${T.blue}44` }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ╔══════════════════════════════════════════════════════
          HERO — full-screen 3D background
      ══════════════════════════════════════════════════════╗ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* 3D Canvas — full-screen background */}
        <div ref={heroCanvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform, opacity, filter' }}>
          <Hero3D />
        </div>

        {/* Gradient overlays for text legibility */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(4,4,12,0.2) 0%, rgba(4,4,12,0.5) 60%, rgba(4,4,12,0.95) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', zIndex: 1, background: 'linear-gradient(to top, #0B0501 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '96px 6% 0', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${T.blue}14`, border: `1px solid ${T.blue}35`, borderRadius: '999px', padding: '6px 18px', marginBottom: '20px', animation: 'i-blur .8s ease 2.4s both' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981, 0 0 20px #10B98180' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: T.neon, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live · Cryptographic Escrow Platform</span>
          </div>

          {/* Main heading — HUGE */}
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(52px,9vw,110px)', letterSpacing: '-0.07em', lineHeight: 0.86, margin: '0 0 18px', animation: 'i-blur 1s ease 2.7s both' }}>
            <span style={{ display: 'block', color: T.text, textShadow: '0 0 80px rgba(255,104,3,0.25)' }}>Secure</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#BFBFBF 0%,#AE3A02 50%,#BFBFBF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: "transparent", filter: 'drop-shadow(0 0 60px rgba(255,104,3,0.8))' }}>Freelance</span>
            <span style={{ display: 'block', color: T.text, textShadow: '0 0 80px rgba(255,104,3,0.25)' }}>Work.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(14px,1.3vw,16px)', color: T.muted, lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 24px', fontWeight: 400, animation: 'i-blur .9s ease 3.1s both' }}>
            Lock funds before work begins. Release on approval. Every milestone SHA-256 verified — immutable proof, zero fraud.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', animation: 'i-blur .8s ease 3.4s both' }}>
            <button onClick={() => nav('/register')} style={{ background: T.gradB, color: '#fff', border: 'none', borderRadius: '12px', padding: '16px 36px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 32px ${T.blue}50, 0 0 0 1px ${T.blue}30`, transition: 'transform .2s, box-shadow .2s', display: 'inline-flex', alignItems: 'center', gap: '9px', letterSpacing: '-0.02em' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 12px 50px ${T.blue}65, 0 0 0 1px ${T.blue}50` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 32px ${T.blue}50, 0 0 0 1px ${T.blue}30` }}>
              Start Free
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M3 8h10M8 3l5 5-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => nav('/login')} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: '12px', padding: '16px 30px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', backdropFilter: 'blur(16px)', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderB; e.currentTarget.style.background = T.glass }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface }}>
              View Demo
            </button>
          </div>

          {/* Trust row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '24px', animation: 'i-blur .8s ease 3.7s both' }}>
            <div style={{ display: 'flex' }}>
              {[T.blue, T.violet, T.cyan, '#10B981'].map((c, i) => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${T.bg}`, background: `${c}`, marginLeft: i ? '-10px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                  {['F','C','F','C'][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '13px', color: T.muted }}>
              <strong style={{ color: T.text, fontWeight: 700 }}>1,247+</strong> contracts secured this month
            </span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: T.muted }} />
            <span style={{ fontSize: '13px', color: T.muted }}>
              <strong style={{ color: '#10B981', fontWeight: 700 }}>₹2.4Cr</strong> in escrow
            </span>
          </div>
        </div>

        {/* Ticker — pinned inside hero at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, borderTop: `1px solid ${T.border}`, background: `${T.blue}08`, padding: '13px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'ticker 32s linear infinite', whiteSpace: 'nowrap' }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: `${T.neon}55` }}>
                {'  ·  ESCROW  ·  SHA-256  ·  MILESTONE PAYMENTS  ·  ZERO FRAUD  ·  CRYPTOGRAPHIC PROOF  ·  SMART RELEASE  ·  VERIFIED DELIVERY  ·  TRUSTLESS  ·  '}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════
          FEATURES — glassmorphism cards with real tilt
      ══════════════════════════════════════════════════════╗ */}
      <section id="features" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 6%', background: '#0B0501', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
          <Reveal>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.blue, marginBottom: '16px' }}>Three principles</p>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,5.5vw,72px)', letterSpacing: '-0.06em', lineHeight: 0.95, color: T.text, maxWidth: '600px', marginBottom: '80px' }}>
              Built for trust.<br />
              <span style={{ color: T.faint }}>Every step verified.</span>
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '18px' }}>
            {[
              { icon: '🔐', title: 'Lock Before Work', body: 'Client funds are escrowed upfront. Work begins only after payment is confirmed. No more invoice chasing.', color: T.blue, n: '01' },
              { icon: '🔗', title: 'SHA-256 Proof', body: 'Every deliverable is cryptographically hashed. Immutable evidence stored forever — no one can fake proof of work.', color: T.violet, n: '02' },
              { icon: '✅', title: 'Release on Approval', body: 'Client approves → funds release instantly. Disputes auto-escalate. 72h auto-release protects freelancers.', color: T.cyan, n: '03' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 110}>
                <TiltCard accent={f.color} style={{ padding: '44px 38px 42px', boxShadow: `0 0 0 1px ${f.color}30, 0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)` }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${f.color}18`, border: `1px solid ${f.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{f.icon}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: `${f.color}80`, letterSpacing: '0.1em' }}>{f.n}</span>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.04em', color: T.text, marginBottom: '14px', lineHeight: 1.15 }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: T.muted, lineHeight: 1.75, margin: 0 }}>{f.body}</p>
                  {/* Bottom accent line */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${f.color}60, transparent)`, borderRadius: '0 0 20px 20px' }} />
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════
          PROCESS — editorial large numbered steps
      ══════════════════════════════════════════════════════╗ */}
      <section id="how-it-works" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 6%', borderTop: `1px solid ${T.border}`, background: '#0B0501', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
          <Reveal>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.blue, marginBottom: '16px' }}>The flow</p>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(34px,5vw,66px)', letterSpacing: '-0.06em', lineHeight: 0.95, color: T.text, marginBottom: '90px', maxWidth: '520px' }}>
              How it works.<br /><span style={{ color: T.faint }}>Step by step.</span>
            </h2>
          </Reveal>

          <div style={{ position: 'relative' }}>
            {/* Vertical connector */}
            <div style={{ position: 'absolute', left: '39px', top: '16px', bottom: '16px', width: '1px', background: `linear-gradient(to bottom, ${T.blue}60, ${T.violet}60, ${T.cyan}40, transparent)`, zIndex: 0 }} />

            {[
              { n: '01', t: 'Post a Job',         d: 'Define your project, budget, and milestone breakdown. The escrow contract is generated automatically.' },
              { n: '02', t: 'Interview & Hire',   d: 'Browse portfolios, schedule video interviews, negotiate terms — all inside SafeLancer.' },
              { n: '03', t: 'Fund Milestones',    d: 'Client funds each milestone via Razorpay. Funds lock in escrow. Work begins only when confirmed.' },
              { n: '04', t: 'Submit & Verify',    d: 'Upload deliverables. SHA-256 hash proves authenticity. Approve to release, dispute to escalate.' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 90} y={30}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '40px', padding: '40px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none', position: 'relative', zIndex: 1 }}>
                  {/* Number circle */}
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `1px solid ${[T.blue,T.violet,T.cyan,T.neon][i]}55`, background: `${[T.blue,T.violet,T.cyan,T.neon][i]}0e`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(10px)' }}>
                    <span style={{ fontWeight: 900, fontSize: '17px', letterSpacing: '-0.05em', color: [T.blue,T.violet,T.cyan,T.neon][i] }}>{s.n}</span>
                  </div>
                  <div style={{ paddingTop: '18px', flex: 1 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 'clamp(20px,2.6vw,32px)', letterSpacing: '-0.04em', color: T.text, marginBottom: '10px' }}>{s.t}</h3>
                    <p style={{ fontSize: '15px', color: T.muted, lineHeight: 1.72, margin: 0, maxWidth: '540px' }}>{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════
          GALLERY — cinematic preview cards
      ══════════════════════════════════════════════════════╗ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', borderTop: `1px solid ${T.border}`, background: 'rgba(255,104,3,0.016)', padding: '80px 6%' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
          <Reveal>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.blue, marginBottom: '16px' }}>Platform preview</p>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(32px,4.8vw,64px)', letterSpacing: '-0.06em', lineHeight: 0.95, color: T.text, marginBottom: '72px', maxWidth: '480px' }}>
              Inside the product.
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '16px' }}>
            {[
              { label: 'ESCROW DASHBOARD', title: 'Milestone tracker', sub: '₹64,000 locked · Phase 2 of 3', bar: 66, tag: 'In Review',  tagC: T.blue },
              { label: 'DELIVERY PROOF',   title: 'SHA-256 Certificate', sub: 'Verified · 12 Apr 2025',      bar: 100, tag: 'Verified', tagC: '#10B981' },
              { label: 'DISPUTE PANEL',    title: 'Arbitration board',   sub: 'Evidence submitted',           bar: 40,  tag: 'Pending', tagC: '#FF6803' },
            ].map((p, i) => (
              <Reveal key={i} delay={i * 110} y={60}>
                <TiltCard accent={p.tagC} style={{ overflow: 'hidden', padding: '0' }}>
                  {/* Window chrome */}
                  <div style={{ background: `${p.tagC}0e`, borderBottom: `1px solid ${T.border}`, padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', color: `${p.tagC}80`, textTransform: 'uppercase' }}>{p.label}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {['#EF4444','#FF6803','#22C55E'].map(c => <div key={c} style={{ width: '7px', height: '7px', borderRadius: '50%', background: `${c}55` }} />)}
                    </div>
                  </div>
                  <div style={{ padding: '28px 24px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '19px', letterSpacing: '-0.04em', color: T.text, marginBottom: '4px' }}>{p.title}</div>
                        <div style={{ fontSize: '12px', color: T.muted }}>{p.sub}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 11px', borderRadius: '999px', background: `${p.tagC}1a`, color: p.tagC, border: `1px solid ${p.tagC}40`, letterSpacing: '0.05em', alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>{p.tag}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '4px', background: `${T.blue}18`, overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ width: `${p.bar}%`, height: '100%', background: `linear-gradient(90deg,${p.tagC},${T.cyan})`, borderRadius: '4px', transition: 'width 1.4s ease' }} />
                    </div>
                    {[78, 58, 42].map((w, li) => (
                      <div key={li} style={{ height: '7px', borderRadius: '4px', background: T.surface, marginBottom: '8px', width: `${w}%` }} />
                    ))}
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════╗ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 6%', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
          <Reveal>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(32px,5vw,64px)', letterSpacing: '-0.06em', lineHeight: 0.95, color: T.text, textAlign: 'center', marginBottom: '90px' }}>
              Numbers that matter.
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1px', background: T.border, borderRadius: '20px', overflow: 'hidden' }}>
            {[
              { end: 2400000, prefix: '₹', suffix: '', label: 'Funds Secured',         color: T.blue },
              { end: 1247,    prefix: '',  suffix: '+', label: 'Contracts Protected',  color: T.violet },
              { end: 99,      prefix: '',  suffix: '%', label: 'Dispute Resolution',   color: T.cyan },
              { end: 4800,    prefix: '',  suffix: '+', label: 'Deliverables Verified',color: T.neon },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ background: T.bg, padding: '52px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(38px,5vw,72px)', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1, background: `linear-gradient(135deg,${s.color},${T.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: "transparent", marginBottom: '10px' }}>
                    {s.prefix}{s.end.toLocaleString()}{s.suffix}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════
          CTA — 2D → 3D feel: depth returns with glow
      ══════════════════════════════════════════════════════╗ */}
      <section id="pricing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 6%', borderTop: `1px solid ${T.border}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Deep glow behind CTA */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '500px', background: `radial-gradient(ellipse, ${T.blue}12 0%, ${T.violet}08 40%, transparent 70%)`, pointerEvents: 'none', filter: 'blur(40px)' }} />
        {/* Grid lines coming back (3D hint) */}
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${T.border}50 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, ${T.border}50 40px)`, opacity: 0.25, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)' }} />

        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(44px,8vw,108px)', letterSpacing: '-0.07em', lineHeight: 0.90, color: T.text, marginBottom: '28px' }}>
              Ready to build<br />
              <span style={{ background: T.gradB, WebkitBackgroundClip: 'text', WebkitTextFillColor: "transparent", filter: 'drop-shadow(0 0 40px rgba(255,104,3,0.5))' }}>trust?</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ fontSize: '16px', color: T.muted, lineHeight: 1.72, maxWidth: '420px', margin: '0 auto 50px' }}>
              Join thousands of freelancers and clients using SafeLancer for secure, verified project payments.
            </p>
          </Reveal>
          <Reveal delay={180} y={24}>
            <button onClick={() => nav('/register')} style={{ background: T.gradB, color: '#fff', border: 'none', borderRadius: '14px', padding: '20px 52px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 48px ${T.blue}55, 0 0 0 1px ${T.blue}40`, transition: 'transform .2s, box-shadow .2s', display: 'inline-flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; e.currentTarget.style.boxShadow = `0 20px 70px ${T.blue}70, 0 0 0 1px ${T.blue}60` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 8px 48px ${T.blue}55, 0 0 0 1px ${T.blue}40` }}>
              Start for Free
              <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M4 9h10M9 4l5 5-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </Reveal>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════
          FOOTER — fullscreen interactive particles
      ══════════════════════════════════════════════════════╗ */}
      <footer style={{ position: 'relative', borderTop: `1px solid ${T.border}`, minHeight: '320px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}><FooterParticles /></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1360px', margin: '0 auto', padding: '70px 6% 52px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '52px', boxSizing: 'border-box' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: T.gradB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoMark size={14} color="white" keyholeColor="#7A2200" /></div>
              <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.04em' }}>SafeLancer</span>
            </div>
            <p style={{ fontSize: '13px', color: '#1c1008', lineHeight: 1.65, maxWidth: '210px', margin: '0 0 20px' }}>Cryptographic escrow for the future of work.</p>
            <div style={{ fontSize: '11px', color: '#120a02' }}>© 2025 SafeLancer</div>
          </div>
          {[
            { h: 'Platform', links: ['How It Works', 'Features', 'Pricing', 'API'] },
            { h: 'Company',  links: ['About', 'Blog', 'Careers', 'Press'] },
            { h: 'Legal',    links: ['Privacy', 'Terms', 'Security', 'Contact'] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: `${T.blue}55`, marginBottom: '18px' }}>{col.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ fontSize: '13px', color: '#1c1008', textDecoration: 'none', transition: 'color .18s' }}
                    onMouseEnter={e => e.target.style.color = T.text}
                    onMouseLeave={e => e.target.style.color = '#1c1008'}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>

      {/* ╔══════════════════════════════════════════════════════
          KEYFRAMES
      ══════════════════════════════════════════════════════╗ */}
      <style>{`
        @keyframes i-pop  { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
        @keyframes i-blur { from{opacity:0;filter:blur(18px);transform:translateY(20px)} to{opacity:1;filter:blur(0);transform:translateY(0)} }
        @keyframes i-bar  { from{transform:scaleX(0);opacity:0} to{transform:scaleX(1);opacity:1} }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        @keyframes s-pulse{ 0%,100%{opacity:.4;transform:scaleY(1)} 50%{opacity:.9;transform:scaleY(1.2)} }

        @media (max-width: 860px) {
          section:nth-of-type(1) { padding-top: 100px !important; }
        }
        @media (max-width: 640px) {
          footer > div { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
