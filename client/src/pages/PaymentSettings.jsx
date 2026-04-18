import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import PaymentVerifyModal from '../components/PaymentVerifyModal'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'

export default function PaymentSettings() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const isClient = user.role === 'client'
  const isFreelancer = user.role === 'freelancer'

  const [portfolio, setPortfolio] = useState(null)
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ payoutMethod: 'upi', upiId: '', bankAccountNumber: '', ifscCode: '', accountHolderName: '' })
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [editingPayout, setEditingPayout] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/auth/me'),
      isClient ? api.get('/api/contracts/my-contracts') : api.get('/api/contracts/my-work'),
    ]).then(([me, c]) => {
      const p = me.data.portfolio
      setPortfolio(p)
      setContracts(c.data)
      if (isFreelancer && p) {
        setPayoutForm({
          payoutMethod: p.payoutMethod || 'upi',
          upiId: p.upiId || '',
          bankAccountNumber: p.bankAccountNumber || '',
          ifscCode: p.ifscCode || '',
          accountHolderName: p.accountHolderName || '',
        })
      }
    }).catch(() => toast.error('Failed to load payment data'))
      .finally(() => setLoading(false))
  }, [])

  const handleVerified = () => {
    setPortfolio(prev => {
      const updated = { ...prev, paymentVerified: true }
      const pct = calcCompletion(user.role, updated)
      localStorage.setItem('profileCompletion', String(pct))
      window.dispatchEvent(new Event('profileUpdated'))
      return updated
    })
    toast.success('Payment method verified!')
  }

  const savePayoutDetails = async () => {
    setPayoutLoading(true)
    try {
      await api.post('/api/portfolio/payout-details', payoutForm)
      setPortfolio(prev => ({ ...prev, payoutDetailsAdded: true, paymentVerified: false, payoutMethod: payoutForm.payoutMethod, upiId: payoutForm.upiId, bankAccountNumber: payoutForm.bankAccountNumber, ifscCode: payoutForm.ifscCode, accountHolderName: payoutForm.accountHolderName }))
      setEditingPayout(false)
      toast.success('Details saved! Click Verify to confirm your payout account.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payout details')
    } finally {
      setPayoutLoading(false)
    }
  }

  const verifyPayoutDetails = async () => {
    setVerifyLoading(true)
    try {
      const { data } = await api.post('/api/portfolio/verify-payout')
      setPortfolio(prev => ({ ...prev, paymentVerified: true }))
      const pct = data.completionPercent
      localStorage.setItem('profileCompletion', String(pct))
      window.dispatchEvent(new Event('profileUpdated'))
      window.dispatchEvent(new Event('payoutsProcessed'))
      toast.success('Payout account verified!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setVerifyLoading(false)
    }
  }

  const isVerified = portfolio?.paymentVerified || false
  const activeContracts = contracts.filter(c => c.status === 'active')
  const completedContracts = contracts.filter(c => c.status === 'completed')
  const totalEscrow = activeContracts.reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalTransacted = completedContracts.reduce((sum, c) => sum + (c.amount || 0), 0)

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-[#FF6803] border-t-transparent rounded-full" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <Navbar />
      {showVerifyModal && (
        <PaymentVerifyModal onClose={() => setShowVerifyModal(false)} onVerified={handleVerified} />
      )}

      <div className="max-w-3xl mx-auto p-6 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors" style={{ color: '#BFBFBF' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
          onMouseLeave={e => e.currentTarget.style.color = '#BFBFBF'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Payment Settings</h1>
            <p className="text-sm mt-0.5" style={{ color: '#BFBFBF' }}>Manage your payment method and view transaction history</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Active Contracts', value: activeContracts.length },
            { label: isFreelancer ? 'Total Earned' : 'Total Spent', value: `₹${totalTransacted.toLocaleString()}` },
            { label: 'In Escrow', value: `₹${totalEscrow.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="dark-card p-4">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: '#BFBFBF' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Payment verification — clients only */}
        {isClient && (
          <div className="dark-card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Payment Verification</h2>
              {isVerified && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isVerified ? 'linear-gradient(135deg, #FF6803, #AE3A02)' : 'rgba(255,104,3,0.06)' }}>
                <svg className={`w-5 h-5 ${isVerified ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={!isVerified ? { color: '#6b5445' } : {}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  {isVerified ? 'Payment Method Verified' : 'Payment Method Not Verified'}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#BFBFBF' }}>
                  {isVerified
                    ? 'Your payment method is verified. Freelancers can see this badge on your profile, which improves bid quality.'
                    : 'Verify your payment method to build trust with freelancers. A ₹1 refundable charge confirms your method is active.'}
                </p>
                {!isVerified && (
                  <div className="mt-3 space-y-1.5">
                    {[
                      'Payment Verified badge on your public profile',
                      'Higher quality bids from freelancers',
                      'Faster contract creation and onboarding',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ border: '1.5px solid rgba(255,104,3,0.14)' }} />
                        <span className="text-xs" style={{ color: '#BFBFBF' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isVerified && (
                  <div className="mt-3 space-y-1.5">
                    {[
                      'Payment Verified badge visible on your profile',
                      'Attracting higher-quality freelancer bids',
                      'Trust established for contract creation',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs" style={{ color: '#BFBFBF' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!isVerified && (
                <button onClick={() => setShowVerifyModal(true)}
                  className="btn-purple text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0">
                  Verify now
                </button>
              )}
            </div>

            {/* How it works */}
            {!isVerified && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,104,3,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b5445' }}>How it works</p>
                <div className="space-y-3">
                  {[
                    { step: '1', title: 'Choose payment method', desc: 'UPI, debit/credit card, or net banking' },
                    { step: '2', title: '₹1 refundable charge', desc: 'A small charge confirms your method is active' },
                    { step: '3', title: 'Instant refund', desc: 'The ₹1 is refunded to you within seconds via Razorpay' },
                    { step: '4', title: 'Badge applied', desc: 'Payment Verified badge shows on your public profile' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#FF6803' }}>
                        <span className="text-[10px] text-white font-bold">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{item.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b5445' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Freelancer payout details */}
        {isFreelancer && (
          <div className="dark-card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Payout Details</h2>
              {portfolio?.paymentVerified ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.08)', color: '#FF6803', border: '1px solid rgba(245,158,11,0.2)' }}>
                  Not Verified
                </span>
              )}
            </div>

            {/* No details yet */}
            {!portfolio?.payoutDetailsAdded && !editingPayout && (
              <div className="text-center py-6 rounded-xl mb-3" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,104,3,0.06)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b5445' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white">No payout account added</p>
                <p className="text-xs mt-1 mb-4" style={{ color: '#6b5445' }}>Add your UPI ID or bank account to receive milestone payments</p>
                <button onClick={() => setEditingPayout(true)}
                  className="btn-purple text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                  Add payout details
                </button>
              </div>
            )}

            {/* Saved details display */}
            {portfolio?.payoutDetailsAdded && !editingPayout && (
              <div className="rounded-xl p-4 mb-3" style={{ background: '#120a02', border: `1px solid ${portfolio.paymentVerified ? 'rgba(255,104,3,0.06)' : 'rgba(245,158,11,0.2)'}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: portfolio.paymentVerified ? 'linear-gradient(135deg, #FF6803, #AE3A02)' : 'rgba(245,158,11,0.1)' }}>
                    <svg className={`w-5 h-5 ${portfolio.paymentVerified ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={!portfolio.paymentVerified ? { color: '#FF6803' } : {}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{portfolio.payoutMethod === 'bank' ? 'Bank Transfer' : 'UPI'}</p>
                    {portfolio.payoutMethod === 'upi' ? (
                      <p className="text-xs mt-0.5" style={{ color: '#BFBFBF' }}>UPI ID: <span className="font-medium text-white">{portfolio.upiId}</span></p>
                    ) : (
                      <div className="text-xs mt-0.5 space-y-0.5" style={{ color: '#BFBFBF' }}>
                        <p>Account: <span className="font-medium text-white">****{portfolio.bankAccountNumber?.slice(-4)}</span></p>
                        <p>IFSC: <span className="font-medium text-white">{portfolio.ifscCode}</span> · Name: <span className="font-medium text-white">{portfolio.accountHolderName}</span></p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setEditingPayout(true) }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ border: '1px solid rgba(255,104,3,0.10)', background: 'transparent', color: '#BFBFBF' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,104,3,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Edit
                  </button>
                </div>

                {/* Verify prompt */}
                {!portfolio.paymentVerified && (
                  <div className="mt-3 pt-3 flex items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: '#FF6803' }}>Account not yet verified</p>
                      <p className="text-xs mt-0.5" style={{ color: '#BFBFBF' }}>Verify to confirm your account and unlock the Verified badge on your profile</p>
                    </div>
                    <button onClick={verifyPayoutDetails} disabled={verifyLoading}
                      className="btn-purple disabled:opacity-50 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0 flex items-center gap-1.5">
                      {verifyLoading ? (
                        <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Verifying…</>
                      ) : (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> Verify now</>
                      )}
                    </button>
                  </div>
                )}

                {/* Already verified confirmation */}
                {portfolio.paymentVerified && (
                  <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,104,3,0.06)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <p className="text-xs" style={{ color: '#BFBFBF' }}>Account verified — you will receive payouts at this address when milestones are released</p>
                  </div>
                )}
              </div>
            )}

            {/* Add / Edit form */}
            {editingPayout && (
              <div className="rounded-xl p-4 space-y-4 mb-3" style={{ border: '1px solid rgba(255,104,3,0.10)', background: '#120a02' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#BFBFBF' }}>Select payout method</p>
                <div className="flex gap-2">
                  {['upi', 'bank'].map(m => (
                    <button key={m} onClick={() => setPayoutForm(f => ({ ...f, payoutMethod: m }))}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                      style={payoutForm.payoutMethod === m
                        ? { background: 'linear-gradient(135deg, #FF6803, #AE3A02)', color: '#fff', border: 'none' }
                        : { background: 'transparent', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.10)' }
                      }>
                      {m === 'upi' ? 'UPI' : 'Bank Transfer'}
                    </button>
                  ))}
                </div>

                {payoutForm.payoutMethod === 'upi' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#BFBFBF' }}>UPI ID</label>
                    <input type="text" value={payoutForm.upiId} placeholder="yourname@upi or phone@okaxis"
                      onChange={e => setPayoutForm(f => ({ ...f, upiId: e.target.value }))}
                      className="dark-input w-full" />
                    <p className="text-xs mt-1" style={{ color: '#6b5445' }}>Must contain @ — e.g. name@upi, number@paytm</p>
                  </div>
                )}

                {payoutForm.payoutMethod === 'bank' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#BFBFBF' }}>Account Holder Name</label>
                      <input type="text" value={payoutForm.accountHolderName} placeholder="Full name as on bank records"
                        onChange={e => setPayoutForm(f => ({ ...f, accountHolderName: e.target.value }))}
                        className="dark-input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#BFBFBF' }}>Account Number</label>
                      <input type="text" value={payoutForm.bankAccountNumber} placeholder="9–18 digit account number"
                        onChange={e => setPayoutForm(f => ({ ...f, bankAccountNumber: e.target.value.replace(/\D/g, '') }))}
                        className="dark-input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#BFBFBF' }}>IFSC Code</label>
                      <input type="text" value={payoutForm.ifscCode} placeholder="e.g. HDFC0001234"
                        maxLength={11}
                        onChange={e => setPayoutForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                        className="dark-input w-full uppercase" />
                      <p className="text-xs mt-1" style={{ color: '#6b5445' }}>4 letters + 0 + 6 alphanumeric — e.g. HDFC0001234</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={savePayoutDetails} disabled={payoutLoading || !payoutForm.payoutMethod}
                    className="btn-purple flex-1 disabled:opacity-50 text-sm font-semibold py-2.5 rounded-lg transition-colors">
                    {payoutLoading ? 'Saving...' : 'Save details'}
                  </button>
                  {portfolio?.payoutDetailsAdded && (
                    <button onClick={() => setEditingPayout(false)}
                      className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      style={{ border: '1px solid rgba(255,104,3,0.10)', background: 'transparent', color: '#BFBFBF' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,104,3,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs" style={{ color: '#6b5445' }}>Payouts are processed via Razorpay after each milestone is released.</p>
          </div>
        )}

        {/* Escrow & Active Contracts */}
        <div className="dark-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-white mb-4">Active Escrow</h2>
          {activeContracts.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,104,3,0.06)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b5445' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: '#BFBFBF' }}>No active escrow</p>
              <p className="text-xs mt-1" style={{ color: '#6b5445' }}>Funds will appear here once a contract is funded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeContracts.map(c => (
                <div key={c._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.job?.title || 'Contract'}</p>
                    <p className="text-xs" style={{ color: '#BFBFBF' }}>
                      {isFreelancer ? `with ${c.client?.name}` : `with ${c.freelancer?.name}`} · {c.milestoneCount} phases
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">₹{c.amount?.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: '#6b5445' }}>in escrow</p>
                  </div>
                  <Link to={`/contracts/${c._id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ border: '1px solid rgba(255,104,3,0.10)', background: 'transparent', color: '#BFBFBF' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#BFBFBF'}>
                    View
                  </Link>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-2 px-1" style={{ borderTop: '1px solid rgba(255,104,3,0.06)' }}>
                <span className="text-xs font-medium" style={{ color: '#BFBFBF' }}>Total in escrow</span>
                <span className="text-sm font-bold text-white">₹{totalEscrow.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="dark-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Transaction History</h2>
          {completedContracts.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,104,3,0.06)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b5445' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: '#BFBFBF' }}>No completed transactions yet</p>
              <p className="text-xs mt-1" style={{ color: '#6b5445' }}>Completed contracts will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedContracts.map(c => (
                <div key={c._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ border: '1px solid rgba(255,104,3,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.job?.title || 'Contract'}</p>
                    <p className="text-xs" style={{ color: '#BFBFBF' }}>
                      {isFreelancer ? `from ${c.client?.name}` : `to ${c.freelancer?.name}`} · Completed
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">
                      {isFreelancer ? '+' : '-'}₹{c.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: '#6b5445' }}>released</p>
                  </div>
                  <Link to={`/contracts/${c._id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ border: '1px solid rgba(255,104,3,0.10)', background: 'transparent', color: '#BFBFBF' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#BFBFBF'}>
                    View
                  </Link>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-2 px-1" style={{ borderTop: '1px solid rgba(255,104,3,0.06)' }}>
                <span className="text-xs font-medium" style={{ color: '#BFBFBF' }}>Total {isFreelancer ? 'earned' : 'spent'}</span>
                <span className="text-sm font-bold text-white">₹{totalTransacted.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
