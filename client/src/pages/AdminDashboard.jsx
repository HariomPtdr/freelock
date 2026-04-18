import { useState, useEffect } from 'react'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

function FileLink({ url, label }) {
  if (!url) return null
  const href = url.startsWith('http') ? url : `${FILE_BASE}${url}`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs underline underline-offset-2 transition-colors"
      style={{ color: '#A78BFA' }}
      onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
      onMouseLeave={e => e.currentTarget.style.color = '#A78BFA'}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label || 'Download'}
    </a>
  )
}

function HashBadge({ hash }) {
  if (!hash) return null
  return (
    <span className="font-mono text-[10px] px-2 py-0.5 rounded break-all"
      style={{ background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }}>
      SHA256: {hash.substring(0, 16)}…
    </span>
  )
}

function DisputeDetail({ disputeId, onClose, onResolved }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [split, setSplit] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    api.get(`/api/admin/disputes/${disputeId}/full`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dispute details'))
      .finally(() => setLoading(false))
  }, [disputeId])

  const resolve = async (resolution, splitPercent) => {
    setResolving(true)
    try {
      await api.patch(`/api/disputes/${disputeId}/resolve`, { resolution, splitPercent })
      toast.success('Dispute resolved!')
      onResolved()
    } catch { toast.error('Failed to resolve') }
    finally { setResolving(false) }
  }

  const STATUS_COLOR = {
    pending_deposit: { background: '#1a1a1d', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' },
    funded:          { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' },
    in_progress:     { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
    submitted:       { background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' },
    review:          { background: 'rgba(234,179,8,0.08)', color: '#eab308', border: '1px solid rgba(234,179,8,0.2)' },
    approved:        { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
    released:        { background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' },
    disputed:        { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' },
    refunded:        { background: '#1a1a1d', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' },
    inaccurate_1:    { background: 'rgba(249,115,22,0.08)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' },
    inaccurate_2:    { background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(239,68,68,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="text-sm font-semibold text-white">Dispute Review</h2>
            {data?.dispute?.contract?.hashId && (
              <span className="font-mono text-xs" style={{ color: '#52525b' }}>#{data.dispute.contract.hashId}</span>
            )}
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: '#52525b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
            onMouseLeave={e => e.currentTarget.style.color = '#52525b'}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
              style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }} />
          </div>
        ) : data ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#60a5fa' }}>Client</p>
                <p className="text-sm font-semibold text-white">{data.dispute.contract?.client?.name}</p>
                <p className="text-xs" style={{ color: '#52525b' }}>{data.dispute.contract?.client?.email}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#10b981' }}>Freelancer</p>
                <p className="text-sm font-semibold text-white">{data.dispute.contract?.freelancer?.name}</p>
                <p className="text-xs" style={{ color: '#52525b' }}>{data.dispute.contract?.freelancer?.email}</p>
              </div>
            </div>

            {/* Dispute Reason */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#f87171' }}>
                Dispute Reason · Raised by {data.dispute.raisedBy?.name} ({data.dispute.raisedBy?.role})
              </p>
              <p className="text-sm" style={{ color: '#fca5a5' }}>{data.dispute.reason}</p>
              <p className="text-xs mt-1" style={{ color: '#52525b' }}>{new Date(data.dispute.createdAt).toLocaleString()}</p>
            </div>

            {/* Disputed Milestone Files */}
            {data.dispute.milestone && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-4 py-2.5" style={{ background: '#1a1a1d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#52525b' }}>Disputed Milestone — {data.dispute.milestone.title}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#a1a1aa' }}>Amount: <strong className="text-white">₹{data.dispute.milestone.amount?.toLocaleString()}</strong></span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={STATUS_COLOR[data.dispute.milestone.status] || STATUS_COLOR.pending_deposit}>
                      {data.dispute.milestone.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {data.dispute.milestone.submissionFileUrl && (
                    <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#52525b' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium mb-1" style={{ color: '#a1a1aa' }}>Submitted File</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <FileLink url={data.dispute.milestone.submissionFileUrl} label="Download file" />
                          <HashBadge hash={data.dispute.milestone.submissionFileHash} />
                        </div>
                      </div>
                    </div>
                  )}

                  {data.dispute.milestone.submissionVideoUrl && (
                    <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#52525b' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium mb-1" style={{ color: '#a1a1aa' }}>Submission Video</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <FileLink url={data.dispute.milestone.submissionVideoUrl} label="Watch video" />
                          <HashBadge hash={data.dispute.milestone.submissionVideoHash} />
                        </div>
                      </div>
                    </div>
                  )}

                  {data.dispute.milestone.submissionNote && (
                    <div className="rounded-lg p-3" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#52525b' }}>Submission Note</p>
                      <p className="text-sm" style={{ color: '#a1a1aa' }}>{data.dispute.milestone.submissionNote}</p>
                    </div>
                  )}

                  {data.dispute.milestone.inaccuracyNote && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#fb923c' }}>
                        Inaccuracy Note ({data.dispute.milestone.inaccuracyCount}/{data.dispute.milestone.maxRevisions} revisions used)
                      </p>
                      <p className="text-sm" style={{ color: '#fdba74' }}>{data.dispute.milestone.inaccuracyNote}</p>
                    </div>
                  )}

                  {data.dispute.milestone.deadlineExtensions?.length > 0 && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p className="text-xs font-medium mb-2" style={{ color: '#f59e0b' }}>
                        Deadline Extended {data.dispute.milestone.deadlineExtensions.length}×
                      </p>
                      {data.dispute.milestone.deadlineExtensions.map((ext, i) => (
                        <p key={i} className="text-xs" style={{ color: '#d97706' }}>
                          → {new Date(ext.newDeadline).toLocaleDateString()} {ext.reason && `— ${ext.reason}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Contract Milestones */}
            {data.milestones?.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-4 py-2.5" style={{ background: '#1a1a1d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#52525b' }}>All Contract Milestones</p>
                </div>
                <div style={{ borderTop: 'none' }}>
                  {data.milestones.map((m, idx) => (
                    <div key={m._id} className="px-4 py-3 flex items-center gap-3"
                      style={idx > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}>
                      <span className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{ background: '#1a1a1d', color: '#52525b' }}>
                        {m.isAdvance ? 'A' : m.milestoneNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{m.title}</p>
                        <p className="text-xs" style={{ color: '#52525b' }}>₹{m.amount?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.submissionFileUrl && <FileLink url={m.submissionFileUrl} label="File" />}
                        {m.submissionVideoUrl && <FileLink url={m.submissionVideoUrl} label="Video" />}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                          style={STATUS_COLOR[m.status] || STATUS_COLOR.pending_deposit}>
                          {m.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Freelancer Portfolio Samples */}
            {data.portfolioSamples?.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-4 py-2.5" style={{ background: '#1a1a1d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#52525b' }}>Freelancer Portfolio Samples</p>
                </div>
                <div>
                  {data.portfolioSamples.map((s, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3"
                      style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{s.title}</p>
                        {s.description && <p className="text-xs truncate" style={{ color: '#52525b' }}>{s.description}</p>}
                        {s.fileHash && <HashBadge hash={s.fileHash} />}
                      </div>
                      {s.fileUrl && <FileLink url={s.fileUrl} label="View sample" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Timeline */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-4 py-2.5" style={{ background: '#1a1a1d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#52525b' }}>
                  Evidence Submitted ({data.dispute.evidence?.length || 0})
                </p>
              </div>
              {!data.dispute.evidence?.length ? (
                <p className="text-sm text-center py-4" style={{ color: '#52525b' }}>No evidence submitted yet</p>
              ) : (
                <div>
                  {data.dispute.evidence.map((e, i) => (
                    <div key={i} className="px-4 py-3" style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white">{e.submittedBy?.name || 'Unknown'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                          style={e.submittedBy?.role === 'client'
                            ? { background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }
                            : { background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          {e.submittedBy?.role}
                        </span>
                        <span className="text-xs ml-auto" style={{ color: '#52525b' }}>{new Date(e.submittedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm" style={{ color: '#a1a1aa' }}>{e.description}</p>
                      {e.fileUrl && <div className="mt-1"><FileLink url={e.fileUrl} label="View attachment" /></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Auto Evidence Summary */}
            {data.dispute.evidenceSummary?.submissionHashes?.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#52525b' }}>Auto-Compiled Evidence Summary</p>
                <div className="space-y-1.5">
                  {data.dispute.evidenceSummary.submissionHashes.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#52525b' }}>Submission hash {i + 1}:</span>
                      <HashBadge hash={h} />
                    </div>
                  ))}
                  {data.dispute.evidenceSummary.inaccuracyNotes?.map((n, i) => (
                    <div key={i} className="text-xs" style={{ color: '#fb923c' }}>Inaccuracy note {i + 1}: {n}</div>
                  ))}
                  {data.dispute.evidenceSummary.deadlineExtensionCount > 0 && (
                    <div className="text-xs" style={{ color: '#f59e0b' }}>Deadline extended {data.dispute.evidenceSummary.deadlineExtensionCount}× during contract</div>
                  )}
                </div>
              </div>
            )}

            {/* Resolution Actions */}
            <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#52525b' }}>Resolve Dispute</p>
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => resolve('release_to_freelancer')} disabled={resolving}
                  className="disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: '#059669' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                  onMouseLeave={e => e.currentTarget.style.background = '#059669'}>
                  Release to Freelancer
                </button>
                <button onClick={() => resolve('refund_to_client')} disabled={resolving}
                  className="disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: '#dc2626' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                  onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}>
                  Refund to Client
                </button>
                <div className="flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                  <input type="number" min="0" max="100" placeholder="Freelancer %" value={split}
                    onChange={e => setSplit(e.target.value)}
                    className="dark-input w-28 text-sm" />
                  <button onClick={() => resolve('split', Number(split))} disabled={!split || resolving}
                    className="btn-purple disabled:opacity-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    Split
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const TX_TYPE = {
  phase_payment:   'Phase Payment',
  advance_payment: 'Advance Payment',
  dispute_release: 'Dispute Release',
  split_payment:   'Split Payment',
  auto_release:    'Auto Release',
}

const M_STATUS_COLOR = {
  pending_deposit: { background: '#1a1a1d', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' },
  funded:          { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' },
  in_progress:     { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
  submitted:       { background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' },
  review:          { background: 'rgba(234,179,8,0.08)', color: '#eab308', border: '1px solid rgba(234,179,8,0.2)' },
  approved:        { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  inaccurate_1:    { background: 'rgba(249,115,22,0.08)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' },
  inaccurate_2:    { background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' },
  disputed:        { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' },
  released:        { background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' },
  refunded:        { background: '#1a1a1d', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' },
}

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-4" style={accent
      ? { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none' }
      : { background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-2xl font-bold" style={{ color: accent ? '#fff' : '#f4f4f5' }}>{value}</div>
      <div className="text-sm mt-0.5" style={{ color: accent ? 'rgba(255,255,255,0.7)' : '#a1a1aa' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: accent ? 'rgba(255,255,255,0.5)' : '#52525b' }}>{sub}</div>}
    </div>
  )
}

function PaymentsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedContract, setExpandedContract] = useState(null)
  const [view, setView] = useState('overview')

  useEffect(() => {
    api.get('/api/admin/payments')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load payment data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
        style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!data) return null

  const { summary, advances, contracts, clientSummary, transactions } = data
  const heldAdvances = advances.filter(a => a.held)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-2">
        <SummaryCard label="Platform Earnings" value={`₹${(summary.totalPlatformEarnings || 0).toLocaleString()}`} sub="2% client + 2% freelancer" accent />
        <SummaryCard label="Client Fees" value={`₹${(summary.totalClientFees || 0).toLocaleString()}`} sub="collected on funding" />
        <SummaryCard label="Freelancer Fees" value={`₹${(summary.totalFreelancerFees || 0).toLocaleString()}`} sub="deducted on release" />
        <SummaryCard label="Payouts Sent" value={`₹${summary.totalPayouts.toLocaleString()}`} sub={`${transactions.length} transactions`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard label="Total Funded" value={`₹${summary.totalFunded.toLocaleString()}`} sub="by clients (excl. fee)" />
        <SummaryCard label="In Escrow" value={`₹${summary.totalHeld.toLocaleString()}`} sub="held by platform" />
        <SummaryCard label="Released" value={`₹${summary.totalReleased.toLocaleString()}`} sub="to freelancers" />
        <SummaryCard label="Advance Held" value={`₹${summary.totalAdvanceHeld.toLocaleString()}`} sub={`${heldAdvances.length} contracts`} />
        <SummaryCard label="Refunded" value={`₹${summary.totalRefunded.toLocaleString()}`} sub="to clients" />
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#1a1a1d' }}>
        {[
          { key: 'overview',  label: 'Overview' },
          { key: 'clients',   label: `Clients (${clientSummary.length})` },
          { key: 'advances',  label: `Advances (${heldAdvances.length} held)` },
          { key: 'contracts', label: `Contracts (${contracts.length})` },
          { key: 'payouts',   label: `Payouts (${transactions.length})` },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={view === v.key
              ? { background: '#111113', color: '#f4f4f5', border: '1px solid rgba(255,255,255,0.08)' }
              : { color: '#52525b' }}
            onMouseEnter={e => { if (view !== v.key) e.currentTarget.style.color = '#a1a1aa' }}
            onMouseLeave={e => { if (view !== v.key) e.currentTarget.style.color = '#52525b' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── VIEW: Overview ── */}
      {view === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Fund flow visual */}
          <div className="dark-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#52525b' }}>Fund Flow</p>
            {[
              { label: 'Client Deposits (Total Funded)', amount: summary.totalFunded, color: '#8B5CF6' },
              { label: 'Platform Commission Earned', amount: summary.totalPlatformEarnings || 0, color: '#a855f7' },
              { label: 'Currently in Escrow', amount: summary.totalHeld, color: '#f59e0b' },
              { label: 'Released to Freelancers', amount: summary.totalReleased, color: '#10b981' },
              { label: 'Advance Held by Platform', amount: summary.totalAdvanceHeld, color: '#60a5fa' },
              { label: 'Refunded to Clients', amount: summary.totalRefunded, color: '#f87171' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 mb-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs" style={{ color: '#a1a1aa' }}>{row.label}</span>
                    <span className="text-xs font-bold text-white">₹{row.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a1d' }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: summary.totalFunded > 0 ? `${Math.min(100, (row.amount / summary.totalFunded) * 100)}%` : '0%', background: row.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top clients by deposit */}
          <div className="dark-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#52525b' }}>Top Clients by Deposit</p>
            {clientSummary.slice(0, 6).map(c => (
              <div key={c.client._id} className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                  {c.client.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white truncate">{c.client.name}</span>
                    <span className="text-xs font-bold text-white flex-shrink-0 ml-2">₹{c.totalDeposited.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] mt-0.5" style={{ color: '#52525b' }}>
                    <span>{c.contractCount} contract{c.contractCount !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span style={{ color: '#f59e0b' }}>₹{c.totalHeld.toLocaleString()} held</span>
                    <span>·</span>
                    <span style={{ color: '#10b981' }}>₹{c.totalReleased.toLocaleString()} released</span>
                  </div>
                </div>
              </div>
            ))}
            {clientSummary.length === 0 && <p className="text-sm text-center py-4" style={{ color: '#52525b' }}>No client deposits yet</p>}
          </div>
        </div>
      )}

      {/* ── VIEW: Clients ── */}
      {view === 'clients' && (
        <div className="dark-card overflow-hidden">
          <div className="px-5 py-3 grid grid-cols-6 gap-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: '#1a1a1d', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}>
            <span className="col-span-2">Client</span>
            <span className="text-right">Contracts</span>
            <span className="text-right">Total Deposited</span>
            <span className="text-right">In Escrow</span>
            <span className="text-right">Released</span>
          </div>
          {clientSummary.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: '#52525b' }}>No client payment data yet</p>
            : clientSummary.map((c, idx) => (
              <div key={c.client._id} className="px-5 py-3 grid grid-cols-6 gap-2 items-center transition-colors"
                style={idx > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                    {c.client.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.client.name}</p>
                    <p className="text-xs truncate" style={{ color: '#52525b' }}>{c.client.email}</p>
                  </div>
                </div>
                <span className="text-sm text-right" style={{ color: '#a1a1aa' }}>{c.contractCount}</span>
                <span className="text-sm font-semibold text-right text-white">₹{c.totalDeposited.toLocaleString()}</span>
                <span className="text-sm font-medium text-right" style={{ color: '#f59e0b' }}>₹{c.totalHeld.toLocaleString()}</span>
                <span className="text-sm font-medium text-right" style={{ color: '#10b981' }}>₹{c.totalReleased.toLocaleString()}</span>
              </div>
            ))
          }
        </div>
      )}

      {/* ── VIEW: Advances ── */}
      {view === 'advances' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f59e0b' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs" style={{ color: '#d97706' }}>
              <strong style={{ color: '#f59e0b' }}>₹{summary.totalAdvanceHeld.toLocaleString()}</strong> advance currently held — released to freelancer when Phase 1 is approved.
            </p>
          </div>

          <div className="dark-card overflow-hidden">
            <div className="px-5 py-3 grid grid-cols-5 gap-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: '#1a1a1d', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}>
              <span className="col-span-2">Contract / Project</span>
              <span>Client</span>
              <span className="text-right">Advance Amount</span>
              <span className="text-right">Status</span>
            </div>
            {advances.length === 0
              ? <p className="text-sm text-center py-8" style={{ color: '#52525b' }}>No advance payments yet</p>
              : advances.map((a, idx) => (
                <div key={a._id} className="px-5 py-3 grid grid-cols-5 gap-2 items-center"
                  style={idx > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}>
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {a.contract?.job?.title || 'Untitled Project'}
                    </p>
                    <p className="text-xs font-mono" style={{ color: '#52525b' }}>#{a.contract?.hashId}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#a1a1aa' }}>{a.contract?.client?.name}</p>
                    <p className="text-[10px] truncate" style={{ color: '#52525b' }}>{a.contract?.client?.email}</p>
                  </div>
                  <span className="text-sm font-semibold text-right" style={{ color: a.held ? '#f59e0b' : '#10b981' }}>
                    ₹{a.amount.toLocaleString()}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={M_STATUS_COLOR[a.status] || M_STATUS_COLOR.pending_deposit}>
                      {a.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── VIEW: Contracts ── */}
      {view === 'contracts' && (
        <div className="space-y-3">
          {contracts.length === 0
            ? <div className="dark-card p-8 text-center text-sm" style={{ color: '#52525b' }}>No contracts with payments yet</div>
            : contracts.map(entry => {
              const isOpen = expandedContract === entry.contract._id.toString()
              const contractId = entry.contract._id.toString()
              return (
                <div key={contractId} className="dark-card overflow-hidden">
                  <button className="w-full px-5 py-4 flex items-center gap-4 transition-colors text-left"
                    onClick={() => setExpandedContract(isOpen ? null : contractId)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">
                          {entry.contract.job?.title || 'Untitled Project'}
                        </span>
                        <span className="font-mono text-xs" style={{ color: '#52525b' }}>#{entry.contract.hashId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize" style={
                          entry.contract.status === 'completed' ? { background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' } :
                          entry.contract.status === 'active' ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' } :
                          { background: '#1a1a1d', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' }
                        }>
                          {entry.contract.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs flex-wrap" style={{ color: '#52525b' }}>
                        <span>Client: <strong style={{ color: '#a1a1aa' }}>{entry.contract.client?.name}</strong></span>
                        <span>·</span>
                        <span>Freelancer: <strong style={{ color: '#a1a1aa' }}>{entry.contract.freelancer?.name}</strong></span>
                        <span>·</span>
                        <span className="font-semibold text-white">₹{entry.totalFunded.toLocaleString()} funded</span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-right flex-shrink-0 text-xs">
                      {entry.totalHeld > 0 && <span className="font-medium" style={{ color: '#f59e0b' }}>₹{entry.totalHeld.toLocaleString()} held</span>}
                      {entry.totalReleased > 0 && <span className="font-medium" style={{ color: '#10b981' }}>₹{entry.totalReleased.toLocaleString()} released</span>}
                      {entry.totalRefunded > 0 && <span className="font-medium" style={{ color: '#f87171' }}>₹{entry.totalRefunded.toLocaleString()} refunded</span>}
                    </div>
                    <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#52525b' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="px-5 py-2 grid grid-cols-5 gap-2 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: '#1a1a1d', color: '#52525b' }}>
                        <span className="col-span-2">Phase</span>
                        <span className="text-right">Amount</span>
                        <span className="text-right">Status</span>
                        <span className="text-right">Released At</span>
                      </div>
                      {entry.milestones.map((m, idx) => (
                        <div key={m._id} className="px-5 py-2.5 grid grid-cols-5 gap-2 items-center"
                          style={idx > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}>
                          <div className="col-span-2 flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                              style={{ background: '#1a1a1d', color: '#52525b' }}>
                              {m.isAdvance ? 'A' : m.milestoneNumber}
                            </span>
                            <span className="text-xs truncate" style={{ color: '#a1a1aa' }}>{m.title}</span>
                            {m.isAdvance && (
                              <span className="text-[9px] px-1.5 rounded font-medium flex-shrink-0"
                                style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>Advance</span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-right text-white">₹{m.amount.toLocaleString()}</span>
                          <div className="text-right">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                              style={M_STATUS_COLOR[m.status] || M_STATUS_COLOR.pending_deposit}>
                              {m.status?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[10px] text-right" style={{ color: '#52525b' }}>
                            {m.releasedAt ? new Date(m.releasedAt).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      ))}
                      <div className="px-5 py-2.5 grid grid-cols-5 gap-2"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1d' }}>
                        <span className="col-span-2 text-xs font-semibold" style={{ color: '#a1a1aa' }}>Total</span>
                        <span className="text-xs font-bold text-right text-white">₹{entry.totalFunded.toLocaleString()}</span>
                        <span className="text-[10px] text-right">
                          <span style={{ color: '#f59e0b' }}>₹{entry.totalHeld.toLocaleString()} held</span>
                          {entry.totalRefunded > 0 && <span className="ml-1" style={{ color: '#f87171' }}>₹{entry.totalRefunded.toLocaleString()} refunded</span>}
                        </span>
                        <span className="text-[10px] font-semibold text-right" style={{ color: '#10b981' }}>₹{entry.totalReleased.toLocaleString()} released</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          }
        </div>
      )}

      {/* ── VIEW: Payouts ── */}
      {view === 'payouts' && (
        <div className="dark-card overflow-hidden">
          <div className="px-5 py-3 grid grid-cols-6 gap-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: '#1a1a1d', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}>
            <span className="col-span-2">Freelancer</span>
            <span>Type</span>
            <span>Phase</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Date</span>
          </div>
          {transactions.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: '#52525b' }}>No payouts recorded yet</p>
            : transactions.map((tx, idx) => (
              <div key={tx._id} className="px-5 py-3 grid grid-cols-6 gap-2 items-center transition-colors"
                style={idx > 0 ? { borderTop: '1px solid rgba(255,255,255,0.04)' } : {}}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    {tx.freelancer?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{tx.freelancer?.name}</p>
                    {tx.contract?.hashId && (
                      <p className="text-[10px] font-mono" style={{ color: '#52525b' }}>#{tx.contract.hashId}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs" style={{ color: '#a1a1aa' }}>{TX_TYPE[tx.type] || tx.type}</span>
                <div className="min-w-0">
                  <p className="text-xs truncate" style={{ color: '#a1a1aa' }}>{tx.milestone?.title || '—'}</p>
                  {tx.milestone?.isAdvance && (
                    <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>Advance</span>
                  )}
                </div>
                <span className="text-sm font-bold text-right" style={{ color: '#10b981' }}>+₹{tx.amount.toLocaleString()}</span>
                <span className="text-[10px] text-right" style={{ color: '#52525b' }}>{new Date(tx.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          }
          {transactions.length > 0 && (
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1d' }}>
              <span className="text-xs" style={{ color: '#52525b' }}>{transactions.length} payouts</span>
              <span className="text-sm font-bold text-white">Total: ₹{summary.totalPayouts.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('verification')
  const [pendingFreelancers, setPendingFreelancers] = useState([])
  const [stats, setStats] = useState(null)
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [splits, setSplits] = useState({})
  const [expandedDispute, setExpandedDispute] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, pendingRes, disputesRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/freelancers/pending'),
        api.get('/api/disputes/admin/all')
      ])
      setStats(statsRes.data)
      setPendingFreelancers(pendingRes.data)
      setDisputes(disputesRes.data)
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleVerify = async (userId, status) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }))
    try {
      await api.post(`/api/admin/freelancers/${userId}/verify`, { status })
      toast.success(`Freelancer ${status}`)
      setPendingFreelancers(prev => prev.filter(f => f._id !== userId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const resolveDispute = async (id, resolution, splitPercent) => {
    try {
      await api.patch(`/api/disputes/${id}/resolve`, { resolution, splitPercent })
      toast.success('Dispute resolved!')
      loadData()
    } catch { toast.error('Failed to resolve') }
  }

  const openDisputes = disputes.filter(d => d.status === 'open')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}>
      <Navbar />

      {expandedDispute && (
        <DisputeDetail
          disputeId={expandedDispute}
          onClose={() => setExpandedDispute(null)}
          onResolved={() => { setExpandedDispute(null); loadData() }}
        />
      )}

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-white mb-5">Admin Dashboard</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="dark-card p-4">
              <div className="text-2xl font-bold text-white">{stats.users.total}</div>
              <div className="text-sm mt-0.5" style={{ color: '#a1a1aa' }}>Total Users</div>
              <div className="text-xs mt-1" style={{ color: '#52525b' }}>{stats.users.freelancers} freelancers · {stats.users.clients} clients</div>
            </div>
            <div className="dark-card p-4">
              <div className="text-2xl font-bold text-white">{stats.jobs.total}</div>
              <div className="text-sm mt-0.5" style={{ color: '#a1a1aa' }}>Total Jobs</div>
              <div className="text-xs mt-1" style={{ color: '#52525b' }}>{stats.jobs.open} open · {stats.jobs.inProgress} in progress</div>
            </div>
            <div className="dark-card p-4">
              <div className="text-2xl font-bold" style={{ color: stats.disputes.open > 0 ? '#f87171' : '#f4f4f5' }}>{stats.disputes.open}</div>
              <div className="text-sm mt-0.5" style={{ color: '#a1a1aa' }}>Open Disputes</div>
              <div className="text-xs mt-1" style={{ color: '#52525b' }}>{stats.disputes.total} total</div>
            </div>
            <div className="dark-card p-4">
              <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.pendingVerifications}</div>
              <div className="text-sm mt-0.5" style={{ color: '#a1a1aa' }}>Pending Verifications</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { key: 'verification', label: `Verification${stats?.pendingVerifications > 0 ? ` (${stats.pendingVerifications})` : ''}` },
            { key: 'disputes', label: `Disputes${openDisputes.length > 0 ? ` (${openDisputes.length})` : ''}` },
            { key: 'payments', label: 'Payments' },
            { key: 'stats', label: 'Stats' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={activeTab === tab.key
                ? { color: '#f4f4f5', borderBottom: '2px solid #8B5CF6' }
                : { color: '#52525b' }}
              onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.color = '#a1a1aa' }}
              onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.color = '#52525b' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Verification */}
        {activeTab === 'verification' && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#52525b' }}>Freelancer Verification Requests</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
                  style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }} />
              </div>
            ) : pendingFreelancers.length === 0 ? (
              <div className="dark-card p-6 text-center text-sm" style={{ color: '#52525b' }}>No pending verification requests</div>
            ) : (
              <div className="space-y-4">
                {pendingFreelancers.map(f => (
                  <div key={f._id} className="dark-card p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-white">{f.name}</div>
                        <div className="text-sm" style={{ color: '#a1a1aa' }}>{f.email}</div>
                        {f.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {f.skills.map(s => (
                              <span key={s} className="text-xs px-2 py-0.5 rounded font-medium"
                                style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>{s}</span>
                            ))}
                          </div>
                        )}
                        {f.bio && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#52525b' }}>{f.bio}</p>}
                        <div className="mt-3 space-y-1 text-sm">
                          {f.linkedin && (
                            <div><span className="font-medium" style={{ color: '#a1a1aa' }}>LinkedIn:</span>{' '}
                              <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#A78BFA' }}>{f.linkedin}</a>
                            </div>
                          )}
                          {f.github && (
                            <div><span className="font-medium" style={{ color: '#a1a1aa' }}>GitHub:</span>{' '}
                              <a href={f.github} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#A78BFA' }}>{f.github}</a>
                            </div>
                          )}
                          {f.portfolio && (
                            <div><span className="font-medium" style={{ color: '#a1a1aa' }}>Portfolio:</span>{' '}
                              <a href={f.portfolio} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#A78BFA' }}>{f.portfolio}</a>
                            </div>
                          )}
                        </div>
                        <div className="text-xs mt-2" style={{ color: '#52525b' }}>
                          Joined: {new Date(f.createdAt).toLocaleDateString()} · Profile {f.completionPercent}% complete
                        </div>
                      </div>
                      <div className="flex gap-2 items-start">
                        <button onClick={() => handleVerify(f._id, 'approved')} disabled={actionLoading[f._id]}
                          className="text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                          style={{ background: '#059669' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                          onMouseLeave={e => e.currentTarget.style.background = '#059669'}>
                          Approve
                        </button>
                        <button onClick={() => handleVerify(f._id, 'rejected')} disabled={actionLoading[f._id]}
                          className="text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                          style={{ background: '#dc2626' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                          onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Disputes */}
        {activeTab === 'disputes' && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#52525b' }}>Open Disputes</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
                  style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }} />
              </div>
            ) : openDisputes.length === 0 ? (
              <div className="dark-card p-6 text-center text-sm" style={{ color: '#52525b' }}>No open disputes</div>
            ) : (
              openDisputes.map(d => (
                <div key={d._id} className="rounded-2xl p-5 mb-3" style={{ background: '#111113', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                        <span className="capitalize">{d.type?.replace(/_/g, ' ')} Dispute</span>
                        {d.contract?.hashId && <span className="text-xs font-mono" style={{ color: '#52525b' }}>#{d.contract.hashId}</span>}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs flex-wrap" style={{ color: '#52525b' }}>
                        {d.contract?.client && <span>Client: <strong style={{ color: '#a1a1aa' }}>{d.contract.client.name}</strong></span>}
                        {d.contract?.freelancer && <span>Freelancer: <strong style={{ color: '#a1a1aa' }}>{d.contract.freelancer.name}</strong></span>}
                      </div>
                      {d.milestone && <div className="text-sm mt-0.5" style={{ color: '#a1a1aa' }}>{d.milestone.title} · ₹{d.milestone.amount?.toLocaleString()}</div>}
                      <div className="text-xs mt-0.5" style={{ color: '#52525b' }}>
                        Raised by: <strong style={{ color: '#a1a1aa' }}>{d.raisedBy?.name}</strong> ({d.raisedBy?.role}) · {new Date(d.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-xs px-2 py-1 rounded-md font-medium"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>Open</span>
                      <button onClick={() => setExpandedDispute(d._id)}
                        className="btn-purple text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                        Review All Docs
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg p-3 mb-3 text-sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <strong style={{ color: '#f87171' }}>Reason: </strong>
                    <span style={{ color: '#fca5a5' }}>{d.reason}</span>
                  </div>

                  {/* Quick evidence preview */}
                  {d.evidence?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-1.5" style={{ color: '#52525b' }}>Evidence ({d.evidence.length} items):</p>
                      <div className="space-y-1">
                        {d.evidence.map((e, i) => (
                          <div key={i} className="text-sm rounded-lg p-2 flex items-start gap-2"
                            style={{ background: '#1a1a1d' }}>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 capitalize"
                              style={e.submittedBy?.role === 'client'
                                ? { background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }
                                : { background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                              {e.submittedBy?.name || '?'} ({e.submittedBy?.role})
                            </span>
                            <span className="flex-1" style={{ color: '#a1a1aa' }}>{e.description}</span>
                            {e.fileUrl && <FileLink url={e.fileUrl} label="File" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestone file quick links */}
                  {d.milestone?.submissionFileUrl && (
                    <div className="mb-3 flex flex-wrap gap-2 items-center">
                      <span className="text-xs" style={{ color: '#52525b' }}>Submission:</span>
                      <FileLink url={d.milestone.submissionFileUrl} label="Download file" />
                      {d.milestone.submissionVideoUrl && <FileLink url={d.milestone.submissionVideoUrl} label="Watch video" />}
                      <HashBadge hash={d.milestone.submissionFileHash} />
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap items-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => resolveDispute(d._id, 'release_to_freelancer')}
                      className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: '#059669' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#047857'}
                      onMouseLeave={e => e.currentTarget.style.background = '#059669'}>
                      Release to Freelancer
                    </button>
                    <button onClick={() => resolveDispute(d._id, 'refund_to_client')}
                      className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: '#dc2626' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                      onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}>
                      Refund to Client
                    </button>
                    <div className="flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <input type="number" min="0" max="100" placeholder="Freelancer %" value={splits[d._id] || ''}
                        onChange={e => setSplits({ ...splits, [d._id]: e.target.value })}
                        className="dark-input w-28 text-sm" />
                      <button onClick={() => resolveDispute(d._id, 'split', Number(splits[d._id]))}
                        disabled={!splits[d._id]}
                        className="btn-purple disabled:opacity-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                        Split
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Payments */}
        {activeTab === 'payments' && <PaymentsTab />}

        {/* Tab: Stats */}
        {activeTab === 'stats' && stats && (
          <div className="dark-card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#52525b' }}>Platform Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['Total Users', stats.users.total],
                ['Freelancers', stats.users.freelancers],
                ['Clients', stats.users.clients],
                ['Total Jobs', stats.jobs.total],
                ['Open Jobs', stats.jobs.open],
                ['In Progress Jobs', stats.jobs.inProgress],
                ['Completed Jobs', stats.jobs.completed],
                ['Total Contracts', stats.contracts.total],
                ['Total Disputes', stats.disputes.total],
                ['Open Disputes', stats.disputes.open],
                ['Pending Verifications', stats.pendingVerifications],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between pb-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-sm" style={{ color: '#a1a1aa' }}>{label}</span>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
