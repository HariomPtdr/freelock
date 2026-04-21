import { useNavigate } from 'react-router-dom'
import { LogoMark } from './SafeLancerLogo'

const T = {
  bg: '#0B0501', border: 'rgba(255,104,3,0.15)', blue: '#FF6803',
  text: '#F5EDE4', muted: '#BFBFBF', faint: '#6b5445',
  gradB: 'linear-gradient(135deg,#FF6803 0%,#AE3A02 100%)',
}

export default function StaticLayout({ children, title, subtitle }) {
  const nav = useNavigate()
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter',-apple-system,sans-serif", color: T.text }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(4,4,12,0.85)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', borderBottom: `1px solid ${T.border}`, padding: '0 6%' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '66px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => nav('/')}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: T.gradB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoMark size={17} color="white" keyholeColor="#7A2200" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.05em' }}>SafeLancer</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: T.blue, background: `${T.blue}1a`, border: `1px solid ${T.blue}35`, borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.07em' }}>BETA</span>
          </div>
          <div style={{ display: 'flex', gap: '9px' }}>
            <button onClick={() => nav('/login')} style={{ background: 'none', border: `1px solid ${T.border}`, fontSize: '13px', fontWeight: 500, color: T.muted, cursor: 'pointer', padding: '8px 18px', borderRadius: '9px' }}>Log in</button>
            <button onClick={() => nav('/register')} style={{ background: T.gradB, color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero header */}
      <div style={{ paddingTop: '130px', paddingBottom: '64px', padding: '130px 6% 64px', maxWidth: '1360px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '760px' }}>
          {title && <h1 style={{ fontWeight: 900, fontSize: 'clamp(36px,6vw,80px)', letterSpacing: '-0.06em', lineHeight: 0.9, margin: '0 0 20px', background: T.gradB, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h1>}
          {subtitle && <p style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: T.muted, lineHeight: 1.7, margin: 0 }}>{subtitle}</p>}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: T.border, margin: '0 6%' }} />

      {/* Content */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '72px 6% 120px', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '32px 6%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <span style={{ fontSize: '12px', color: T.faint }}>© 2025 SafeLancer. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
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
