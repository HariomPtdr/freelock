import StaticLayout from '../components/StaticLayout'
import useIsMobile from '../utils/useIsMobile'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const values = [
  { icon: '🔐', title: 'Trust First', body: 'Every transaction on SafeLancer is backed by cryptographic escrow. Funds are locked before work begins — neither party can be cheated.' },
  { icon: '🔗', title: 'Radical Transparency', body: 'SHA-256 hashed deliverables create an immutable audit trail. Every milestone, every payment, every dispute — recorded forever.' },
  { icon: '⚡', title: 'Zero Friction', body: 'We remove the friction of trust. Clients and freelancers focus on great work, not payment anxiety or contract disputes.' },
  { icon: '🌍', title: 'Built for Everyone', body: 'From solo designers to 50-person agencies. From ₹5,000 gigs to ₹50 lakh projects. SafeLancer scales with your ambitions.' },
]

const contributors = [
  'Hariom Patidar',
  'Divya Jain',
  'Harman Singh',
  'Khushal Patidar',
  'Harsh Patil',
  'Dimple Wadhwani',
]

export default function AboutPage() {
  const isMobile = useIsMobile()
  return (
    <StaticLayout
      title="Built for trust."
      subtitle="SafeLancer is a cryptographic escrow platform for freelancers and clients who refuse to work on blind faith. We believe every professional deserves to be paid, and every client deserves what they paid for."
    >
      {/* Hackathon notice */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ background: 'rgba(255,104,3,0.06)', border: `1px solid ${T.blue}40`, borderRadius: '16px', padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>🏆</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: T.text, marginBottom: '6px' }}>Hackathon Project</div>
            <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.7, margin: 0 }}>
              SafeLancer was built as a hackathon project — a fully functional proof-of-concept for cryptographic escrow in the freelance economy.
              This is not a live commercial product. The platform demonstrates what trust infrastructure for freelancing could look like
              with smart escrow, SHA-256 verified deliverables, and a transparent dispute system.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ marginBottom: '96px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '16px' }}>Our Mission</p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '28px' : '48px', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px,4vw,52px)', letterSpacing: '-0.05em', lineHeight: 1, color: T.text, margin: '0 0 24px' }}>
              Freelance without fear.
            </h2>
            <p style={{ fontSize: '15px', color: T.muted, lineHeight: 1.75, margin: '0 0 16px' }}>
              Every year, millions of freelancers lose income to non-paying clients. Millions of clients lose money to undelivered work. The freelance economy runs on trust — but trust without infrastructure is just hope.
            </p>
            <p style={{ fontSize: '15px', color: T.muted, lineHeight: 1.75, margin: 0 }}>
              SafeLancer replaces hope with cryptographic proof. Smart escrow, SHA-256 verified deliverables, and a transparent dispute system mean both sides win — or nobody loses.
            </p>
          </div>
          {/* What we built */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              ['🔒', 'Cryptographic Escrow', 'Funds locked on-chain before any work begins'],
              ['🧾', 'SHA-256 Deliverables', 'Every file submission is hashed and timestamped'],
              ['⚖️', 'Dispute Resolution', 'Transparent, admin-mediated resolution system'],
              ['📊', 'Milestone Payments', 'Break projects into stages — pay as work progresses'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: T.text }}>{title}</div>
                  <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ marginBottom: '96px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '40px' }}>Our Values</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '20px' }}>
          {values.map(v => (
            <div key={v.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '32px 28px' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>{v.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.03em', color: T.text, margin: '0 0 10px' }}>{v.title}</h3>
              <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.7, margin: 0 }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contributors */}
      <section>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '12px' }}>Contributors</p>
        <p style={{ fontSize: '13px', color: T.muted, marginBottom: '32px', lineHeight: 1.6 }}>Built with ❤️ by a team of 6 developers during a hackathon.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px' }}>
          {contributors.map(name => (
            <div key={name} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF6803,#AE3A02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: '#fff', flexShrink: 0 }}>
                {name[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: T.text }}>{name}</div>
                <div style={{ fontSize: '11px', color: T.faint, marginTop: '2px' }}>Contributor</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </StaticLayout>
  )
}
