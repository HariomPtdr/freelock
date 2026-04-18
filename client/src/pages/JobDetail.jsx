import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'

// profileCompletion is kept for the initial render guard; overridden by fresh API value on mount
const profileCompletionLocal = () => parseInt(localStorage.getItem('profileCompletion') || '0', 10)

const STATUS_LABELS = {
  applied:            { label: 'Applied',      style: { background: '#120a02', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.12)' } },
  shortlisted:        { label: 'Shortlisted',  style: { background: 'rgba(255,104,3,0.10)', color: '#FF6803', border: '1px solid rgba(255,104,3,0.22)' } },
  interview_scheduled:{ label: 'Interview',    style: { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' } },
  interviewed:        { label: 'Interviewed',  style: { background: 'rgba(255,104,3,0.08)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.15)' } },
  negotiating:        { label: 'Negotiating',  style: { background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' } },
  hired:              { label: 'Hired',        style: { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' } },
  rejected:           { label: 'Rejected',     style: { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' } },
}

const TABS = ['All', 'Applied', 'Shortlisted']
const TAB_STATUS = {
  All: null,
  Applied: ['applied'],
  Shortlisted: ['shortlisted'],
}

const SectionLabel = ({ text }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="h-px flex-1" style={{ background: 'rgba(255,104,3,0.12)' }} />
    <h2 className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#BFBFBF' }}>{text}</h2>
    <div className="h-px flex-1" style={{ background: 'rgba(255,104,3,0.12)' }} />
  </div>
)

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [job, setJob] = useState(null)
  const [proposal, setProposal] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const [actionLoading, setActionLoading] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState('pending')
  const [freshCompletion, setFreshCompletion] = useState(profileCompletionLocal())
  const [profileChecking, setProfileChecking] = useState(user.role === 'freelancer')

  const reload = () =>
    api.get(`/api/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => toast.error('Job not found'))

  const refreshFreelancerProfile = useCallback(() => {
    if (user.role !== 'freelancer') return Promise.resolve()
    return api.get('/api/auth/me').then(({ data }) => {
      setVerificationStatus(data.user?.verificationStatus || 'pending')
      if (data.portfolio) {
        const pct = calcCompletion(data.user?.role || 'freelancer', data.portfolio)
        setFreshCompletion(pct)
        localStorage.setItem('profileCompletion', String(pct))
      } else {
        setFreshCompletion(0)
      }
    }).catch(() => {})
  }, [user.role])

  useEffect(() => {
    reload().finally(() => setLoading(false))
    if (user.role === 'freelancer') {
      setProfileChecking(true)
      refreshFreelancerProfile().finally(() => setProfileChecking(false))
    }
  }, [id])

  useEffect(() => {
    window.addEventListener('profileUpdated', refreshFreelancerProfile)
    return () => window.removeEventListener('profileUpdated', refreshFreelancerProfile)
  }, [refreshFreelancerProfile])

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/api/jobs/${id}/apply`, { proposal, discountPercent })
      toast.success('Application submitted!')
      await reload()
    } catch (err) {
      // If backend says profile is incomplete, sync the real completion % so the
      // banner shows and the form hides — no ghost "apply" state possible
      if (err.response?.status === 403 && err.response?.data?.completionPercent !== undefined) {
        const serverPct = err.response.data.completionPercent
        setFreshCompletion(serverPct)
        localStorage.setItem('profileCompletion', String(serverPct))
      }
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally { setSubmitting(false) }
  }

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
        modal: { ondismiss: () => toast('Payment cancelled. The contract is on hold until advance is paid.') }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => toast.error(`Payment failed: ${response.error.description}`))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate advance payment')
    }
  }

  const action = async (bidId, endpoint, body = {}) => {
    setActionLoading(bidId + endpoint)
    try {
      const { data } = await api.patch(`/api/jobs/${id}/applications/${bidId}/${endpoint}`, body)
      if (endpoint === 'hire') {
        setJob(data.job || data)
        toast('Freelancer hired! Complete the advance payment to activate the project.')
        await handleAdvancePayment(data.advanceMilestone, data.contract._id)
        return data
      }
      setJob(data.job || data)
      toast.success('Done')
      return data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

  const myBid = job?.bids?.find(b => b.freelancer?._id === user.id || b.freelancer === user.id)
  const filteredBids = () => {
    if (!job?.bids) return []
    const statuses = TAB_STATUS[activeTab]
    if (!statuses) return job.bids
    return job.bids.filter(b => statuses.includes(b.status))
  }
  const tabCount = (tab) => {
    if (!job?.bids) return 0
    const statuses = TAB_STATUS[tab]
    if (!statuses) return job.bids.length
    return job.bids.filter(b => statuses.includes(b.status)).length
  }

  if (loading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center py-12">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 rounded-full" style={{ borderColor: 'rgba(255,104,3,0.12)' }} />
          <div className="absolute inset-0 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#FF6803' }} />
        </div>
      </div>
    </div>
  )

  if (!job) return (
    <div className="min-h-screen">
      <Navbar />
      <p className="text-center py-12 text-sm" style={{ color: '#6b5445' }}>Job not found</p>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
          style={{ color: '#6b5445' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F5EDE4'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b5445'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Job header card */}
        <div className="rounded-2xl p-6 mb-5" style={{ background: 'linear-gradient(135deg, rgba(18,10,2,0.96) 0%, rgba(28,16,8,0.92) 100%)', border: '1px solid rgba(255,104,3,0.18)', backdropFilter: 'blur(24px)', boxShadow: '0 0 40px rgba(255,104,3,0.06), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold" style={{ color: '#F5EDE4' }}>{job.title}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: '#BFBFBF' }}>
                <span style={{ color: '#6b5445' }}>Budget: <strong style={{ color: '#FF6803' }}>₹{job.budget?.toLocaleString()}</strong></span>
                <span style={{ color: '#6b5445' }}>Deadline: <strong style={{ color: '#F5EDE4' }}>{new Date(job.deadline).toLocaleDateString()}</strong></span>
                <span style={{ color: '#6b5445' }}>Status: <strong className="capitalize" style={{ color: '#F5EDE4' }}>{job.status?.replace('_', ' ')}</strong></span>
              </div>
            </div>
            <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg capitalize" style={
              job.status === 'open'
                ? { background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                : job.status === 'in_progress'
                ? { background: 'rgba(255,104,3,0.10)', color: '#FF6803', border: '1px solid rgba(255,104,3,0.22)' }
                : { background: '#120a02', color: '#6b5445', border: '1px solid rgba(255,104,3,0.08)' }
            }>{job.status?.replace('_', ' ')}</span>
          </div>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {job.skills.map(s => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,104,3,0.10)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.18)' }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="mt-4 pt-4 text-sm leading-relaxed" style={{ color: '#BFBFBF', borderTop: '1px solid rgba(255,104,3,0.10)' }}>
            {job.description}
          </p>

          {/* Posted by */}
          {job.client && (
            <div className="mt-4 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.10)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>
                {job.client.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b5445' }}>Posted by</p>
                <div className="flex items-center gap-2">
                  {user.role === 'freelancer'
                    ? <Link to={`/clients/${job.client._id}`}
                        className="text-sm font-semibold hover:underline underline-offset-2 transition-colors"
                        style={{ color: '#F5EDE4' }}>{job.client.name}</Link>
                    : <span className="text-sm font-semibold" style={{ color: '#F5EDE4' }}>{job.client.name}</span>
                  }
                  {job.client.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#FF6803' }}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {job.client.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phase Breakdown */}
        {job.phases?.length > 0 && (
          <div className="dark-card p-6 mb-5">
            <SectionLabel text="Project Phases" />
            {job.scopeHash && (
              <p className="text-xs mb-4 -mt-2" style={{ color: '#6b5445' }}>
                Scope hash: <span className="font-mono" style={{ color: '#BFBFBF' }}>{job.scopeHash}</span>
              </p>
            )}
            <div className="space-y-3">
              {job.phases.map((phase, i) => {
                const phaseAmount = job.budget
                  ? Math.round((job.budget - Math.round(job.budget * (job.advancePercent || 10) / 100)) * phase.budgetPercent / 100)
                  : null
                return (
                  <div key={i} className="rounded-xl p-4" style={{ border: '1px solid rgba(255,104,3,0.10)', background: '#120a02' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 text-white text-xs font-bold rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>{i + 1}</span>
                        <span className="font-semibold text-sm" style={{ color: '#F5EDE4' }}>{phase.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,104,3,0.06)', color: '#6b5445', border: '1px solid rgba(255,104,3,0.10)' }}>
                          {phase.deliverableType}
                        </span>
                        {phaseAmount && <span className="text-sm font-bold" style={{ color: '#F5EDE4' }}>₹{phaseAmount.toLocaleString()}</span>}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed ml-8" style={{ color: '#BFBFBF' }}>{phase.guideline}</p>
                    <div className="flex flex-wrap gap-4 mt-2 ml-8 text-xs" style={{ color: '#6b5445' }}>
                      <span>Deadline: {new Date(phase.phaseDeadline).toLocaleDateString()}</span>
                      <span>Max revisions: {phase.maxRevisions}</span>
                      <span>{phase.budgetPercent}% of project</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 px-4 py-3 rounded-xl flex items-center justify-between text-sm" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.10)' }}>
              <span style={{ color: '#6b5445' }}>Advance payment (released on last phase or early exit):</span>
              <span className="font-bold" style={{ color: '#FF6803' }}>
                {job.advancePercent || 10}% = ₹{Math.round(job.budget * (job.advancePercent || 10) / 100).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Reference Files */}
        {job.referenceFiles?.length > 0 && (
          <div className="dark-card p-6 mb-5">
            <SectionLabel text="Reference Files" />
            <p className="text-xs mb-3 -mt-2" style={{ color: '#6b5445' }}>SHA-256 hashed — tamper-proof evidence baseline</p>
            <div className="space-y-2">
              {job.referenceFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.10)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b5445' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F5EDE4' }}>{f.originalName}</p>
                    <p className="text-xs font-mono truncate" style={{ color: '#6b5445' }}>{f.fileHash}</p>
                  </div>
                  <a href={f.url?.startsWith('http') ? f.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${f.url}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.12)', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#F5EDE4'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#BFBFBF'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.12)' }}>
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Freelancer: apply */}
        {user.role === 'freelancer' && job.status === 'open' && !myBid && (
          <div className="dark-card p-6 mb-5">
            <SectionLabel text="Apply for this Job" />
            <p className="text-sm mb-4 -mt-2" style={{ color: '#6b5445' }}>Fixed budget: <span style={{ color: '#FF6803', fontWeight: 600 }}>₹{job.budget?.toLocaleString()}</span> — set by client</p>

            {/* Verified-only block */}
            {job.verifiedOnly && verificationStatus !== 'approved' && (
              <div className="rounded-xl p-4 mb-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f59e0b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Verified Freelancers Only</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#BFBFBF' }}>
                    This client requires a SafeLancer-verified freelancer. Your account is currently <strong style={{ color: '#f59e0b' }}>pending verification</strong>. Once an admin approves your account, you will be able to apply.
                  </p>
                </div>
              </div>
            )}

            {/* Platform fee notice */}
            <div className="rounded-xl p-3.5 mb-4 flex items-start gap-3" style={{ background: 'rgba(255,104,3,0.06)', border: '1px solid rgba(255,104,3,0.18)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,104,3,0.12)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FF6803' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#FF6803' }}>Platform Fee — 2% Deducted from Your Earnings</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#BFBFBF' }}>
                  SafeLancer charges a <span style={{ color: '#FF6803', fontWeight: 600 }}>2% platform fee</span> on the total project budget. You will receive{' '}
                  <span style={{ color: '#FF6803', fontWeight: 600 }}>₹{Math.round(job.budget * 0.98).toLocaleString()}</span> out of the ₹{job.budget?.toLocaleString()} budget after the fee is deducted upon project completion.
                </p>
              </div>
            </div>
            {profileChecking ? (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.08)' }}>
                <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'rgba(255,104,3,0.3)', borderTopColor: '#FF6803', animation: 'spin 0.8s linear infinite' }} />
                <span className="text-xs" style={{ color: '#6b5445' }}>Checking profile…</span>
              </div>
            ) : freshCompletion < 100 ? (
              <div className="rounded-xl p-4" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.12)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#F5EDE4' }}>Complete your profile to apply</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b5445' }}>Your profile is {freshCompletion}% complete. You need 100% to apply for jobs.</p>
                    <div className="w-full rounded-full h-1.5 mt-2.5 overflow-hidden" style={{ background: 'rgba(255,104,3,0.08)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${freshCompletion}%`, background: 'linear-gradient(90deg, #FF6803, #AE3A02)' }} />
                    </div>
                  </div>
                  <Link to="/profile/setup"
                    className="btn-purple flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg">
                    Complete Profile
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#BFBFBF' }}>Your Proposal</label>
                  <textarea required rows={5} value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    className="dark-input w-full"
                    placeholder="Describe your approach, experience, and why you're the right fit..." />
                </div>

                {/* Discount offer */}
                <div className="rounded-xl p-4" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.15)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#F5EDE4' }}>Offer a Discount <span className="text-xs font-normal ml-1" style={{ color: '#6b5445' }}>(optional)</span></p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b5445' }}>Attract the client by offering a discount on the total budget</p>
                    </div>
                    <span className="text-lg font-bold" style={{ color: discountPercent > 0 ? '#FF6803' : '#6b5445' }}>
                      {discountPercent}%
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="50" step="1"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 rounded-full"
                    style={{ accentColor: '#FF6803' }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: '#6b5445' }}>
                    <span>0% (no discount)</span>
                    <span>50% max</span>
                  </div>
                  {discountPercent > 0 && (() => {
                    const discounted = Math.round(job.budget * (1 - discountPercent / 100))
                    const fee = Math.round(discounted * 0.02)
                    const youGet = discounted - fee
                    return (
                      <div className="mt-3 pt-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: '1px solid rgba(255,104,3,0.10)' }}>
                        <div>
                          <p className="text-xs" style={{ color: '#6b5445' }}>Client pays</p>
                          <p className="text-sm font-bold" style={{ color: '#10b981' }}>₹{discounted.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: '#6b5445' }}>was ₹{job.budget?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: '#6b5445' }}>Platform fee (2%)</p>
                          <p className="text-sm font-bold" style={{ color: '#f87171' }}>−₹{fee.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: '#6b5445' }}>on discounted amt</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: '#6b5445' }}>You receive</p>
                          <p className="text-sm font-bold" style={{ color: '#FF6803' }}>₹{youGet.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: '#6b5445' }}>after fee</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <button type="submit" disabled={submitting}
                  className="btn-purple w-full font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Apply Now'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* My bid status */}
        {myBid && (
          <div className="dark-card p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#BFBFBF' }}>Your Application</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={STATUS_LABELS[myBid.status]?.style}>
                {STATUS_LABELS[myBid.status]?.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#BFBFBF' }}>{myBid.proposal}</p>
            {myBid.discountPercent > 0 && (() => {
              const discounted = Math.round(job.budget * (1 - myBid.discountPercent / 100))
              const fee = Math.round(discounted * 0.02)
              const youGet = discounted - fee
              return (
                <div className="mt-3 pt-3 rounded-xl p-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: '1px solid rgba(255,104,3,0.10)', background: 'rgba(255,104,3,0.04)' }}>
                  <div>
                    <p className="text-xs" style={{ color: '#6b5445' }}>Discount offered</p>
                    <p className="text-sm font-bold" style={{ color: '#FF6803' }}>{myBid.discountPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#6b5445' }}>Client pays</p>
                    <p className="text-sm font-bold" style={{ color: '#10b981' }}>₹{discounted.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#6b5445' }}>You receive</p>
                    <p className="text-sm font-bold" style={{ color: '#FF6803' }}>₹{youGet.toLocaleString()}</p>
                  </div>
                </div>
              )
            })()}
            {myBid.status === 'rejected' && myBid.rejectionReason && (
              <p className="mt-2 text-xs" style={{ color: '#6b5445' }}>Reason: {myBid.rejectionReason}</p>
            )}
            {myBid.status === 'interview_scheduled' && myBid.meetingRoomId && (
              <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,104,3,0.10)' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f59e0b' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm" style={{ color: '#BFBFBF' }}>Interview scheduled</span>
                <Link to={`/interview/${myBid.meetingRoomId}`}
                  className="btn-purple text-xs font-semibold px-3 py-1.5 rounded-lg ml-auto">
                  Join Interview
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Client: pipeline */}
        {user.role === 'client' && (
          <div className="dark-card p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#BFBFBF' }}>Applications</p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,104,3,0.10)', color: '#FF6803', border: '1px solid rgba(255,104,3,0.20)' }}>
                {job.bids?.length || 0} total
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 mb-5 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,104,3,0.10)' }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
                  style={activeTab === tab
                    ? { borderBottomColor: '#FF6803', color: '#F5EDE4' }
                    : { borderBottomColor: 'transparent', color: '#6b5445' }
                  }
                  onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = '#BFBFBF' }}
                  onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = '#6b5445' }}>
                  {tab}
                  <span className="ml-1 text-xs" style={{ color: activeTab === tab ? '#FF6803' : '#6b5445' }}>
                    ({tabCount(tab)})
                  </span>
                </button>
              ))}
            </div>

            {filteredBids().length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm" style={{ color: '#6b5445' }}>No applications in this stage</p>
              </div>
            ) : (
              filteredBids().map(b => {
                const isLoading = (suf) => actionLoading === b._id + suf
                const badge = STATUS_LABELS[b.status]
                return (
                  <div key={b._id} className="rounded-xl p-4 mb-3" style={{ border: '1px solid rgba(255,104,3,0.10)', background: '#120a02' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>
                        {b.freelancer?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link to={`/freelancers/${b.freelancer?._id}`}
                            className="font-semibold text-sm hover:underline underline-offset-2 transition-colors"
                            style={{ color: '#F5EDE4' }}>
                            {b.freelancer?.name}
                          </Link>
                          {b.freelancer?.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#FF6803' }}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {b.freelancer.rating}
                            </span>
                          )}
                          {b.freelancer?.totalJobsCompleted > 0 && (
                            <span className="text-xs" style={{ color: '#6b5445' }}>{b.freelancer.totalJobsCompleted} jobs</span>
                          )}
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={badge?.style}>
                            {badge?.label}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#BFBFBF' }}>{b.proposal}</p>
                        {b.discountPercent > 0 && (() => {
                          const discounted = Math.round(job.budget * (1 - b.discountPercent / 100))
                          const fee = Math.round(discounted * 0.02)
                          return (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.20)' }}>
                                🏷 {b.discountPercent}% discount offered
                              </span>
                              <span className="text-xs" style={{ color: '#6b5445' }}>
                                You pay <strong style={{ color: '#10b981' }}>₹{discounted.toLocaleString()}</strong>
                                <span className="ml-1 line-through">₹{job.budget?.toLocaleString()}</span>
                              </span>
                              <span className="text-xs" style={{ color: '#6b5445' }}>
                                · Platform fee <strong style={{ color: '#f87171' }}>₹{fee.toLocaleString()}</strong> (2% of discounted)
                              </span>
                            </div>
                          )
                        })()}
                        {b.status === 'rejected' && b.rejectionReason && (
                          <p className="text-xs mt-1" style={{ color: '#6b5445' }}>Reason: {b.rejectionReason}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(255,104,3,0.08)' }}>
                      {b.status === 'applied' && (
                        <>
                          <button onClick={() => action(b._id, 'shortlist')} disabled={isLoading('shortlist')}
                            className="btn-purple px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                            {isLoading('shortlist') ? '...' : 'Shortlist'}
                          </button>
                          <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            style={{ border: '1px solid rgba(255,104,3,0.10)', background: 'transparent', color: '#6b5445' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b5445'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.10)' }}>
                            Reject
                          </button>
                        </>
                      )}
                      {b.status === 'shortlisted' && (
                        <>
                          <button onClick={() => action(b._id, 'hire')} disabled={isLoading('hire')}
                            className="btn-purple px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                            {isLoading('hire') ? '...' : `Hire — ₹${job.budget?.toLocaleString()}`}
                          </button>
                          <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            style={{ border: '1px solid rgba(255,104,3,0.10)', background: 'transparent', color: '#6b5445' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b5445'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.10)' }}>
                            Reject
                          </button>
                          <Link to={`/freelancers/${b.freelancer?._id}`}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            style={{ border: '1px solid rgba(255,104,3,0.12)', background: 'transparent', color: '#BFBFBF' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,104,3,0.35)'; e.currentTarget.style.color = '#F5EDE4' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,104,3,0.12)'; e.currentTarget.style.color = '#BFBFBF' }}>
                            View Profile
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>
    </div>
  )
}
