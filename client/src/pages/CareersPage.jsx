import StaticLayout from '../components/StaticLayout'
import useIsMobile from '../utils/useIsMobile'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const perks = [
  { icon: '🌍', title: 'Fully Remote', body: 'Work from anywhere. We operate async-first and trust you to manage your time.' },
  { icon: '📈', title: 'Equity', body: 'Every team member gets meaningful equity. We build together, we win together.' },
  { icon: '🏥', title: 'Health Coverage', body: 'Comprehensive health insurance for you and your family.' },
  { icon: '📚', title: 'Learning Budget', body: '₹50,000/year for courses, books, conferences, and anything that makes you better.' },
  { icon: '🖥️', title: 'Home Setup', body: 'Laptop, monitor, and ₹20,000 to build your ideal workspace.' },
  { icon: '🏖️', title: 'Unlimited PTO', body: 'Take the time you need. We measure output, not hours.' },
]

const openings = [
  { dept: 'Engineering', title: 'Senior Full-Stack Engineer', location: 'Remote (India)', type: 'Full-time' },
  { dept: 'Engineering', title: 'DevSecOps / Infrastructure Engineer', location: 'Remote (India)', type: 'Full-time' },
  { dept: 'Product', title: 'Product Designer (UI/UX)', location: 'Remote (India)', type: 'Full-time' },
  { dept: 'Growth', title: 'Head of Growth & Marketing', location: 'Remote (India)', type: 'Full-time' },
  { dept: 'Operations', title: 'Customer Success Lead', location: 'Remote (India)', type: 'Full-time' },
]

export default function CareersPage() {
  const isMobile = useIsMobile()
  return (
    <StaticLayout
      title="Build the future of work."
      subtitle="We're a small, high-conviction team building the trust infrastructure for the global freelance economy. If that excites you, let's talk."
    >
      {/* Culture */}
      <section style={{ marginBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '28px' : '48px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '16px' }}>Our Culture</p>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(26px,3.5vw,44px)', letterSpacing: '-0.05em', color: T.text, margin: '0 0 20px', lineHeight: 1.1 }}>We ship fast.<br />We think deep.</h2>
            <p style={{ fontSize: '14px', color: T.muted, lineHeight: 1.75, margin: '0 0 14px' }}>SafeLancer is not a 9-to-5. We're a mission-driven team obsessed with solving a real problem: making freelance work trustworthy for everyone, everywhere.</p>
            <p style={{ fontSize: '14px', color: T.muted, lineHeight: 1.75, margin: 0 }}>We value clear thinking, direct communication, and radical ownership. We don't have layers of management — everyone builds, everyone ships.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
            {perks.map(p => (
              <div key={p.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>{p.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: T.text, marginBottom: '6px' }}>{p.title}</div>
                <div style={{ fontSize: '12px', color: T.muted, lineHeight: 1.5 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '32px' }}>Open Roles</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {openings.map(r => (
            <div key={r.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', transition: 'border-color .2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6803'}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.blue, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{r.dept}</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: T.text, marginBottom: '4px' }}>{r.title}</div>
                <div style={{ fontSize: '12px', color: T.faint }}>{r.location} · {r.type}</div>
              </div>
              <button style={{ background: 'linear-gradient(135deg,#FF6803,#AE3A02)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Apply →</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: T.muted, margin: '0 0 16px' }}>Don't see your role? We hire for talent, not just open positions.</p>
          <a href="mailto:careers@safelancer.in" style={{ fontSize: '14px', color: T.blue, fontWeight: 600, textDecoration: 'none' }}>Send us your resume →</a>
        </div>
      </section>
    </StaticLayout>
  )
}
