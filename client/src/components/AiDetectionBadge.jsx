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
  AUTHENTIC:           { label: 'Authentic',               desc: 'No deepfake or AI generation detected.',        bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.22)',  color: '#10b981',  iconColor: '#10b981' },
  FAKE:                { label: 'AI / Deepfake Detected',  desc: 'This video is likely AI-generated or faked.',   bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.22)',   color: '#f87171',  iconColor: '#f87171' },
  SUSPICIOUS:          { label: 'Suspicious',              desc: 'Possible manipulation — review carefully.',     bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)',  color: '#f59e0b',  iconColor: '#f59e0b' },
  NOT_APPLICABLE:      { label: 'Not Applicable',          desc: 'Video could not be evaluated (e.g. no faces).', bg: '#120a02',                border: 'rgba(255,104,3,0.08)',   color: '#6b5445',  iconColor: '#6b5445' },
  UNABLE_TO_EVALUATE:  { label: 'Unable to Evaluate',      desc: 'Analysis failed — try re-uploading.',           bg: '#120a02',                border: 'rgba(255,104,3,0.08)',   color: '#6b5445',  iconColor: '#6b5445' },
}

function StatusIcon({ status, color }) {
  const cls = `w-4 h-4 flex-shrink-0`
  if (status === 'AUTHENTIC') return (
    <svg className={cls} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
  if (status === 'FAKE') return (
    <svg className={cls} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
  if (status === 'SUSPICIOUS') return (
    <svg className={cls} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  return (
    <svg className={cls} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
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
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.12)' }}>
        <div className="relative flex-shrink-0 w-4 h-4">
          <div className="absolute inset-0 border-2 rounded-full" style={{ borderColor: 'rgba(255,104,3,0.12)' }} />
          <div className="absolute inset-0 border-2 border-t-[#FF6803] rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#FF6803' }} />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: '#F5EDE4' }}>Analysing video for deepfakes…</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#6b5445' }}>Powered by RealityDefender · checking authenticity</p>
        </div>
      </div>
    )
  }

  const cfg = CONFIG[status] || CONFIG.UNABLE_TO_EVALUATE

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <StatusIcon status={status} color={cfg.iconColor} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
              {score !== null && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-medium"
                  style={{ background: 'rgba(255,104,3,0.10)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.15)' }}>
                  score {score}/100
                </span>
              )}
              {simulated && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                  style={{ background: 'rgba(255,104,3,0.08)', color: '#6b5445', border: '1px solid rgba(255,104,3,0.12)' }}>
                  Forensic Check
                </span>
              )}
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: '#6b5445' }}>
              {simulated ? 'Metadata forensics + frame analysis' : cfg.desc}
            </p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={loading} title="Re-check"
          className="ml-3 flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
          style={{ background: '#120a02', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.10)' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,104,3,0.06)' }}
          onMouseLeave={e => e.currentTarget.style.background = '#120a02'}>
          {loading
            ? <span className="flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              </span>
            : <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-check
              </span>
          }
        </button>
      </div>
      {analyzedAt && (
        <div className="px-4 pb-3" style={{ borderTop: `1px solid ${cfg.border}` }}>
          <p className="text-[10px] pt-2" style={{ color: '#6b5445' }}>
            Analysed {new Date(analyzedAt).toLocaleString()} · {simulated ? 'Forensic Analysis Engine' : 'RealityDefender API'}
          </p>
        </div>
      )}
    </div>
  )
}