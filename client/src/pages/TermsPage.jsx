import StaticLayout from '../components/StaticLayout'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account on SafeLancer, you agree to these Terms of Service. If you do not agree, do not use the platform. We may update these terms — continued use after updates constitutes acceptance.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old and legally able to enter into contracts under Indian law. Freelancers must complete identity verification before receiving payments. Clients must have a valid payment method.',
  },
  {
    title: '3. Escrow Mechanics',
    body: 'When a client accepts a proposal, they fund an escrow account for the agreed milestone amount. SafeLancer holds these funds in trust. Funds are released to the freelancer upon client approval of delivered work. If no action is taken within 72 hours of delivery submission, funds auto-release to the freelancer.',
  },
  {
    title: '4. Fees',
    body: 'SafeLancer charges a platform fee on successful transactions: 5% on the total contract value, deducted from the escrow at release. There are no fees for signing up, posting jobs, or submitting proposals. Failed transactions or disputed releases may incur processing fees.',
  },
  {
    title: '5. Deliverable Verification',
    body: 'All deliverables submitted through SafeLancer are SHA-256 hashed and timestamped. This hash serves as immutable proof of submission. SafeLancer does not store the actual file content — only the cryptographic proof. Clients must evaluate deliverables within 72 hours of submission.',
  },
  {
    title: '6. Dispute Resolution',
    body: 'Either party may raise a dispute within 72 hours of deliverable submission. SafeLancer will review evidence from both sides and issue a binding resolution within 5 business days. SafeLancer\'s decision on disputes is final. Fraudulent dispute claims may result in account suspension.',
  },
  {
    title: '7. Prohibited Conduct',
    body: 'You may not use SafeLancer to commit fraud, launder money, or violate any applicable law. You may not attempt to transact outside the platform to avoid fees. You may not impersonate another user or submit false deliverables. Violations result in immediate account termination and potential legal action.',
  },
  {
    title: '8. Intellectual Property',
    body: 'Upon full payment release, the client receives full ownership of all deliverables unless the contract specifies otherwise. Freelancers retain the right to display work in their portfolio unless the contract includes a confidentiality clause.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'SafeLancer is a platform facilitating transactions between independent parties. We are not responsible for the quality of work delivered or the conduct of users. Our maximum liability in any dispute is limited to the amount held in escrow for that specific contract.',
  },
  {
    title: '10. Governing Law',
    body: 'These Terms are governed by the laws of India. Disputes arising from these Terms shall be subject to the exclusive jurisdiction of courts in India.',
  },
]

export default function TermsPage() {
  return (
    <StaticLayout
      title="Terms of Service."
      subtitle="Last updated: April 2025. Please read these terms carefully before using SafeLancer."
    >
      <div style={{ maxWidth: '760px' }}>
        <div style={{ background: 'rgba(255,104,3,0.06)', border: '1px solid rgba(255,104,3,0.20)', borderRadius: '14px', padding: '20px 24px', marginBottom: '48px' }}>
          <p style={{ fontSize: '13px', color: '#BFBFBF', margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: '#FF6803' }}>Summary:</strong> SafeLancer holds payments in escrow until work is approved. We charge a 5% fee on successful transactions. Disputes are resolved by our team within 5 business days. Don't use the platform for fraud — we will terminate your account and involve authorities.
          </p>
        </div>

        {sections.map(s => (
          <section key={s.title} style={{ marginBottom: '40px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '18px', color: T.text, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{s.title}</h2>
            <p style={{ fontSize: '14px', color: T.muted, lineHeight: 1.8, margin: 0 }}>{s.body}</p>
          </section>
        ))}

        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '24px', marginTop: '24px' }}>
          <p style={{ fontSize: '13px', color: T.muted, margin: '0 0 10px', lineHeight: 1.7 }}>Questions about these terms?</p>
          <a href="mailto:legal@safelancer.in" style={{ fontSize: '13px', color: T.blue, fontWeight: 600, textDecoration: 'none' }}>legal@safelancer.in →</a>
        </div>
      </div>
    </StaticLayout>
  )
}
