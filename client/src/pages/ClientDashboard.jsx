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
      className="dark-card card-lift p-4"
      style={accent ? {
        background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(109,40,217,0.1) 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
      } : {}}
    >
      <div
        className="text-2xl font-bold stat-number mb-0.5"
        style={{ color: accent ? '#A78BFA' : '#fff' }}
      >
        {animated}
      </div>
      <div className="text-xs" style={{ color: '#71717a' }}>{label}</div>
    </div>
  )
}

const sectionLabel = (text) => (
  <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>
    {text}
  </h2>
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
    Promise.all([
      api.get('/api/contracts/my-contracts'),
      api.get('/api/jobs/my-jobs'),
      api.get('/api/auth/me')
    ]).then(([c, j, me]) => {
      setContracts(c.data)
      setJobs(j.data)
      setPortfolio(me.data.portfolio)
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const allBids = jobs.flatMap(j => (j.bids || []).map(b => ({ ...b, job: j })))
  const awaitingDecision = allBids.filter(b => b.status === 'shortlisted')
  const activeContracts = contracts.filter(c => ['active', 'pending_advance'].includes(c.status))
  const totalValue = contracts.reduce((sum, c) => sum + (c.amount || 0), 0)
  const openJobs = jobs.filter(j => j.status === 'open')
  const toReview = allBids.filter(b => b.status === 'applied').length

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
        theme: { color: '#8B5CF6' },
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
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <div className="w-48 h-4 shimmer-skeleton" />
        <div className="w-32 h-3 shimmer-skeleton" />
        <div className="grid grid-cols-5 gap-3 mt-4 w-full max-w-2xl px-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 shimmer-skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-xl font-semibold text-white">Welcome, {user.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#52525b' }}>Manage your contracts and jobs</p>
          </div>
          <Link
            to="/jobs/post"
            className="btn-purple px-4 py-2 text-sm"
          >
            + Post Job
          </Link>
        </div>

        {/* Profile card */}
        {portfolio !== null && (
          <div className="dark-card p-4 mb-6 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            {portfolio?.avatarUrl
              ? <img
                  src={portfolio.avatarUrl.startsWith('http') ? portfolio.avatarUrl : `${FILE_BASE}${portfolio.avatarUrl}`}
                  alt="avatar"
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                />
              : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
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
                ? <p className="text-xs line-clamp-1" style={{ color: '#71717a' }}>{portfolio.bio}</p>
                : <p className="text-xs italic" style={{ color: '#52525b' }}>No bio yet — complete your profile</p>
              }
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 rounded-full h-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{ width: `${calcCompletion('client', portfolio)}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }}
                  />
                </div>
                <span className="text-[10px] font-medium flex-shrink-0" style={{ color: '#52525b' }}>
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
        <div className="grid grid-cols-5 gap-3 mb-6">
          <StatCard label="Active Contracts" value={activeContracts.length} accent />
          <StatCard label="Total Value" value={totalValue} />
          <StatCard label="Open Jobs" value={openJobs.length} />
          <StatCard label="Shortlisted" value={awaitingDecision.length} />
          <StatCard label="To Review" value={toReview} />
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
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="#A78BFA" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{b.freelancer?.name}</div>
                    <div className="text-sm mt-0.5" style={{ color: '#71717a' }}>
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
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
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
            ? <div className="dark-card p-6 text-center text-sm" style={{ color: '#52525b' }}>
                No active contracts yet
              </div>
            : activeContracts.map(c => (
              <div key={c._id} className="dark-card card-lift p-4 mb-2 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="#8B5CF6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">{c.job?.title || 'Contract'}</div>
                  <div className="text-sm mt-0.5" style={{ color: '#71717a' }}>
                    with {c.freelancer?.name} · ₹{c.amount?.toLocaleString()} · {c.milestoneCount} phases
                  </div>
                </div>
                <Link
                  to={`/contracts/${c._id}`}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)' }}
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
            ? <div className="dark-card p-6 text-center text-sm" style={{ color: '#52525b' }}>
                No jobs yet.{' '}
                <Link to="/jobs/post" className="font-medium" style={{ color: '#A78BFA' }}>Post your first job</Link>
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
                    style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="#71717a" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{j.title}</div>
                    <div className="text-sm mt-0.5" style={{ color: '#71717a' }}>
                      ₹{j.budget?.toLocaleString()} · <span className="capitalize">{j.status}</span>
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs" style={{ color: '#52525b' }}>
                      {counts.applied > 0 && <span>{counts.applied} applied</span>}
                      {counts.shortlisted > 0 && <span style={{ color: '#A78BFA' }}>{counts.shortlisted} shortlisted</span>}
                      {counts.hired > 0 && <span style={{ color: '#22c55e' }}>{counts.hired} hired</span>}
                      {bids.length === 0 && <span>No applications yet</span>}
                    </div>
                  </div>
                  <Link
                    to={`/jobs/${j._id}`}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
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
