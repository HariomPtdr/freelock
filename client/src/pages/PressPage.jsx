import StaticLayout from '../components/StaticLayout'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const coverage = [
  { outlet: 'YourStory', date: 'Mar 2025', title: 'SafeLancer brings cryptographic escrow to India\'s ₹50,000 Crore freelance market' },
  { outlet: 'Inc42', date: 'Feb 2025', title: 'How SafeLancer is solving the payment fraud crisis for Indian freelancers' },
  { outlet: 'Economic Times', date: 'Jan 2025', title: 'Startup of the week: SafeLancer\'s blockchain-inspired approach to freelance trust' },
]

export default function PressPage() {
  return (
    <StaticLayout
      title="Press & Media."
      subtitle="Resources for journalists, bloggers, and media professionals covering SafeLancer."
    >
      {/* Boilerplate */}
      <section style={{ marginBottom: '72px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '20px' }}>Company Boilerplate</p>
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '32px' }}>
          <p style={{ fontSize: '15px', color: T.muted, lineHeight: 1.8, margin: '0 0 20px' }}>
            <strong style={{ color: T.text }}>SafeLancer</strong> is a cryptographic escrow platform for freelancers and clients. Founded in 2024, SafeLancer uses SHA-256 hashing and milestone-based smart escrow to ensure freelancers get paid and clients receive verified work. With over ₹2.4 Crore secured and 1,247+ contracts completed, SafeLancer is building the trust infrastructure for the future of work.
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText('SafeLancer is a cryptographic escrow platform for freelancers and clients...')}
            style={{ background: 'none', border: `1px solid ${T.border}`, color: T.muted, borderRadius: '8px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
            Copy boilerplate
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ marginBottom: '72px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '20px' }}>Key Facts</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
          {[
            ['Founded', '2024'],
            ['HQ', 'India (Remote)'],
            ['Escrow Volume', '₹2.4 Crore+'],
            ['Contracts', '1,247+'],
            ['Dispute Resolution', '99%'],
            ['Stage', 'Beta / Early Access'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px 22px' }}>
              <div style={{ fontSize: '11px', color: T.faint, marginBottom: '6px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Coverage */}
      <section style={{ marginBottom: '72px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '20px' }}>Media Coverage</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {coverage.map(c => (
            <div key={c.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: T.blue, fontWeight: 700, marginBottom: '6px', letterSpacing: '0.06em' }}>{c.outlet} · {c.date}</div>
                <div style={{ fontSize: '15px', color: T.text, fontWeight: 600 }}>{c.title}</div>
              </div>
              <span style={{ fontSize: '12px', color: T.blue, fontWeight: 600, whiteSpace: 'nowrap' }}>Read →</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '20px' }}>Press Contact</p>
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: T.text, marginBottom: '6px' }}>Media Inquiries</div>
            <div style={{ fontSize: '13px', color: T.muted }}>For press inquiries, interviews, and media kit requests:</div>
          </div>
          <a href="mailto:press@safelancer.in" style={{ background: 'linear-gradient(135deg,#FF6803,#AE3A02)', color: '#fff', textDecoration: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '13px', fontWeight: 600 }}>press@safelancer.in</a>
        </div>
      </section>
    </StaticLayout>
  )
}
