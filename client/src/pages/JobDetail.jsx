import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

const profileCompletion = () => parseInt(localStorage.getItem('profileCompletion') || '0', 10)

const STATUS_LABELS = {
  applied: { label: 'Applied', style: { background: '#1a1a1d', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' } },
  shortlisted: { label: 'Shortlisted', style: { background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' } },
  hired: { label: 'Hired', style: { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' } },
  rejected: { label: 'Rejected', style: { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' } },
}

const TABS = ['All', 'Applied', 'Shortlisted']
const TAB_STATUS = {
  All: null,
  Applied: ['applied'],
  Shortlisted: ['shortlisted'],
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [job, setJob] = useState(null)
  const [proposal, setProposal] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const [actionLoading, setActionLoading] = useState(null)
  const reload = () =>
    api.get(`/api/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => toast.error('Job not found'))

  useEffect(() => { reload().finally(() => setLoading(false)) }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/api/jobs/${id}/apply`, { proposal })
      toast.success('Application submitted!')
      await reload()
    } catch (err) {
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
        theme: { color: '#09090b' },
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
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}><Navbar />
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
      </div>
    </div>
  )
  if (!job) return (
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}><Navbar />
      <p className="text-center py-12 text-sm" style={{ color: '#52525b' }}>Job not found</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors" style={{ color: '#a1a1aa' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
          onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        {/* Job card */}
        <div className="dark-card p-6 mb-5">
          <h1 className="text-xl font-semibold text-white">{job.title}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: '#a1a1aa' }}>
            <span>Fixed Budget: <strong className="text-white">₹{job.budget?.toLocaleString()}</strong></span>
            <span>Deadline: <strong className="text-white">{new Date(job.deadline).toLocaleDateString()}</strong></span>
            <span>Status: <strong className="capitalize text-white">{job.status}</strong></span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.skills?.map(s => (
              <span key={s} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }}>{s}</span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{job.description}</p>
          {job.client && (
            <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#52525b' }}>Posted by: </span>
              {user.role === 'freelancer'
                ? <Link to={`/clients/${job.client._id}`} className="font-medium text-white hover:underline underline-offset-2 transition-colors">{job.client.name}</Link>
                : <span className="font-medium text-white">{job.client.name}</span>
              }
              {job.client.rating > 0 && <span className="ml-2 text-xs" style={{ color: '#A78BFA' }}>★ {job.client.rating}</span>}
            </div>
          )}
        </div>

        {/* Phase Breakdown */}
        {job.phases?.length > 0 && (
          <div className="dark-card p-6 mb-5">
            <h2 className="text-base font-semibold text-white mb-1">Project Phases</h2>
            <p className="text-xs mb-4" style={{ color: '#52525b' }}>Scope locked with hash: <span className="font-mono" style={{ color: '#a1a1aa' }}>{job.scopeHash}</span></p>
            <div className="space-y-3">
              {job.phases.map((phase, i) => {
                const phaseAmount = job.budget
                  ? Math.round((job.budget - Math.round(job.budget * (job.advancePercent || 10) / 100)) * phase.budgetPercent / 100)
                  : null
                return (
                  <div key={i} className="rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1d' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 text-white text-xs font-bold rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>{i + 1}</span>
                        <span className="font-medium text-white text-sm">{phase.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', color: '#52525b' }}>{phase.deliverableType}</span>
                        {phaseAmount && <span className="text-sm font-semibold text-white">₹{phaseAmount.toLocaleString()}</span>}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed ml-8" style={{ color: '#a1a1aa' }}>{phase.guideline}</p>
                    <div className="flex gap-4 mt-2 ml-8 text-xs" style={{ color: '#52525b' }}>
                      <span>Deadline: {new Date(phase.phaseDeadline).toLocaleDateString()}</span>
                      <span>Max revisions: {phase.maxRevisions}</span>
                      <span>{phase.budgetPercent}% of project</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Advance info */}
            <div className="mt-3 p-3 rounded-lg flex items-center justify-between text-sm" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#a1a1aa' }}>Advance payment (locked at hire, released after Phase 1):</span>
              <span className="font-semibold text-white">
                {job.advancePercent || 10}% = ₹{Math.round(job.budget * (job.advancePercent || 10) / 100).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Reference Files */}
        {job.referenceFiles?.length > 0 && (
          <div className="dark-card p-6 mb-5">
            <h2 className="text-base font-semibold text-white mb-1">Reference Files</h2>
            <p className="text-xs mb-3" style={{ color: '#52525b' }}>SHA-256 hashed — tamper-proof evidence baseline</p>
            <div className="space-y-2">
              {job.referenceFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#52525b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{f.originalName}</p>
                    <p className="text-xs font-mono truncate" style={{ color: '#52525b' }}>{f.fileHash}</p>
                  </div>
                  <a href={f.url?.startsWith('http') ? f.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${f.url}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
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
            <h2 className="text-base font-semibold text-white mb-1">Apply for this Job</h2>
            <p className="text-sm mb-4" style={{ color: '#a1a1aa' }}>Fixed budget: ₹{job.budget?.toLocaleString()} — set by client</p>
            {profileCompletion() < 100 ? (
              <div className="rounded-xl p-4" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Complete your profile to apply</p>
                    <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>Your profile is {profileCompletion()}% complete. You need 100% to apply for jobs.</p>
                    <div className="w-full rounded-full h-1.5 mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${profileCompletion()}%`, background: '#8B5CF6' }} />
                    </div>
                  </div>
                  <Link to="/profile/setup"
                    className="btn-purple flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Complete Profile
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Your Proposal</label>
                  <textarea required rows={5} value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    className="dark-input w-full"
                    placeholder="Describe your approach, experience, and why you're the right fit..." />
                </div>
                <button type="submit" disabled={submitting}
                  className="btn-purple w-full font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
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
              <h2 className="text-base font-semibold text-white">Your Application</h2>
              <span className="text-xs font-medium px-2 py-1 rounded-md" style={STATUS_LABELS[myBid.status]?.style}>
                {STATUS_LABELS[myBid.status]?.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{myBid.proposal}</p>
            {myBid.status === 'rejected' && myBid.rejectionReason && (
              <p className="mt-2 text-sm" style={{ color: '#52525b' }}>Reason: {myBid.rejectionReason}</p>
            )}
          </div>
        )}

        {/* Client: pipeline */}
        {user.role === 'client' && (
          <div className="dark-card p-6">
            <h2 className="text-base font-semibold text-white mb-4">
              Applications ({job.bids?.length || 0})
            </h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 overflow-x-auto pb-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
                  style={activeTab === tab
                    ? { borderBottomColor: '#8B5CF6', color: '#f4f4f5' }
                    : { borderBottomColor: 'transparent', color: '#52525b' }
                  }
                  onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = '#a1a1aa' }}
                  onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = '#52525b' }}
                >
                  {tab} <span className="text-xs" style={{ color: '#52525b' }}>({tabCount(tab)})</span>
                </button>
              ))}
            </div>

            {filteredBids().length === 0
              ? <p className="text-center py-6 text-sm" style={{ color: '#52525b' }}>No applications in this stage</p>
              : filteredBids().map(b => {
                const isLoading = (suf) => actionLoading === b._id + suf
                const badge = STATUS_LABELS[b.status]
                return (
                  <div key={b._id} className="rounded-xl p-4 mb-3" style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1d' }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/freelancers/${b.freelancer?._id}`} className="font-medium text-white hover:underline underline-offset-2 transition-colors">{b.freelancer?.name}</Link>
                          {b.freelancer?.rating > 0 && (
                            <span className="text-xs" style={{ color: '#A78BFA' }}>★ {b.freelancer.rating}</span>
                          )}
                          {b.freelancer?.totalJobsCompleted > 0 && (
                            <span className="text-xs" style={{ color: '#52525b' }}>{b.freelancer.totalJobsCompleted} jobs</span>
                          )}
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={badge?.style}>
                            {badge?.label}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#a1a1aa' }}>{b.proposal}</p>
                        {b.status === 'rejected' && b.rejectionReason && (
                          <p className="text-xs mt-1" style={{ color: '#52525b' }}>Reason: {b.rejectionReason}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.status === 'applied' && (
                        <>
                          <button onClick={() => action(b._id, 'shortlist')} disabled={isLoading('shortlist')}
                            className="btn-purple px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                            {isLoading('shortlist') ? '...' : 'Shortlist'}
                          </button>
                          <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#a1a1aa' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            Reject
                          </button>
                        </>
                      )}
                      {b.status === 'shortlisted' && (
                        <>
                          <button onClick={() => action(b._id, 'hire')} disabled={isLoading('hire')}
                            className="btn-purple px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                            {isLoading('hire') ? '...' : `Hire — ₹${job.budget?.toLocaleString()}`}
                          </button>
                          <button onClick={() => action(b._id, 'reject')} disabled={isLoading('reject')}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#a1a1aa' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}
      </div>

    </div>
  )
}
