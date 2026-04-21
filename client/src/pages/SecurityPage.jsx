import StaticLayout from '../components/StaticLayout'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const practices = [
  { icon: '🔐', title: 'SHA-256 Deliverable Hashing', body: 'Every file submitted through SafeLancer is cryptographically hashed using SHA-256. The hash is stored immutably — it\'s computationally infeasible to produce a collision. If a file changes even by one byte, the hash changes entirely.' },
  { icon: '🔒', title: 'TLS 1.3 Encryption', body: 'All data in transit is encrypted using TLS 1.3 — the latest and most secure version of the protocol. We enforce HSTS and do not support older TLS versions.' },
  { icon: '🛡️', title: 'JWT Authentication', body: 'Session tokens are signed JWTs with a 7-day expiry and a secure server-side secret. Tokens are stored in localStorage and validated on every API request.' },
  { icon: '🔑', title: 'Password Security', body: 'Passwords are hashed using bcrypt with a minimum cost factor of 12. We never store plaintext passwords. We enforce strong password requirements (8+ chars, upper, lower, number, special character).' },
  { icon: '🌐', title: 'OAuth 2.0', body: 'Google OAuth uses the authorization code flow with PKCE. Redirect URIs are strictly validated. We never request unnecessary scopes — only email and profile.' },
  { icon: '🗄️', title: 'Database Security', body: 'Data is stored on MongoDB Atlas with IP allowlisting, TLS, and automated daily backups. Sensitive fields are never logged.' },
]

export default function SecurityPage() {
  return (
    <StaticLayout
      title="Security at SafeLancer."
      subtitle="We're building trust infrastructure. Security isn't a feature — it's our foundation. Here's exactly how we protect your money and your work."
    >
      {/* Security practices */}
      <section style={{ marginBottom: '80px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '32px' }}>Security Practices</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '20px' }}>
          {practices.map(p => (
            <div key={p.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>{p.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: T.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{p.title}</h3>
              <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.7, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SHA-256 explainer */}
      <section style={{ marginBottom: '80px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '20px' }}>How SHA-256 Proof Works</p>
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '36px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              ['01', 'Freelancer uploads deliverable', 'The file is uploaded securely to our servers.'],
              ['02', 'SHA-256 hash is computed', 'A unique 256-bit fingerprint of the file is generated instantly.'],
              ['03', 'Hash is stored with timestamp', 'The hash and submission time are stored immutably in our database.'],
              ['04', 'Certificate is issued', 'A proof certificate is generated showing the hash, timestamp, and contract details.'],
              ['05', 'Client can verify anytime', 'The client can hash the received file and compare — any match confirms the file is exactly what was submitted.'],
            ].map(([n, title, body]) => (
              <div key={n} style={{ display: 'flex', gap: '20px', paddingBottom: '24px', marginBottom: '24px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF6803,#AE3A02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: T.text, marginBottom: '4px' }}>{title}</div>
                  <div style={{ fontSize: '13px', color: T.muted, lineHeight: 1.65 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bug bounty */}
      <section>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '20px' }}>Responsible Disclosure</p>
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ maxWidth: '520px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '20px', color: T.text, margin: '0 0 12px', letterSpacing: '-0.03em' }}>Found a vulnerability?</h3>
            <p style={{ fontSize: '14px', color: T.muted, lineHeight: 1.75, margin: 0 }}>
              We take security seriously and appreciate responsible disclosure. If you find a security issue, please email us at security@safelancer.in. We will acknowledge your report within 24 hours, investigate within 7 days, and credit you publicly (with your permission) if you find a valid issue.
            </p>
          </div>
          <a href="mailto:security@safelancer.in" style={{ background: 'linear-gradient(135deg,#FF6803,#AE3A02)', color: '#fff', textDecoration: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Report a Vulnerability</a>
        </div>
      </section>
    </StaticLayout>
  )
}
