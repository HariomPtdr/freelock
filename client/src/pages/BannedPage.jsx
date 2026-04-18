import { useState, useEffect } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

export default function BannedPage() {
  const [banInfo, setBanInfo] = useState({ reason: '', penaltyDue: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('banInfo')
    if (stored) {
      try { setBanInfo(JSON.parse(stored)) } catch {}
    }
  }, [])

  const payPenalty = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/pay-penalty')
      if (data.isBanned === false) {
        toast.success(data.message || 'Penalty cleared! Account restored.')
        localStorage.removeItem('banInfo')
        setTimeout(() => { window.location.href = '/' }, 1500)
        return
      }
      // Live mode: open Razorpay
      const options = {
        key: data.razorpayKeyId,
        amount: Math.round(data.amount * 100),
        currency: 'INR',
        name: 'SafeLancer Penalty Payment',
        description: 'Account reinstatement fee',
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await api.post('/api/auth/pay-penalty/confirm', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Penalty paid. Account restored!')
            localStorage.removeItem('banInfo')
            setTimeout(() => { window.location.href = '/' }, 1500)
          } catch { toast.error('Payment confirmation failed. Contact support.') }
        },
        theme: { color: '#8B5CF6' }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process penalty payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0a0b' }}>
      <div className="dark-card p-8 max-w-md w-full text-center" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-sm mb-5" style={{ color: '#a1a1aa' }}>Your account has been temporarily suspended due to a policy violation.</p>

        {banInfo.reason && (
          <div className="rounded-xl p-4 mb-5 text-left" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Reason</p>
            <p className="text-sm text-red-300">{banInfo.reason}</p>
          </div>
        )}

        {banInfo.penaltyDue > 0 && (
          <div className="rounded-xl p-4 mb-5" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs mb-1" style={{ color: '#a1a1aa' }}>Penalty Due</p>
            <p className="text-2xl font-bold text-white">₹{banInfo.penaltyDue?.toLocaleString()}</p>
          </div>
        )}

        <button
          onClick={payPenalty}
          disabled={loading}
          className="btn-purple w-full py-3 rounded-xl font-medium text-sm disabled:opacity-50 mb-3"
        >
          {loading ? 'Processing...' : banInfo.penaltyDue > 0 ? `Pay Penalty — ₹${banInfo.penaltyDue?.toLocaleString()}` : 'Clear Penalty & Restore Access'}
        </button>
        <p className="text-xs" style={{ color: '#52525b' }}>
          Need help?{' '}
          <a href="mailto:support@safelancer.in" style={{ color: '#a1a1aa' }} className="hover:text-white transition-colors">Contact support</a>
        </p>
      </div>
    </div>
  )
}
