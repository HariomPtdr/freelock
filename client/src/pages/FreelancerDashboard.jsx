import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'
import { useCountUp } from '../utils/useCountUp'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const PIPELINE = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'hired', label: 'Hired' },
]

const TX_LABEL = {
  phase_payment: 'Phase Payment',
  advance_payment: 'Advance Payment',
  dispute_release: 'Dispute Release',
  split_payment: 'Split Payment',
  auto_release: 'Auto Release',
}

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
      <div className="text-2xl font-bold stat-number mb-0.5" style={{ color: accent ? '#A78BFA' : '#fff' }}>
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

export default function FreelancerDashboard() {
  const [contracts, setContracts] = useState([])
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    Promise.all([
      api.get('/api/contracts/my-work'),
      api.get('/api/jobs/my-applications'),
      api.get('/api/auth/me'),
      api.get('/api/transactions/my'),
    ]).then(([c, a, me, tx]) => {
      setContracts(c.data)
      setApplications(a.data)
      setPortfolio(me.data.portfolio)
      setWalletBalance(tx.data.walletBalance)
      setTransactions(tx.data.transactions)
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const activeContracts = contracts.filter(c => ['active', 'pending_advance'].includes(c.status))
  const totalEarned = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  if (loading) return (
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <div className="w-48 h-4 shimmer-skeleton" />
        <div className="w-32 h-3 shimmer-skeleton" />
        <div className="grid grid-cols-4 gap-3 mt-4 w-full max-w-xl px-6">
          {[...Array(4)].map((_, i) => (
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
            <p className="text-sm mt-0.5" style={{ color: '#52525b' }}>Manage your work and earnings</p>
          </div>
          <Link to="/jobs" className="btn-purple px-4 py-2 text-sm">Browse Jobs</Link>
        </div>

        {/* Profile card */}
        {portfolio !== null && (
          <div className="dark-card p-4 mb-6 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            {portfolio?.avatarUrl
              ? <img
                  src={portfolio.avatarUrl.startsWith('http') ? portfolio.avatarUrl : `${FILE_BASE}${portfolio.avatarUrl}`}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                />
              : <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-white">{user.name}</span>
                {portfolio?.availability && (
                  <span className="badge badge-purple capitalize">{portfolio.availability}</span>
                )}
                {user.rating > 0 && (
                  <span className="text-[10px] font-medium" style={{ color: '#fbbf24' }}>★ {Number(user.rating).toFixed(1)}</span>
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
                    style={{ width: `${calcCompletion('freelancer', portfolio)}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }}
                  />
                </div>
                <span className="text-[10px] font-medium flex-shrink-0" style={{ color: '#52525b' }}>
                  {calcCompletion('freelancer', portfolio)}% complete
                </span>
              </div>
            </div>
            <Link to="/profile/setup" className="btn-purple text-xs font-medium px-3 py-1.5 flex-shrink-0">
              Edit Profile
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Wallet Balance" value={walletBalance} accent />
          <StatCard label="Total Earned" value={totalEarned} />
          <StatCard label="Active Contracts" value={activeContracts.length} />
          <StatCard label="All Contracts" value={contracts.length} />
        </div>

        {/* Earnings */}
        <section className="mb-6">
          {sectionLabel('Earnings History')}
          {transactions.length === 0
            ? <div className="dark-card p-6 text-center text-sm" style={{ color: '#52525b' }}>
                No earnings yet. Complete a phase to receive payment.
              </div>
            : (
              <div className="dark-card overflow-hidden">
                {transactions.map((tx, i) => (
                  <div
                    key={tx._id}
                    className="flex items-center gap-4 px-4 py-3"
                    style={{ borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="#4ade80" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {tx.milestone?.title || tx.description || 'Payment'}
                        {tx.milestone?.isAdvance && (
                          <span className="ml-2 badge badge-gray">Advance</span>
                        )}
                      </div>
                      <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: '#52525b' }}>
                        <span>{TX_LABEL[tx.type] || tx.type}</span>
                        {tx.contract?.hashId && (
                          <>
                            <span>·</span>
                            <Link to={`/contracts/${tx.contract._id}`} className="hover:underline" style={{ color: '#A78BFA' }}>
                              #{tx.contract.hashId}
                            </Link>
                          </>
                        )}
                        <span>·</span>
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold" style={{ color: '#4ade80' }}>+₹{tx.amount.toLocaleString()}</div>
                      <div className="text-[10px]" style={{ color: '#52525b' }}>after 2% fee</div>
                      <div className={`text-[10px] font-medium capitalize`} style={{
                        color: tx.status === 'completed' ? '#4ade80' :
                               tx.status === 'pending' ? '#fbbf24' : '#f87171'
                      }}>{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </section>

        {/* Applications */}
        {applications.filter(({ bid }) => bid.status !== 'rejected' || bid.rejectionReason).length > 0 && (
          <section className="mb-6">
            {sectionLabel('My Applications')}
            {applications.map(({ job, bid, contractId }) => (
              <div key={bid._id} className="dark-card card-lift p-4 mb-2 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-0.5"
                  style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="#71717a" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-white truncate">{job.title}</span>
                    <span className="badge flex-shrink-0"
                      style={{
                        background: bid.status === 'hired' ? 'rgba(34,197,94,0.15)' :
                                    bid.status === 'shortlisted' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.06)',
                        color: bid.status === 'hired' ? '#4ade80' :
                               bid.status === 'shortlisted' ? '#A78BFA' : '#71717a',
                        border: bid.status === 'hired' ? '1px solid rgba(34,197,94,0.25)' :
                                bid.status === 'shortlisted' ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {bid.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: '#71717a' }}>{job.client?.name} · ₹{job.budget?.toLocaleString()}</div>
                  <div className="flex gap-1 mt-2">
                    {PIPELINE.map((step) => {
                      const stepIndex = PIPELINE.findIndex(p => p.key === step.key)
                      const currentIndex = PIPELINE.findIndex(p => p.key === bid.status)
                      const isActive = step.key === bid.status
                      const isPast = currentIndex > stepIndex
                      return (
                        <div key={step.key} className="h-1 flex-1 rounded-full" style={{
                          background: isActive ? '#8B5CF6' : isPast ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'
                        }} />
                      )
                    })}
                  </div>
                  {bid.status === 'rejected' && bid.rejectionReason && (
                    <p className="text-sm mt-2" style={{ color: '#71717a' }}>Reason: {bid.rejectionReason}</p>
                  )}
                  {bid.status === 'hired' && contractId && (
                    <Link
                      to={`/contracts/${contractId}`}
                      className="inline-block mt-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA' }}
                    >
                      View Contract
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Contracts */}
        <section>
          {sectionLabel('My Contracts')}
          {contracts.length === 0
            ? <div className="dark-card p-6 text-center text-sm" style={{ color: '#52525b' }}>
                No contracts yet.{' '}
                <Link to="/jobs" className="font-medium" style={{ color: '#A78BFA' }}>Browse jobs</Link>
              </div>
            : contracts.map(c => (
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
                    with {c.client?.name} · ₹{c.amount?.toLocaleString()} · <span className="capitalize">{c.status}</span>
                  </div>
                </div>
                <Link
                  to={`/contracts/${c._id}`}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)' }}
                >
                  View Work
                </Link>
              </div>
            ))
          }
        </section>
      </div>
    </div>
  )
}
