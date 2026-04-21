import { useState } from 'react'
import StaticLayout from '../components/StaticLayout'

const T = { blue: '#FF6803', muted: '#BFBFBF', faint: '#6b5445', text: '#F5EDE4', border: 'rgba(255,104,3,0.15)', bg: 'rgba(255,104,3,0.05)', gradB: 'linear-gradient(135deg,#FF6803,#AE3A02)' }

const channels = [
  { icon: '💬', title: 'General Enquiries', email: 'hello@safelancer.in', desc: 'Questions about the platform, how escrow works, or anything else.' },
  { icon: '🛡️', title: 'Security', email: 'security@safelancer.in', desc: 'Report a vulnerability or security concern.' },
  { icon: '⚖️', title: 'Legal', email: 'legal@safelancer.in', desc: 'Legal notices, terms questions, or compliance matters.' },
  { icon: '📰', title: 'Press', email: 'press@safelancer.in', desc: 'Media inquiries, interviews, and press kit requests.' },
]

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,104,3,0.15)',
  borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#F5EDE4',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <StaticLayout
      title="Get in touch."
      subtitle="We're a small team and we read every message. Expect a reply within 1–2 business days."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '64px', alignItems: 'start' }}>

        {/* Left: channels */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '28px' }}>Contact Channels</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {channels.map(c => (
              <div key={c.title} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{c.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: T.text }}>{c.title}</span>
                </div>
                <p style={{ fontSize: '12px', color: T.muted, margin: '0 0 10px', lineHeight: 1.6 }}>{c.desc}</p>
                <a href={`mailto:${c.email}`} style={{ fontSize: '12px', color: T.blue, fontWeight: 600, textDecoration: 'none' }}>{c.email}</a>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.blue, marginBottom: '28px' }}>Send a Message</p>
          {sent ? (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontWeight: 800, fontSize: '20px', color: T.text, margin: '0 0 10px' }}>Message sent!</h3>
              <p style={{ fontSize: '14px', color: T.muted, margin: 0 }}>We'll get back to you within 1–2 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: T.muted, fontWeight: 600, display: 'block', marginBottom: '6px' }}>Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: T.muted, fontWeight: 600, display: 'block', marginBottom: '6px' }}>Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.muted, fontWeight: 600, display: 'block', marginBottom: '6px' }}>Subject</label>
                <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.muted, fontWeight: 600, display: 'block', marginBottom: '6px' }}>Message</label>
                <textarea required rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us more..." style={{ ...inputStyle, resize: 'vertical', minHeight: '140px' }} />
              </div>
              <button type="submit" style={{ background: T.gradB, color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}>
                Send Message →
              </button>
            </form>
          )}
        </div>
      </div>
    </StaticLayout>
  )
}
