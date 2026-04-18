import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'
import { useCountUp } from '../utils/useCountUp'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

function StatCard({ label, value, accent }) {
  const numeric = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0
  const prefix = typeof value === 'string' && value.startsWith('₹') ? '₹' : ''
  const animated = useCountUp(numeric, 1200, prefix)

  return (
    <div
      className="card-lift p-4 rounded-2xl"
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(255,104,3,0.18) 0%, rgba(174,58,2,0.12) 100%)'
          : 'rgba(18,10,2,0.60)',
        border: accent ? '1px solid rgba(255,104,3,0.35)' : '1px solid rgba(255,104,3,0.10)',
        backdropFilter: 'blur(16px)',
        boxShadow: accent ? '0 0 24px rgba(255,104,3,0.15), inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="text-2xl font-bold stat-number mb-0.5"
        style={{ color: accent ? '#FF6803' : '#F5EDE4', textShadow: accent ? '0 0 20px rgba(255,104,3,0.4)' : 'none' }}
      >
        {animated}
      </div>
      <div className="text-xs font-medium" style={{ color: '#6b5445' }}>{label}</div>
    </div>
  )
}

const sectionLabel = (text) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="h-px flex-1" style={{ background: 'rgba(255,104,3,0.12)' }} />
    <h2 className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#BFBFBF' }}>{text}</h2>
    <div className="h-px flex-1" style={{ background: 'rgba(255,104,3,0.12)' }} />
  </div>
)

export default function ClientDashboard() {
  const [contracts, setContracts] = useState([])
  const [jobs, setJobs] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  useEffect(() => {
    let done = 0
    const finish = () => { if (++done === 3) setLoading(false) }

    api.get('/api/contracts/my-contracts')
      .then(r => setContracts(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load contracts'))
      .finally(finish)

    api.get('/api/jobs/my-jobs')
      .then(r => setJobs(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load jobs'))
      .finally(finish)

    api.get('/api/auth/me')
      .then(r => setPortfolio(r.data.portfolio ?? null))
      .catch(() => {})
      .finally(finish)
  }, [])

  const allBids = jobs.flatMap(j => (j.bids || []).map(b => ({ ...b, job: j })))
  const awaitingDecision = allBids.filter(b => b.status === 'shortlisted')
  const activeContracts = contracts.filter(c => ['active', 'pending_advance'].includes(c.status))
  const totalValue = contracts.reduce((sum, c) => sum + (c.amount || 0), 0)
  const openJobs = jobs.filter(j => j.status === 'open')

  const handleAdvancePayment = async (advanceMilestone, contractId) => {
    try {
      const { data } = await api.post(`/api/milestones/${advanceMilestone._id}/fund`)
      const isTestMode = !data.razorpayKeyId || data.razorpayKeyId.includes('placeholder') || data.razorpayOrderId?.startsWith('order_test_')
      if (isTestMode) {
        toast.success('Advance payment secured! Project is now active.')
        navigate(`/contracts/${contractId}`)
        return
      }
      const options = {
        key: data.razorpayKeyId,
        amount: Math.round(advanceMilestone.amount * 100),
        currency: 'INR',
        name: 'SafeLancer Escrow',
        description: advanceMilestone.title,
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post(`/api/milestones/${advanceMilestone._id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Advance payment secured! Project is now active.')
            navigate(`/contracts/${contractId}`)
          } catch { toast.error('Payment verification failed.') }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#FF6803' },
        modal: { ondismiss: () => toast('Payment cancelled. Go to the contract to complete advance payment.') }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => toast.error(`Payment failed: ${response.error.description}`))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate advance payment')
    }
  }

  const quickAction = async (jobId, bidId, endpoint) => {
    setActionLoading(bidId + endpoint)
    try {
      const { data } = await api.patch(`/api/jobs/${jobId}/applications/${bidId}/${endpoint}`)
      if (endpoint === 'hire') {
        setJobs(prev => prev.map(j => j._id !== jobId ? j : (data.job || j)))
        toast('Freelancer hired! Complete the advance payment to activate the project.')
        await handleAdvancePayment(data.advanceMilestone, data.contract._id)
        return
      }
      setJobs(prev => prev.map(j => j._id !== jobId ? j : (data.job || data)))
      toast.success('Done')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <div className="w-48 h-4 shimmer-skeleton" />
        <div className="w-32 h-3 shimmer-skeleton" />
        <div className="grid grid-cols-4 gap-3 mt-4 w-full max-w-2xl px-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 shimmer-skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">

        {/* Dashboard header */}
        <div style={{ marginBottom: '32px', padding: '28px 32px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(18,10,2,0.90) 0%, rgba(28,16,8,0.85) 100%)', border: '1px solid rgba(255,104,3,0.18)', backdropFilter: 'blur(24px)', boxShadow: '0 0 60px rgba(255,104,3,0.08), inset 0 1px 0 rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,104,3,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#BFBFBF', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.9 }}>Client Portal</p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F5EDE4', marginBottom: '6px', lineHeight: 1.2 }}>
            Welcome back, <span style={{ background: 'linear-gradient(135deg,#FF6803,#AE3A02)', WebkitBackgroundClip: 'text', WebkitTextFillColor: "transparent" }}>{user.name}</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#6b5445' }}>Manage your contracts, jobs, and team</p>
          <button onClick={() => navigate('/jobs/post')} className="btn-purple" style={{ marginTop: '18px', padding: '10px 24px', fontSize: '13px', boxShadow: '0 4px 20px rgba(255,104,3,0.30)' }}>+ Post Job</button>
        </div>

        {/* Profile card */}
        {portfolio !== null && (
          <div className="dark-card p-4 mb-6 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            {portfolio?.avatarUrl
              ? <img
                  src={portfolio.avatarUrl.startsWith('http') ? portfolio.avatarUrl : `${FILE_BASE}${portfolio.avatarUrl}`}
                  alt="avatar"
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  style={{ border: '1px solid rgba(255,104,3,0.10)' }}
                />
              : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-white">{user.name}</span>
                {portfolio?.clientType && (
                  <span className="badge badge-purple capitalize">{portfolio.clientType}</span>
                )}
              </div>
              {portfolio?.bio
                ? <p className="text-xs line-clamp-1" style={{ color: '#BFBFBF' }}>{portfolio.bio}</p>
                : <p className="text-xs italic" style={{ color: '#6b5445' }}>No bio yet — complete your profile</p>
              }
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 rounded-full h-1 overflow-hidden" style={{ background: 'rgba(255,104,3,0.06)' }}>
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{ width: `${calcCompletion('client', portfolio)}%`, background: 'linear-gradient(90deg, #FF6803, #AE3A02)' }}
                  />
                </div>
                <span className="text-[10px] font-medium flex-shrink-0" style={{ color: '#6b5445' }}>
                  {calcCompletion('client', portfolio)}% complete
                </span>
              </div>
            </div>
            <Link
              to="/profile/setup"
              className="btn-purple text-xs font-medium px-3 py-1.5 flex-shrink-0"
            >
              Edit Profile
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Active Contracts" value={activeContracts.length} accent />
          <StatCard label="Total Value" value={`₹${totalValue.toLocaleString('en-IN')}`} />
          <StatCard label="Open Jobs" value={openJobs.length} />
          <StatCard label="Shortlisted" value={awaitingDecision.length} />
        </div>

        {/* Awaiting Decision */}
        {awaitingDecision.length > 0 && (
          <section className="mb-6">
            {sectionLabel('Shortlisted — Awaiting Decision')}
            {awaitingDecision.map(b => {
              const isLoading = (suf) => actionLoading === b._id + suf
              return (
                <div key={b._id} className="dark-card card-lift p-4 mb-2 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: 'rgba(255,104,3,0.14)', border: '1px solid rgba(255,104,3,0.25)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="#BFBFBF" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{b.freelancer?.name}</div>
                    <div className="text-sm mt-0.5" style={{ color: '#BFBFBF' }}>
                      {b.job.title} · ₹{b.job.budget?.toLocaleString()}
                      {b.freelancer?.rating > 0 && ` · ★ ${b.freelancer.rating}`}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => quickAction(b.job._id, b._id, 'hire')}
                      disabled={isLoading('hire')}
                      className="btn-purple px-3 py-1.5 text-sm"
                    >
                      {isLoading('hire') ? '…' : 'Hire'}
                    </button>
                    <button
                      onClick={() => quickAction(b.job._id, b._id, 'reject')}
                      disabled={isLoading('reject')}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                      style={{ background: 'rgba(255,104,3,0.06)', border: '1px solid rgba(255,104,3,0.10)', color: '#BFBFBF' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* Active Contracts */}
        <section className="mb-6">
          {sectionLabel('Active Contracts')}
          {activeContracts.length === 0
            ? <div className="dark-card p-6 text-center text-sm" style={{ color: '#6b5445' }}>
                No active contracts yet
              </div>
            : activeContracts.map(c => (
              <div key={c._id} className="dark-card card-lift p-4 mb-2 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,104,3,0.12)', border: '1px solid rgba(255,104,3,0.20)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="#FF6803" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">{c.job?.title || 'Contract'}</div>
                  <div className="text-sm mt-0.5" style={{ color: '#BFBFBF' }}>
                    with {c.freelancer?.name} · ₹{c.amount?.toLocaleString()} · {c.milestoneCount} phases
                  </div>
                </div>
                <Link
                  to={`/contracts/${c._id}`} data-cursor="contract"
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                  style={{ background: 'rgba(255,104,3,0.12)', border: '1px solid rgba(255,104,3,0.20)', color: '#BFBFBF' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,104,3,0.20)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,104,3,0.12)' }}
                >
                  View Contract
                </Link>
              </div>
            ))
          }
        </section>

        {/* Posted Jobs */}
        <section>
          {sectionLabel('My Posted Jobs')}
          {jobs.length === 0
            ? <div className="dark-card p-6 text-center text-sm" style={{ color: '#6b5445' }}>
                No jobs yet.{' '}
                <Link to="/jobs/post" className="font-medium" style={{ color: '#BFBFBF' }}>Post your first job</Link>
              </div>
            : jobs.map(j => {
              const bids = j.bids || []
              const counts = {
                applied: bids.filter(b => b.status === 'applied').length,
                shortlisted: bids.filter(b => b.status === 'shortlisted').length,
                hired: bids.filter(b => b.status === 'hired').length,
              }
              return (
                <div key={j._id} className="dark-card card-lift p-4 mb-2 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.10)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="#BFBFBF" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{j.title}</div>
                    <div className="text-sm mt-0.5" style={{ color: '#BFBFBF' }}>
                      ₹{j.budget?.toLocaleString()} · <span className="capitalize">{j.status}</span>
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs" style={{ color: '#6b5445' }}>
                      {counts.applied > 0 && <span>{counts.applied} applied</span>}
                      {counts.shortlisted > 0 && <span style={{ color: '#BFBFBF' }}>{counts.shortlisted} shortlisted</span>}
                      {counts.hired > 0 && <span style={{ color: '#22c55e' }}>{counts.hired} hired</span>}
                      {bids.length === 0 && <span>No applications yet</span>}
                    </div>
                  </div>
                  <Link
                    to={`/jobs/${j._id}`}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                    style={{ background: 'rgba(255,104,3,0.06)', border: '1px solid rgba(255,104,3,0.10)', color: '#BFBFBF' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,104,3,0.10)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,104,3,0.06)' }}
                  >
                    Manage
                  </Link>
                </div>
              )
            })
          }
        </section>
      </div>
    </div>
  )
}
