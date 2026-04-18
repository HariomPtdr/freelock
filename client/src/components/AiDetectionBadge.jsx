/**
 * AiDetectionBadge.jsx
 * Shows the RealityDefender deepfake analysis result for a submitted demo video.
 * - PENDING        → spinning loader "Analysing video..."
 * - AUTHENTIC      → green shield "Authentic"
 * - FAKE           → red alert "AI / Deepfake Detected"
 * - SUSPICIOUS     → amber warning "Suspicious"
 * - NOT_APPLICABLE → grey "Not Applicable"
 * - UNABLE_TO_EVALUATE → grey "Unable to Evaluate"
 *
 * Auto-polls every 8 seconds while status is PENDING.
 */
import { useState, useEffect, useRef } from 'react'
import api from '../api'

const CONFIG = {
  AUTHENTIC:           { icon: '🛡️', label: 'Authentic',               desc: 'No deepfake or AI generation detected.',      bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', color: '#10b981' },
  FAKE:                { icon: '🚨', label: 'AI / Deepfake Detected',   desc: 'This video is likely AI-generated or faked.',  bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  color: '#f87171' },
  SUSPICIOUS:          { icon: '⚠️', label: 'Suspicious',               desc: 'Possible manipulation — review carefully.',   bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b' },
  NOT_APPLICABLE:      { icon: '🔍', label: 'Not Applicable',           desc: 'Video could not be evaluated (e.g. no faces).', bg: 'rgba(113,113,122,0.12)', border: 'rgba(113,113,122,0.2)', color: '#71717a' },
  UNABLE_TO_EVALUATE:  { icon: '❓', label: 'Unable to Evaluate',       desc: 'Analysis failed — try re-uploading.',          bg: 'rgba(113,113,122,0.12)', border: 'rgba(113,113,122,0.2)', color: '#71717a' },
}

export default function AiDetectionBadge({ milestoneId, initialStatus, initialScore, initialAnalyzedAt, initialSimulated }) {
  const [status,     setStatus]     = useState(initialStatus || null)
  const [score,      setScore]      = useState(initialScore ?? null)
  const [analyzedAt, setAnalyzedAt] = useState(initialAnalyzedAt || null)
  const [simulated,  setSimulated]  = useState(initialSimulated || false)
  const [loading,    setLoading]    = useState(false)
  const pollRef = useRef(null)

  const fetchStatus = async () => {
    try {
      const { data } = await api.get(`/api/milestones/${milestoneId}/ai-check`)
      setStatus(data.rdStatus)
      setScore(data.rdScore)
      setAnalyzedAt(data.rdAnalyzedAt)
      setSimulated(data.rdSimulated)
      return data.rdStatus
    } catch { return null }
  }

  // Auto-poll while PENDING
  useEffect(() => {
    if (!milestoneId) return
    if (status === 'PENDING' || status === null) {
      const run = async () => {
        const newStatus = await fetchStatus()
        if (newStatus && newStatus !== 'PENDING') {
          clearInterval(pollRef.current)
        }
      }
      run()
      pollRef.current = setInterval(run, 8000)
    }
    return () => clearInterval(pollRef.current)
  }, [milestoneId]) // eslint-disable-line

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Trigger a full re-analysis (downloads video, re-runs detection)
      await api.post(`/api/milestones/${milestoneId}/ai-recheck`)
      setStatus('PENDING')
      setScore(null)
      setAnalyzedAt(null)
      // Start polling for the new result
      clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        const newStatus = await fetchStatus()
        if (newStatus && newStatus !== 'PENDING') {
          clearInterval(pollRef.current)
          setLoading(false)
        }
      }, 5000)
    } catch {
      await fetchStatus()
      setLoading(false)
    }
  }

  // Not yet submitted / no video
  if (!status) return null

  // Pending spinner
  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
        <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: '#A78BFA' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
        <div>
          <p className="text-xs font-semibold" style={{ color: '#A78BFA' }}>Analysing video for deepfakes…</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#71717a' }}>Powered by RealityDefender · checking authenticity</p>
        </div>
      </div>
    )
  }

  const cfg = CONFIG[status] || CONFIG.UNABLE_TO_EVALUATE

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{cfg.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
              {score !== null && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.25)', color: cfg.color }}>
                  score {score}/100
                </span>
              )}
              {simulated && (
                 <span className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider" style={{ background: 'rgba(113,113,122,0.2)', color: '#a1a1aa' }}>
                   Forensic Check
                 </span>
              )}
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: '#71717a' }}>{simulated ? 'Metadata forensics + frame analysis' : cfg.desc}</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={loading} title="Re-check"
          className="ml-3 flex-shrink-0 text-[10px] px-2 py-1 rounded transition-colors disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#71717a', border: '1px solid rgba(255,255,255,0.08)' }}>
          {loading ? '…' : '↻ Re-check'}
        </button>
      </div>
      {analyzedAt && (
        <div className="px-3 pb-2 flex justify-between items-center">
          <p className="text-[10px]" style={{ color: '#52525b' }}>
            Analysed {new Date(analyzedAt).toLocaleString()} · {simulated ? 'Forensic Analysis Engine' : 'RealityDefender API'}
          </p>
        </div>
      )}
    </div>
  )
}
