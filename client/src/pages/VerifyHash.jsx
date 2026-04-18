import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

export default function VerifyHash() {
  const { hash } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.post('/api/files/verify-hash', { fileHash: hash })
      .then(({ data }) => setResult(data))
      .catch(() => setResult({ verified: false }))
      .finally(() => setLoading(false))
  }, [hash])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0b' }}>
      <div className="animate-spin h-6 w-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#0a0a0b' }}>
      <div className="mb-8 text-center">
        <div className="text-xl font-bold text-white tracking-tight">SafeLancer</div>
        <div className="text-sm mt-1" style={{ color: '#a1a1aa' }}>Delivery Verification</div>
      </div>

      <div className="dark-card p-8 w-full max-w-lg text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold ${result?.verified ? '' : ''}`}
          style={result?.verified
            ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
            : { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          {result?.verified ? '✓' : '✗'}
        </div>
        <h1 className={`text-xl font-semibold mb-2 ${result?.verified ? 'text-emerald-400' : 'text-red-400'}`}>
          {result?.verified ? 'Delivery Verified' : 'Hash Not Found'}
        </h1>
        <p className="text-sm mb-6" style={{ color: '#a1a1aa' }}>
          {result?.verified
            ? 'This file was cryptographically recorded as delivered on SafeLancer.'
            : 'This hash does not match any recorded delivery on the platform.'}
        </p>

        {result?.verified && (
          <>
            <div className="rounded-xl p-4 text-left text-sm mb-5 space-y-2.5" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                ['Client', result.client],
                ['Freelancer', result.freelancer],
                ['Milestone', result.milestoneTitle],
                ['Amount', `₹${result.amount?.toLocaleString()}`],
                ['Status', result.status],
                ['Submitted', result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: '#71717a' }}>{label}</span>
                  <span className="font-medium text-white capitalize">{value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 text-left mb-5" style={{ background: '#1a1a1d', border: '1px solid rgba(139,92,246,0.3)' }}>
              <p className="text-xs mb-1.5" style={{ color: '#a1a1aa' }}>SHA-256 Hash</p>
              <p className="text-emerald-400 font-mono text-xs break-all">{hash}</p>
            </div>
            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/files/certificate/${hash}`} target="_blank" rel="noreferrer"
              className="btn-purple inline-block px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Download Certificate PDF
            </a>
          </>
        )}
        <div className="mt-6">
          <a href="/" style={{ color: '#a1a1aa' }} className="hover:text-white text-sm underline underline-offset-2 transition-colors">← Back to SafeLancer</a>
        </div>
      </div>
    </div>
  )
}
