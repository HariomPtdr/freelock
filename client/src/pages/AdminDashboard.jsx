import { useState, useEffect } from 'react'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [splits, setSplits] = useState({})

  const load = async () => {
    try {
      const { data } = await api.get('/api/disputes/admin/all')
      setDisputes(data)
    } catch { toast.error('Failed to load disputes') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resolve = async (id, resolution, splitPercent) => {
    try {
      await api.patch(`/api/disputes/${id}/resolve`, { resolution, splitPercent })
      toast.success('Dispute resolved!')
      await load()
    } catch { toast.error('Failed to resolve') }
  }

  const openDisputes = disputes.filter(d => d.status === 'open')
  const resolved = disputes.filter(d => d.status === 'resolved')

  return (
    <div className="min-h-screen bg-zinc-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-zinc-900 mb-5">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Open Disputes', value: openDisputes.length, accent: 'text-red-600' },
            { label: 'Resolved', value: resolved.length, accent: 'text-emerald-600' },
            { label: 'Total', value: disputes.length, accent: 'text-zinc-900' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className={`text-2xl font-bold ${s.accent}`}>{s.value}</div>
              <div className="text-zinc-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Open Disputes</h2>
        {loading
          ? <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
            </div>
          : openDisputes.length === 0
          ? <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">No open disputes</div>
          : openDisputes.map(d => (
            <div key={d._id} className="bg-white rounded-xl border border-red-200 p-5 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-zinc-900 flex items-center gap-2">
                    {d.type === 'milestone' ? 'Milestone Dispute (Auto)' : 'Manual Dispute'}
                    {d.contract?.hashId && <span className="text-xs text-zinc-400 font-mono">#{d.contract.hashId}</span>}
                  </div>
                  {d.milestone && <div className="text-sm text-zinc-500 mt-0.5">{d.milestone.title} · ₹{d.milestone.amount?.toLocaleString()}</div>}
                  <div className="text-sm text-zinc-500">Raised by: {d.raisedBy?.name} ({d.raisedBy?.role})</div>
                </div>
                <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-md font-medium">Open</span>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3 text-sm text-red-700">
                <strong>Reason:</strong> {d.reason}
              </div>
              {d.evidence?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-500 mb-1">Evidence submitted:</p>
                  {d.evidence.map((e, i) => <p key={i} className="text-sm text-zinc-600 bg-zinc-50 rounded-lg p-2 mb-1">{e.description}</p>)}
                </div>
              )}
              <div className="flex gap-2 flex-wrap items-center">
                <button onClick={() => resolve(d._id, 'release_to_freelancer')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Release to Freelancer
                </button>
                <button onClick={() => resolve(d._id, 'refund_to_client')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Refund to Client
                </button>
                <div className="flex items-center gap-2 border-l border-zinc-200 pl-3">
                  <input type="number" min="0" max="100" placeholder="Freelancer %" value={splits[d._id] || ''}
                    onChange={e => setSplits({ ...splits, [d._id]: e.target.value })}
                    className="border border-zinc-200 rounded-lg px-2 py-2 text-sm w-28 focus:outline-none focus:border-zinc-400 transition-colors" />
                  <button onClick={() => resolve(d._id, 'split', Number(splits[d._id]))}
                    disabled={!splits[d._id]}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                    Split
                  </button>
                </div>
              </div>
            </div>
          ))
        }

        {resolved.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 mt-6">Resolved</h2>
            {resolved.map(d => (
              <div key={d._id} className="bg-white rounded-xl border border-zinc-200 p-4 mb-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-700">{d.contract?.hashId && `#${d.contract.hashId}`} — {d.reason?.substring(0, 70)}</div>
                  <div className="text-sm text-zinc-400 capitalize">Resolution: {d.resolution?.replace(/_/g, ' ')}</div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-md font-medium">Resolved</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
