import { useState } from 'react'
import api from '../api'

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const TEST_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱', sub: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳', sub: 'Visa, Mastercard, Rupay' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦', sub: 'All major banks supported' },
]

export default function PaymentVerifyModal({ onClose, onVerified }) {
  // steps: info | method_select | processing | success | failed
  const [step, setStep] = useState('info')
  const [errorMsg, setErrorMsg] = useState('')
  const [testOrder, setTestOrder] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleStartVerification = async () => {
    setStep('processing')
    setErrorMsg('')
    try {
      const { data: order } = await api.post('/api/portfolio/create-verification-order')

      if (order.isTestMode || order.orderId?.startsWith('order_test_')) {
        setTestOrder(order)
        setStep('method_select')
        return
      }

      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay SDK. Check your internet connection.')

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: 'SafeLancer',
          description: '₹1 refundable — payment method verification',
          prefill: { name: user.name || '', email: user.email || '' },
          theme: { color: '#18181b' },
          handler: async (response) => {
            try {
              await api.post('/api/portfolio/confirm-verification', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              })
              setStep('success')
              resolve()
            } catch (err) {
              reject(new Error(err.response?.data?.message || 'Signature verification failed'))
            }
          },
          modal: { ondismiss: () => reject(new Error('DISMISSED')) },
        })
        rzp.on('payment.failed', (resp) => {
          reject(new Error(resp.error?.description || 'Payment failed'))
        })
        rzp.open()
      })
    } catch (err) {
      if (err.message === 'DISMISSED') {
        setStep('info')
      } else {
        setErrorMsg(err.message)
        setStep('failed')
      }
    }
  }

  const handleTestPay = async () => {
    if (!selectedMethod) return
    setStep('processing')
    try {
      await api.post('/api/portfolio/confirm-verification', {
        razorpay_payment_id: 'pay_test_' + Date.now(),
        razorpay_order_id: testOrder.orderId,
        razorpay_signature: 'test_sig',
      })
      setStep('success')
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed')
      setStep('failed')
    }
  }

  const isBlocking = step === 'processing'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isBlocking ? undefined : onClose} />
      <div className="relative rounded-2xl shadow-xl w-full max-w-md overflow-hidden" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Verify Payment Method</h2>
              <p className="text-xs" style={{ color: '#52525b' }}>Powered by Razorpay</p>
            </div>
          </div>
          {!isBlocking && (
            <button onClick={onClose} className="transition-colors" style={{ color: '#52525b' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-6">

          {/* Step: info */}
          {step === 'info' && (
            <div className="space-y-5">
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm font-semibold text-white">How it works</p>
                {[
                  { step: '1', title: 'Choose payment method', desc: 'UPI, debit/credit card, or net banking' },
                  { step: '2', title: '₹1 refundable charge', desc: 'A small charge confirms your method is active' },
                  { step: '3', title: 'Instant refund', desc: 'The ₹1 is refunded to your account immediately' },
                  { step: '4', title: 'Verified badge applied', desc: 'Payment Verified badge shows on your profile' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#8B5CF6' }}>
                      <span className="text-[10px] text-white font-bold">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center" style={{ color: '#52525b' }}>No recurring charges. One-time verification only.</p>
              <button onClick={handleStartVerification}
                className="btn-purple w-full font-semibold py-3 rounded-xl text-sm transition-colors">
                Pay ₹1 to verify
              </button>
            </div>
          )}

          {/* Step: method_select (test mode only) */}
          {step === 'method_select' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">Choose payment method</p>
                <p className="text-xs" style={{ color: '#52525b' }}>Select how you'd like to pay ₹1 for verification</p>
              </div>
              <div className="space-y-2">
                {TEST_METHODS.map(m => (
                  <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-colors text-left"
                    style={selectedMethod === m.id
                      ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)' }
                      : { background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }
                    }>
                    <span className="text-xl leading-none">{m.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{m.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{m.sub}</p>
                    </div>
                    {selectedMethod === m.id && (
                      <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A78BFA' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="pt-1 flex gap-2">
                <button onClick={() => setStep('info')}
                  className="text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1d', color: '#a1a1aa' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1a1a1d'}>
                  Back
                </button>
                <button onClick={handleTestPay} disabled={!selectedMethod}
                  className="btn-purple flex-1 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40">
                  Pay ₹1
                </button>
              </div>
            </div>
          )}

          {/* Step: processing */}
          {step === 'processing' && (
            <div className="py-10 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="w-16 h-16 border-4 rounded-full" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <div className="absolute inset-0 w-16 h-16 border-4 border-t-[#8B5CF6] rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#8B5CF6' }} />
              </div>
              <p className="text-sm font-semibold text-white">Processing payment…</p>
              <p className="text-xs" style={{ color: '#52525b' }}>Please wait while we verify your payment</p>
            </div>
          )}

          {/* Step: success */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-white">Payment method verified!</p>
                <p className="text-xs mt-1" style={{ color: '#a1a1aa' }}>The ₹1 has been refunded to your account</p>
              </div>
              <div className="rounded-xl px-4 py-3 text-left space-y-1.5" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  'Payment Verified badge is now live on your profile',
                  'Freelancers can see you are a verified client',
                  'Higher quality bids incoming',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs" style={{ color: '#a1a1aa' }}>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { onVerified(); onClose() }}
                className="btn-purple w-full font-semibold py-3 rounded-xl text-sm transition-colors">
                Done
              </button>
            </div>
          )}

          {/* Step: failed */}
          {step === 'failed' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Verification failed</p>
                <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setStep('info'); setErrorMsg('') }}
                  className="btn-purple flex-1 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  Try again
                </button>
                <button onClick={onClose}
                  className="flex-1 font-medium py-2.5 rounded-xl text-sm transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1d', color: '#a1a1aa' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1a1a1d'}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
