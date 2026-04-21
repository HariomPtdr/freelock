import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from './SafeLancerLogo'

const T = {
  bg: '#0B0501', border: 'rgba(255,104,3,0.15)', blue: '#FF6803',
  text: '#F5EDE4', muted: '#BFBFBF', faint: '#6b5445',
  gradB: 'linear-gradient(135deg,#FF6803 0%,#AE3A02 100%)',
}

export default function StaticLayout({ children, title, subtitle }) {
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter',-apple-system,sans-serif", color: T.text, overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(4,4,12,0.92)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', borderBottom: `1px solid ${T.border}`, padding: '0 5%' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '66px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => { nav('/'); setMenuOpen(false) }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: T.gradB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoMark size={17} color="white" keyholeColor="#7A2200" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.05em' }}>SafeLancer</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: T.blue, background: `${T.blue}1a`, border: `1px solid ${T.blue}35`, borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.07em' }}>BETA</span>
          </div>

          {/* Desktop buttons */}
          <div className="nav-desktop-links" style={{ display: 'flex', gap: '9px' }}>
            <button onClick={() => nav('/login')} style={{ background: 'none', border: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 500, color: T.muted, cursor: 'pointer', padding: '8px 18px', borderRadius: '9px' }}>Log in</button>
            <button onClick={() => nav('/register')} style={{ background: T.gradB, color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Get Started</button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexDirection: 'column', gap: '5px' }}
          >
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#FF6803' : '#BFBFBF', borderRadius: '2px', transition: 'transform .2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#BFBFBF', borderRadius: '2px', opacity: menuOpen ? 0 : 1, transition: 'opacity .2s' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#FF6803' : '#BFBFBF', borderRadius: '2px', transition: 'transform .2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ padding: '16px 5% 24px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => { nav('/login'); setMenuOpen(false) }} style={{ width: '100%', background: 'none', border: `1px solid ${T.border}`, fontSize: '14px', fontWeight: 500, color: T.muted, cursor: 'pointer', padding: '12px', borderRadius: '10px' }}>Log in</button>
            <button onClick={() => { nav('/register'); setMenuOpen(false) }} style={{ width: '100%', background: T.gradB, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Get Started</button>
          </div>
        )}
      </nav>

      {/* Hero header */}
      <div style={{ paddingTop: 'clamp(96px,12vw,130px)', paddingBottom: '48px', padding: 'clamp(96px,12vw,130px) 5% 48px', maxWidth: '1360px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '760px' }}>
          {title && <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px,6vw,80px)', letterSpacing: '-0.06em', lineHeight: 0.9, margin: '0 0 20px', background: T.gradB, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h1>}
          {subtitle && <p style={{ fontSize: 'clamp(14px,1.5vw,18px)', color: T.muted, lineHeight: 1.7, margin: 0 }}>{subtitle}</p>}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: T.border, margin: '0 5%' }} />

      {/* Content */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: 'clamp(32px,5vw,72px) 5% clamp(60px,8vw,120px)', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '32px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <span style={{ fontSize: '12px', color: T.faint }}>© 2025 SafeLancer. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Security', '/security'], ['Contact', '/contact']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: '12px', color: T.faint, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = T.muted}
              onMouseLeave={e => e.target.style.color = T.faint}>{l}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
