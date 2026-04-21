import StaticLayout from '../components/StaticLayout'
import { useNavigate } from 'react-router-dom'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)' }

const posts = [
  {
    tag: 'Product', date: 'Apr 10, 2025', readTime: '4 min read',
    title: 'How SHA-256 Makes Every Freelance Deliverable Tamper-Proof',
    excerpt: 'Every file uploaded to SafeLancer is cryptographically hashed. We explain how this creates an immutable proof of delivery that holds up in any dispute.',
  },
  {
    tag: 'Guide', date: 'Mar 28, 2025', readTime: '6 min read',
    title: 'The Freelancer\'s Guide to Escrow: Never Chase an Invoice Again',
    excerpt: 'Milestone-based escrow payments protect freelancers from non-paying clients. Here\'s how to structure your contracts to get paid, every time.',
  },
  {
    tag: 'Industry', date: 'Mar 15, 2025', readTime: '5 min read',
    title: '₹12,000 Crore: The Scale of Freelance Payment Fraud in India',
    excerpt: 'New data reveals the staggering scale of unpaid freelance work in India. We break down the numbers and what the industry needs to change.',
  },
  {
    tag: 'Product', date: 'Feb 22, 2025', readTime: '3 min read',
    title: 'Introducing Dispute Resolution: Fair, Fast, and Finalized in 72 Hours',
    excerpt: 'SafeLancer\'s new dispute system uses evidence-based arbitration with a 72-hour auto-release guarantee. Here\'s how it works.',
  },
  {
    tag: 'Guide', date: 'Feb 8, 2025', readTime: '7 min read',
    title: 'How to Write Milestone-Based Contracts That Actually Protect You',
    excerpt: 'Vague contracts lead to scope creep, disputes, and delayed payments. Learn how to write airtight milestone definitions that keep projects on track.',
  },
  {
    tag: 'Engineering', date: 'Jan 20, 2025', readTime: '8 min read',
    title: 'Building a Cryptographic Escrow System: Our Technical Architecture',
    excerpt: 'A deep dive into how SafeLancer\'s escrow engine works — from fund locking to milestone verification to instant release on approval.',
  },
]

const tagColors = { Product: '#FF6803', Guide: '#10B981', Industry: '#AE3A02', Engineering: '#BFBFBF' }

export default function BlogPage() {
  const nav = useNavigate()
  return (
    <StaticLayout
      title="From the team."
      subtitle="Insights on the future of freelancing, cryptographic escrow, and how we're building trust into every transaction."
    >
      {/* Featured post */}
      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '20px', padding: '48px', marginBottom: '48px', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6803'}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.blue, background: `${T.blue}18`, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${T.blue}30` }}>Featured</span>
          <span style={{ fontSize: '12px', color: T.faint }}>{posts[0].date} · {posts[0].readTime}</span>
        </div>
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(24px,3.5vw,42px)', letterSpacing: '-0.05em', color: T.text, margin: '0 0 16px', lineHeight: 1.1 }}>{posts[0].title}</h2>
        <p style={{ fontSize: '15px', color: T.muted, lineHeight: 1.7, margin: '0 0 24px', maxWidth: '640px' }}>{posts[0].excerpt}</p>
        <span style={{ fontSize: '13px', color: T.blue, fontWeight: 600 }}>Read article →</span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '20px' }}>
        {posts.slice(1).map(p => (
          <div key={p.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '28px', cursor: 'pointer', transition: 'border-color .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6803'}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tagColors[p.tag], background: `${tagColors[p.tag]}18`, padding: '3px 9px', borderRadius: '999px', border: `1px solid ${tagColors[p.tag]}30` }}>{p.tag}</span>
              <span style={{ fontSize: '11px', color: T.faint }}>{p.date} · {p.readTime}</span>
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.03em', color: T.text, margin: '0 0 10px', lineHeight: 1.3 }}>{p.title}</h3>
            <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.65, margin: '0 0 18px' }}>{p.excerpt}</p>
            <span style={{ fontSize: '12px', color: T.blue, fontWeight: 600 }}>Read →</span>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div style={{ marginTop: '64px', background: `linear-gradient(135deg, rgba(255,104,3,0.08), rgba(174,58,2,0.05))`, border: `1px solid ${T.border}`, borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
        <h3 style={{ fontWeight: 900, fontSize: '28px', letterSpacing: '-0.05em', color: T.text, margin: '0 0 10px' }}>Stay in the loop.</h3>
        <p style={{ fontSize: '14px', color: T.muted, margin: '0 0 28px' }}>Get new articles on freelancing and escrow delivered to your inbox.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', maxWidth: '420px', margin: '0 auto' }}>
          <input type="email" placeholder="you@email.com" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '11px 16px', fontSize: '13px', color: T.text, outline: 'none' }} />
          <button style={{ background: 'linear-gradient(135deg,#FF6803,#AE3A02)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
        </div>
      </div>
    </StaticLayout>
  )
}
