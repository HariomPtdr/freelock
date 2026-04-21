import StaticLayout from '../components/StaticLayout'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const sections = [
  {
    title: '1. Information We Collect',
    body: [
      'Account information: name, email address, password (hashed), and role (client/freelancer).',
      'Profile information: LinkedIn, GitHub, portfolio URLs, and profile photos you choose to provide.',
      'Transaction data: escrow amounts, milestone details, payment records, and contract history.',
      'Deliverable metadata: SHA-256 hashes of files submitted through the platform (we do not store file contents).',
      'Usage data: pages visited, features used, session duration, and device/browser information.',
      'Communications: messages sent through our platform between clients and freelancers.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'To operate the SafeLancer platform and process escrow transactions.',
      'To verify your identity and prevent fraud on the platform.',
      'To generate SHA-256 proof certificates for deliverables.',
      'To facilitate dispute resolution between clients and freelancers.',
      'To send transactional emails (contract updates, payment confirmations, dispute notices).',
      'To improve our platform through aggregated, anonymized analytics.',
      'To comply with legal obligations under Indian law (IT Act 2000, GST, etc.).',
    ],
  },
  {
    title: '3. Data Sharing',
    body: [
      'We do not sell your personal data to any third party.',
      'We share data with payment processors (Razorpay) only to process escrow transactions.',
      'We share data with cloud infrastructure providers (MongoDB Atlas, Render) for platform operation.',
      'We may disclose data to law enforcement when required by court order or applicable law.',
      'Aggregate, anonymized data may be shared for research and industry reporting.',
    ],
  },
  {
    title: '4. Data Security',
    body: [
      'All data is encrypted in transit using TLS 1.3.',
      'Passwords are hashed using bcrypt with a cost factor of 12+.',
      'Deliverable hashes use SHA-256 — computationally infeasible to reverse-engineer.',
      'JWT tokens expire after 7 days and are signed with a secure secret.',
      'We conduct regular security reviews and vulnerability assessments.',
    ],
  },
  {
    title: '5. Your Rights',
    body: [
      'Access: You can request a copy of all personal data we hold about you.',
      'Correction: You can update your account information at any time from your profile.',
      'Deletion: You can request account deletion — we will remove your data within 30 days, except data required by law.',
      'Portability: You can export your contract history and transaction records.',
      'To exercise any of these rights, email privacy@safelancer.in.',
    ],
  },
  {
    title: '6. Cookies',
    body: [
      'We use a single authentication cookie (JWT) to keep you logged in.',
      'We do not use advertising cookies, tracking pixels, or third-party analytics cookies.',
      'You can delete cookies at any time from your browser settings.',
    ],
  },
  {
    title: '7. Contact',
    body: [
      'For privacy-related questions, contact us at privacy@safelancer.in.',
      'We will respond to all privacy requests within 15 business days.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <StaticLayout
      title="Privacy Policy."
      subtitle={`Last updated: April 2025. We take your privacy seriously. This policy explains exactly what data we collect, why, and how we protect it.`}
    >
      <div style={{ maxWidth: '760px' }}>
        {sections.map(s => (
          <section key={s.title} style={{ marginBottom: '48px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '18px', color: T.text, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{s.title}</h2>
            <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {s.body.map((item, i) => (
                <li key={i} style={{ fontSize: '14px', color: T.muted, lineHeight: 1.75 }}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <div style={{ background: 'rgba(255,104,3,0.05)', border: '1px solid rgba(255,104,3,0.15)', borderRadius: '14px', padding: '24px', marginTop: '16px' }}>
          <p style={{ fontSize: '13px', color: T.muted, margin: 0, lineHeight: 1.7 }}>
            This Privacy Policy is governed by the laws of India and complies with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
        </div>
      </div>
    </StaticLayout>
  )
}
