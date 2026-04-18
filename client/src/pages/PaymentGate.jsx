import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

// Dynamically inject Razorpay checkout SDK (idempotent)
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const PAYMENT_STEPS = [
  { id: 1, label: 'Job Created' },
  { id: 2, label: 'Payment' },
  { id: 3, label: 'Published' },
]

export default function PaymentGate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('simulated')
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/api/jobs/${id}`)
      .then(({ data }) => {
        setJob(data)
        // If job is already paid/published, redirect to dashboard
        if (data.paymentStatus === 'locked' || data.paymentStatus === 'paid' || data.status === 'open') {
          toast('This job is already published!', { icon: '✅' })
          navigate('/dashboard/client', { replace: true })
        }
        // Make sure this client owns the job
        if (data.client?._id !== user.id && data.client !== user.id) {
          setError('You do not have permission to pay for this job.')
        }
      })
      .catch(() => setError('Job not found or you do not have access.'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePayment = async () => {
    if (!job) return
    setPaymentLoading(true)

    try {
      if (paymentMethod === 'simulated') {
        await api.post(`/api/jobs/${job._id}/simulate-payment`)
        toast.success('🎉 Payment successful! Job is now live and visible to freelancers.')
        setTimeout(() => navigate('/dashboard/client'), 1500)
      } else {
        // Load Razorpay SDK dynamically
        const loaded = await loadRazorpayScript()
        if (!loaded) {
          toast.error('Failed to load Razorpay. Check your internet connection.')
          setPaymentLoading(false)
          return
        }

        // Create Razorpay order
        const { data: orderData } = await api.post(`/api/jobs/${job._id}/initiate-payment`)

        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount * 100,
          currency: orderData.currency || 'INR',
          order_id: orderData.razorpayOrderId,
          name: 'SafeLancer Escrow',
          description: `Advance payment for "${job.title}"`,
          handler: async (response) => {
            try {
              await api.post(`/api/jobs/${job._id}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentMethod: 'razorpay'
              })
              toast.success('🎉 Payment successful! Job is now live.')
              setTimeout(() => navigate('/dashboard/client'), 1500)
            } catch {
              toast.error('Payment verification failed. Contact support.')
            }
          },
          prefill: {
            name: user.name || 'Client',
            email: user.email || ''
          },
          theme: { color: '#18181b' },
          modal: {
            ondismiss: () => {
              setPaymentLoading(false)
              toast('Payment cancelled — your job draft is saved.', { icon: 'ℹ️' })
            }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', () => {
          toast.error('Payment failed. Please try again.')
          setPaymentLoading(false)
        })
        rzp.open()
        return // Wait for handler/dismiss callbacks
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <Navbar />
        <div className="max-w-lg mx-auto p-6 pt-16 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-2">Access Error</h1>
          <p className="text-zinc-500 text-sm mb-6">{error}</p>
          <Link to="/dashboard/client" className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!job) return null

  const advanceAmount = job.advanceAmount || Math.round(job.budget * (job.advancePercent || 10) / 100)
  const remaining = job.budget - advanceAmount

  return (
    <div className="min-h-screen bg-zinc-100">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">

        {/* Page Header */}
        <div className="mb-6">
          <Link to="/dashboard/client" className="text-xs text-zinc-400 hover:text-zinc-600 font-medium flex items-center gap-1 mb-4 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Complete Payment to Publish</h1>
          <p className="text-sm text-zinc-500 mt-1">Your job is saved as a draft. Pay the advance to make it visible to freelancers.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-6">
          {PAYMENT_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${i < 2 ? 'flex-1' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step.id < 2 ? 'bg-emerald-500 text-white' : step.id === 2 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-500'
                }`}>
                  {step.id < 2 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.id}
                </div>
                <span className={`text-xs font-medium ${step.id === 2 ? 'text-zinc-900' : step.id < 2 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < PAYMENT_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${step.id < 2 ? 'bg-emerald-300' : 'bg-zinc-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Escrow Header Card */}
        <div className="bg-zinc-900 rounded-t-xl px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Secure Escrow Payment</p>
            <p className="text-zinc-400 text-xs mt-0.5">Funds locked until work is approved — protected for both parties</p>
          </div>
          <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium">
            🔒 Escrow Protected
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-b-xl border border-zinc-200 border-t-0 p-6 space-y-6">

          {/* Job Summary */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Job Details</h2>
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{job.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{job.category} · {job.experienceLevel} · {job.phases?.length || 0} phases</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200 flex-shrink-0">
                  Draft
                </span>
              </div>
              <div className="h-px bg-zinc-200" />
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Total Budget</p>
                  <p className="font-semibold text-zinc-900">₹{job.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Advance ({job.advancePercent || 10}%)</p>
                  <p className="font-bold text-zinc-900 text-base">₹{advanceAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">Released Later</p>
                  <p className="font-semibold text-zinc-500">₹{remaining.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-xs text-emerald-700 font-medium">
                  ✓ Advance auto-released to freelancer after you approve Phase 1
                </p>
              </div>
            </div>
          </div>

          {/* Phase Summary */}
          {job.phases?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Payment Schedule</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white/10 rounded text-white text-[10px] font-bold flex items-center justify-center">A</span>
                    <span className="text-sm text-white font-medium">Advance (Pay Now)</span>
                  </div>
                  <span className="text-sm font-bold text-white">₹{advanceAmount.toLocaleString()}</span>
                </div>
                {job.phases.map((phase, i) => {
                  const phaseAmt = Math.round(remaining * phase.budgetPercent / 100)
                  return (
                    <div key={i} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-zinc-200 rounded text-zinc-600 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm text-zinc-600">{phase.title || `Phase ${i + 1}`}</span>
                      </div>
                      <span className="text-sm font-medium text-zinc-700">₹{phaseAmt.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Payment Method</h2>
            <div className="space-y-3">
              {/* Razorpay */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                paymentMethod === 'razorpay'
                  ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}>
                <input
                  type="radio"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="text-zinc-900 focus:ring-zinc-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900">Razorpay</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">Live Payment</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">UPI · Cards · Net Banking · Wallets</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {['UPI', 'Card', 'IMPS'].map(m => (
                    <span key={m} className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">{m}</span>
                  ))}
                </div>
              </label>

              {/* Simulated */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                paymentMethod === 'simulated'
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}>
                <input
                  type="radio"
                  value="simulated"
                  checked={paymentMethod === 'simulated'}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900">Simulated Payment</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">Demo Mode</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">Instant success · No real money · Perfect for demos & hackathons</p>
                </div>
                <span className="text-xl flex-shrink-0">⚡</span>
              </label>
            </div>
          </div>

          {/* Escrow notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Advance held securely in escrow</p>
                <ul className="text-xs text-amber-700 mt-1.5 space-y-1">
                  <li>✓ Funds are held by SafeLancer, not sent to the freelancer yet</li>
                  <li>✓ Automatically released after you approve Phase 1</li>
                  <li>✓ Dispute protection if work doesn't meet requirements</li>
                  <li>✓ Freelancers can only see and apply to paid, published jobs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={paymentLoading}
            className={`w-full py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              paymentMethod === 'simulated'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/20'
            }`}
          >
            {paymentLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Processing Payment...
              </>
            ) : paymentMethod === 'simulated' ? (
              <>⚡ Simulate Payment — ₹{advanceAmount.toLocaleString()}</>
            ) : (
              <>🔒 Pay ₹{advanceAmount.toLocaleString()} & Publish Job</>
            )}
          </button>

          <p className="text-xs text-zinc-400 text-center">
            Your job draft is saved. You can safely leave and return to pay later.
          </p>
        </div>
      </div>
    </div>
  )
}
