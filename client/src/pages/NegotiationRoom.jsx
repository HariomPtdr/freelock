import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

export default function NegotiationRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [neg, setNeg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [counter, setCounter] = useState({ amount: '', timeline: '', scope: '', milestoneCount: 3, message: '' })
  const [showCounter, setShowCounter] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get(`/api/negotiations/${id}`)
      setNeg(data)
      const last = data.rounds[data.rounds.length - 1]
      setCounter({ amount: last?.amount || '', timeline: last?.timeline || '', scope: last?.scope || '', milestoneCount: last?.milestoneCount || 3, message: '' })
    } catch { toast.error('Failed to load negotiation') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const respond = async (action) => {
    setSubmitting(true)
    try {
      const body = { action, ...(action === 'counter' ? counter : {}) }
      const { data } = await api.post(`/api/negotiations/${id}/respond`, body)
      if (action === 'accept' && data.contract) {
        toast.success('Agreement reached! Contract created.')
        setTimeout(() => navigate(`/contracts/${data.contract._id}`), 1000)
      } else {
        toast.success(action === 'reject' ? 'Negotiation rejected' : 'Counter-offer sent!')
        setNeg(data.negotiation || data)
        setShowCounter(false)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSubmitting(false) }
  }

  const isMyTurn = neg && neg.status === 'active' && (() => {
    const last = neg.rounds[neg.rounds.length - 1]
    return last?.status === 'pending' && last?.proposedByRole !== user.role
  })()

  if (loading) return (
    <div className="min-h-screen bg-zinc-100"><Navbar />
      <div className="flex justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    </div>
  )
  if (!neg) return null

  const inputCls = "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"

  return (
    <div className="min-h-screen bg-zinc-100">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-zinc-900">Negotiation — {neg.job?.title}</h1>
              <p className="text-zinc-500 text-sm mt-1">{neg.client?.name} (client) ↔ {neg.freelancer?.name} (freelancer)</p>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
              neg.status === 'active' ? 'bg-blue-50 text-blue-700'
              : neg.status === 'agreed' ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
            }`}>
              {neg.status} · Round {neg.currentRound}/{neg.maxRounds}
            </span>
          </div>
        </div>

        {/* Agreed */}
        {neg.status === 'agreed' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-5">
            <h2 className="text-emerald-800 font-semibold text-base mb-3">Agreement Reached</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-500">Amount:</span> <strong>₹{neg.agreedAmount?.toLocaleString()}</strong></div>
              <div><span className="text-zinc-500">Timeline:</span> <strong>{neg.agreedTimeline} days</strong></div>
              <div><span className="text-zinc-500">Phases:</span> <strong>{neg.agreedMilestoneCount}</strong></div>
              <div><span className="text-zinc-500">Scope:</span> <strong className="text-xs">{neg.agreedScope?.substring(0, 60)}</strong></div>
            </div>
          </div>
        )}

        {/* Rounds */}
        <div className="space-y-3 mb-5">
          {neg.rounds.map((round, idx) => (
            <div key={idx} className={`bg-white rounded-xl border p-5 ${round.proposedByRole === user.role ? 'border-zinc-300' : 'border-zinc-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-zinc-900 text-sm">
                  Round {round.roundNumber} — <span className="capitalize">{round.proposedByRole}</span>
                  {round.proposedByRole === 'client' ? ` (${neg.client?.name})` : ` (${neg.freelancer?.name})`}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize ${
                  round.status === 'accepted' ? 'bg-emerald-50 text-emerald-700'
                  : round.status === 'rejected' ? 'bg-red-50 text-red-600'
                  : round.status === 'countered' ? 'bg-amber-50 text-amber-700'
                  : 'bg-zinc-100 text-zinc-500'
                }`}>{round.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <div className="bg-zinc-50 rounded-lg p-2.5 text-center">
                  <div className="text-zinc-400 text-xs mb-0.5">Amount</div>
                  <div className="font-bold text-zinc-900">₹{round.amount?.toLocaleString()}</div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-2.5 text-center">
                  <div className="text-zinc-400 text-xs mb-0.5">Timeline</div>
                  <div className="font-bold text-zinc-900">{round.timeline} days</div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-2.5 text-center">
                  <div className="text-zinc-400 text-xs mb-0.5">Phases</div>
                  <div className="font-bold text-zinc-900">{round.milestoneCount}</div>
                </div>
              </div>
              {round.scope && <p className="text-sm text-zinc-600 mt-1">{round.scope}</p>}
              {round.message && <p className="text-sm text-zinc-400 italic mt-1">"{round.message}"</p>}
            </div>
          ))}
        </div>

        {/* My turn */}
        {isMyTurn && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <h2 className="text-base font-semibold text-zinc-900 mb-4">Your Turn to Respond</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => respond('accept')} disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50 transition-colors">
                Accept Terms
              </button>
              <button onClick={() => setShowCounter(!showCounter)}
                className="flex-1 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium py-2.5 rounded-lg text-sm transition-colors">
                Counter-Offer
              </button>
              <button onClick={() => respond('reject')} disabled={submitting}
                className="flex-1 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-lg text-sm disabled:opacity-50 transition-colors">
                Reject
              </button>
            </div>
            {showCounter && (
              <div className="space-y-3 border-t border-zinc-100 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Budget (₹)</label>
                    <input type="number" value={counter.amount} onChange={e => setCounter({ ...counter, amount: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Timeline (days)</label>
                    <input type="number" value={counter.timeline} onChange={e => setCounter({ ...counter, timeline: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Phases</label>
                    <select value={counter.milestoneCount} onChange={e => setCounter({ ...counter, milestoneCount: Number(e.target.value) })} className={inputCls}>
                      <option value={3}>3 phases</option>
                      <option value={5}>5 phases</option>
                    </select>
                  </div>
                </div>
                <textarea value={counter.scope} onChange={e => setCounter({ ...counter, scope: e.target.value })} rows={2}
                  placeholder="Scope — what exactly will be delivered" className={inputCls} />
                <textarea value={counter.message} onChange={e => setCounter({ ...counter, message: e.target.value })} rows={2}
                  placeholder="Your message with this counter-offer" className={inputCls} />
                <button onClick={() => respond('counter')} disabled={submitting}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50 transition-colors">
                  {submitting ? 'Sending...' : 'Send Counter-Offer'}
                </button>
              </div>
            )}
          </div>
        )}

        {neg.status === 'active' && !isMyTurn && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center text-zinc-500 text-sm">
            Waiting for the other party to respond...
          </div>
        )}
      </div>
    </div>
  )
}
