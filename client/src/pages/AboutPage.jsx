import StaticLayout from '../components/StaticLayout'
import useIsMobile from '../utils/useIsMobile'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const values = [
  { icon: '🔐', title: 'Trust First', body: 'Every transaction on SafeLancer is backed by cryptographic escrow. Funds are locked before work begins — neither party can be cheated.' },
  { icon: '🔗', title: 'Radical Transparency', body: 'SHA-256 hashed deliverables create an immutable audit trail. Every milestone, every payment, every dispute — recorded forever.' },
  { icon: '⚡', title: 'Zero Friction', body: 'We remove the friction of trust. Clients and freelancers focus on great work, not payment anxiety or contract disputes.' },
  { icon: '🌍', title: 'Built for Everyone', body: 'From solo designers to 50-person agencies. From ₹5,000 gigs to ₹50 lakh projects. SafeLancer scales with your ambitions.' },
]

const team = [
  { name: 'Hariom Patidar', role: 'Founder & CEO', bio: 'Building the infrastructure for the future of trusted work.' },
  { name: 'Engineering Team', role: 'Platform & Infrastructure', bio: 'Obsessed with cryptographic security, zero-downtime systems, and developer experience.' },
  { name: 'Design Team', role: 'Product & UX', bio: 'Crafting interfaces that make complex escrow workflows feel effortless.' },
]

export default function AboutPage() {
  const isMobile = useIsMobile()
  return (
    <StaticLayout
      title="Built for trust."
      subtitle="SafeLancer is a cryptographic escrow platform for freelancers and clients who refuse to work on blind faith. We believe every professional deserves to be paid, and every client deserves what they paid for."
    >
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              ['₹2.4 Crore+', 'secured in escrow'],
              ['1,247+', 'contracts completed'],
              ['99%', 'dispute resolution rate'],
              ['4,800+', 'deliverables verified'],
            ].map(([num, label]) => (
              <div key={label} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', color: T.blue }}>{num}</span>
                <span style={{ fontSize: '13px', color: T.muted }}>{label}</span>
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

      {/* Team */}
      <section>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '40px' }}>The Team</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px' }}>
          {team.map(m => (
            <div key={m.name} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '32px 28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF6803,#AE3A02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: '#fff', marginBottom: '16px' }}>
                {m.name[0]}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: T.text, margin: '0 0 4px' }}>{m.name}</h3>
              <p style={{ fontSize: '12px', color: T.blue, fontWeight: 600, margin: '0 0 12px', letterSpacing: '0.04em' }}>{m.role}</p>
              <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.65, margin: 0 }}>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </StaticLayout>
  )
}
