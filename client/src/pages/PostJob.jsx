import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import SkillSelector from '../components/SkillSelector'
import toast from 'react-hot-toast'

const CATEGORIES = ['Web Development', 'Mobile', 'Design', 'Data Science', 'DevOps', 'Content', 'Other']
const DELIVERABLE_TYPES = ['Code File', 'Design File', 'Document', 'APK', 'Video', 'Other']

const emptyPhase = () => ({ title: '', guideline: '', guidelineHash: '', deliverableType: 'Other', budgetPercent: '', phaseDeadline: '', maxRevisions: 2 })

async function sha256(text) {
  if (!text) return ''
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const SectionHeader = ({ num, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>{num}</div>
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>{subtitle}</p>}
    </div>
  </div>
)

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PostJob() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '', description: '', budget: '', deadline: '',
    category: 'Other', experienceLevel: 'Mid',
    advancePercent: 10
  })
  const [skills, setSkills] = useState([])
  const [phases, setPhases] = useState([emptyPhase(), emptyPhase(), emptyPhase()])
  const [referenceFiles, setReferenceFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [completion, setCompletion] = useState(parseInt(localStorage.getItem('profileCompletion') || '0', 10))

  useEffect(() => {
    api.get('/api/auth/me').then(({ data }) => {
      const pct = data.portfolio?.completionPercent || 0
      setCompletion(pct)
      localStorage.setItem('profileCompletion', String(pct))
    }).catch(() => {})
  }, [])

  const otherPhasesPercent = phases.slice(0, -1).reduce((sum, p) => sum + Number(p.budgetPercent || 0), 0)
  const lastPhasePercent = Math.max(0, 100 - otherPhasesPercent)
  const totalPercent = otherPhasesPercent + lastPhasePercent
  const budget = Number(form.budget) || 0
  const advanceAmount = Math.round(budget * form.advancePercent / 100)
  const remaining = budget - advanceAmount

  const updatePhase = (i, field, value) => {
    const updated = [...phases]
    updated[i] = { ...updated[i], [field]: value }
    setPhases(updated)
    if (field === 'guideline') {
      sha256(value).then(hash => {
        setPhases(prev => {
          const next = [...prev]
          next[i] = { ...next[i], guidelineHash: hash }
          return next
        })
      })
    }
  }

  const addPhase = () => setPhases([...phases, emptyPhase()])
  const removePhase = (i) => { if (phases.length > 3) setPhases(phases.filter((_, idx) => idx !== i)) }

  const handleRefFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (referenceFiles.length >= 5) return toast.error('Maximum 5 reference files')
    if (file.size > 10 * 1024 * 1024) return toast.error('File must be under 10MB')
    setUploadingFile(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setReferenceFiles([...referenceFiles, { url: data.fileUrl, fileHash: data.fileHash, originalName: file.name }])
      toast.success('File uploaded and hashed')
    } catch {
      toast.error('File upload failed')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.description.trim() || form.description.length < 50) e.description = 'Minimum 50 characters'
    if (!form.budget || budget < 1000) e.budget = 'Minimum ₹1,000'
    if (!form.deadline) {
      e.deadline = 'Required'
    }
    phases.forEach((p, i) => {
      const isLast = i === phases.length - 1
      if (!p.title.trim()) e[`phase_${i}_title`] = 'Required'
      if (!p.guideline.trim() || p.guideline.length < 20) e[`phase_${i}_guideline`] = 'Min 20 chars'
      if (!isLast && (!p.budgetPercent || Number(p.budgetPercent) <= 0)) e[`phase_${i}_budget`] = 'Required'
      if (!isLast && !p.phaseDeadline) e[`phase_${i}_deadline`] = 'Required'
    })
    if (lastPhasePercent <= 0) e.phasesTotal = `Other phases already total 100% — reduce them to leave budget for the last phase`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the errors below')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/jobs', {
        ...form,
        budget: budget,
        skills,
        phases: phases.map((p, i) => {
          const isLast = i === phases.length - 1
          return {
            ...p,
            budgetPercent: isLast ? lastPhasePercent : Number(p.budgetPercent),
            phaseDeadline: isLast ? form.deadline : p.phaseDeadline
          }
        }),
        referenceFiles
      })
      toast.success('Job posted successfully!')
      setTimeout(() => navigate('/dashboard/client'), 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job')
    } finally { setLoading(false) }
  }

  const inp = (field) => `dark-input w-full ${errors[field] ? 'border-red-500' : ''}`

  const isBlocked = completion < 100

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0b' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors" style={{ color: '#a1a1aa' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
          onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-white">Post a New Job</h1>
          <p className="text-sm mt-1" style={{ color: '#a1a1aa' }}>Define your project phases upfront — freelancers see the full scope before applying</p>
        </div>

        {isBlocked && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f59e0b' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Complete your profile first</p>
                <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>Your profile is {completion}% complete. You need 100% to post jobs.</p>
                <div className="w-full rounded-full h-1.5 mt-2 overflow-hidden" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${completion}%`, background: '#f59e0b' }} />
                </div>
              </div>
              <Link to="/profile/setup" className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ background: '#f59e0b', color: '#000' }}>
                Complete Profile
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={isBlocked ? 'opacity-50 pointer-events-none select-none space-y-5' : 'space-y-5'}>

          {/* Section 1: Basic Info */}
          <div className="dark-card p-6">
            <SectionHeader num="1" title="Basic Job Information" subtitle="Core details that describe your project" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Job Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className={inp('title')} placeholder="e.g. Build React E-Commerce Website" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="dark-input w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Experience Level</label>
                  <select value={form.experienceLevel} onChange={e => setForm({ ...form, experienceLevel: e.target.value })}
                    className="dark-input w-full">
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Project Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className={inp('description')} placeholder="Describe what needs to be built, tech stack, requirements..." />
                <div className="flex justify-between mt-1">
                  {errors.description ? <p className="text-red-400 text-xs">{errors.description}</p> : <span />}
                  <span className="text-xs" style={{ color: '#52525b' }}>{form.description.length} chars</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Total Budget (₹)</label>
                  <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                    className={inp('budget')} placeholder="50000" />
                  {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Overall Deadline</label>
                  <input type="date" value={form.deadline}
                    onChange={e => {
                      const val = e.target.value
                      if (val && val < todayStr()) return
                      setForm({ ...form, deadline: val })
                    }}
                    min={todayStr()}
                    className={inp('deadline')} />
                  {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Required Skills</label>
                <SkillSelector selected={skills} onChange={setSkills} />
              </div>

            </div>
          </div>

          {/* Section 2: Advance Payment */}
          <div className="dark-card p-6">
            <SectionHeader num="2" title="Advance Payment" subtitle="Automatically locked when you hire — released to freelancer after Phase 1 approval" />
            <div className="flex gap-3 mb-4">
              {[10, 15, 20, 25].map(pct => (
                <button key={pct} type="button" onClick={() => setForm({ ...form, advancePercent: pct })}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                  style={form.advancePercent === pct
                    ? { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: '#fff', border: 'none' }
                    : { background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  {pct}%
                </button>
              ))}
            </div>
            {budget > 0 && (
              <div className="p-3 rounded-lg text-sm" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between" style={{ color: '#a1a1aa' }}>
                  <span>Advance amount locked at hire:</span>
                  <span className="font-semibold text-white">₹{advanceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mt-1" style={{ color: '#52525b' }}>
                  <span>Distributed across phases:</span>
                  <span>₹{remaining.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Phase Planning */}
          <div className="dark-card p-6">
            <SectionHeader num="3" title="Phase Planning" subtitle="Define deliverables for each phase — minimum 3 required" />

            {errors.phasesTotal && (
              <div className="mb-4 p-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>{errors.phasesTotal}</div>
            )}

            {/* Live Budget Breakdown */}
            {budget > 0 && (
              <div className="mb-5 p-4 rounded-lg" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold mb-2 text-white">Payment Breakdown</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: '#a1a1aa' }}>
                    <span className="font-medium">Advance ({form.advancePercent}%)</span>
                    <span className="font-semibold text-white">₹{advanceAmount.toLocaleString()}</span>
                  </div>
                  {phases.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs" style={{ color: '#52525b' }}>
                      <span>{p.title || `Phase ${i + 1}`} ({p.budgetPercent || 0}%)</span>
                      <span>₹{p.budgetPercent ? Math.round(remaining * Number(p.budgetPercent) / 100).toLocaleString() : '—'}</span>
                    </div>
                  ))}
                  <div className={`flex justify-between text-xs font-semibold mt-2 pt-2 ${Math.abs(totalPercent - 100) > 0.5 ? 'text-red-400' : 'text-white'}`} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>Phase Total</span>
                    <span>{totalPercent}% {Math.abs(totalPercent - 100) > 0.5 ? '✗' : '✓'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {phases.map((phase, i) => {
                const isLast = i === phases.length - 1
                const displayBudget = isLast ? String(lastPhasePercent) : phase.budgetPercent
                const displayDeadline = isLast ? (form.deadline || '') : phase.phaseDeadline
                return (
                <div key={i} className="rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Phase {i + 1}</span>
                      {isLast && <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#1a1a1d', color: '#52525b' }}>Final phase</span>}
                    </div>
                    {phases.length > 3 && !isLast && (
                      <button type="button" onClick={() => removePhase(i)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Remove</button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#a1a1aa' }}>Phase Title</label>
                        <input value={phase.title} onChange={e => updatePhase(i, 'title', e.target.value)}
                          className={`dark-input w-full ${errors[`phase_${i}_title`] ? 'border-red-500' : ''}`}
                          placeholder="e.g. UI Design" />
                        {errors[`phase_${i}_title`] && <p className="text-red-400 text-xs mt-0.5">{errors[`phase_${i}_title`]}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#a1a1aa' }}>Deliverable Type</label>
                        <select value={phase.deliverableType} onChange={e => updatePhase(i, 'deliverableType', e.target.value)}
                          className="dark-input w-full">
                          {DELIVERABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: '#a1a1aa' }}>Phase Guideline / Acceptance Criteria</label>
                      <textarea rows={3} value={phase.guideline} onChange={e => updatePhase(i, 'guideline', e.target.value)}
                        className={`dark-input w-full ${errors[`phase_${i}_guideline`] ? 'border-red-500' : ''}`}
                        placeholder="What exactly must be delivered? What does done look like?" />
                      {phase.guidelineHash && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-md" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A78BFA' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          <span className="text-[10px] font-mono truncate" style={{ color: '#A78BFA' }}>SHA-256: {phase.guidelineHash}</span>
                        </div>
                      )}
                      {errors[`phase_${i}_guideline`] && <p className="text-red-400 text-xs mt-0.5">{errors[`phase_${i}_guideline`]}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#a1a1aa' }}>Budget %</label>
                        <div className="relative">
                          <input type="number" value={displayBudget}
                            onChange={e => !isLast && updatePhase(i, 'budgetPercent', e.target.value)}
                            readOnly={isLast}
                            className={`dark-input w-full pr-7 ${isLast ? 'opacity-50 cursor-not-allowed' : errors[`phase_${i}_budget`] ? 'border-red-500' : ''}`}
                            placeholder="30" min="1" max="99" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#52525b' }}>%</span>
                        </div>
                        {isLast && <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>Auto: remaining {lastPhasePercent}%</p>}
                        {!isLast && errors[`phase_${i}_budget`] && <p className="text-red-400 text-xs mt-0.5">{errors[`phase_${i}_budget`]}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#a1a1aa' }}>Phase Deadline</label>
                        <input type="date" value={displayDeadline}
                          onChange={e => {
                            if (isLast) return
                            const val = e.target.value
                            if (val && val < todayStr()) return
                            updatePhase(i, 'phaseDeadline', val)
                          }}
                          readOnly={isLast}
                          min={todayStr()}
                          max={form.deadline || undefined}
                          className={`dark-input w-full ${isLast ? 'opacity-50 cursor-not-allowed' : errors[`phase_${i}_deadline`] ? 'border-red-500' : ''}`} />
                        {isLast && <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>Auto: matches project deadline</p>}
                        {!isLast && errors[`phase_${i}_deadline`] && <p className="text-red-400 text-xs mt-0.5">{errors[`phase_${i}_deadline`]}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#a1a1aa' }}>Max Revisions</label>
                        <select value={phase.maxRevisions} onChange={e => updatePhase(i, 'maxRevisions', Number(e.target.value))}
                          className="dark-input w-full">
                          <option value={1}>1 revision</option>
                          <option value={2}>2 revisions</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            <button type="button" onClick={addPhase}
              className="mt-4 w-full py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ border: '2px dashed rgba(255,255,255,0.08)', color: '#52525b', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = '#a1a1aa' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#52525b' }}>
              + Add Phase
            </button>
          </div>

          {/* Section 4: Reference Files */}
          <div className="dark-card p-6">
            <SectionHeader num="4" title="Reference Files" subtitle="Mockups, wireframes, specs — hashed and locked as dispute evidence (optional)" />
            {referenceFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                {referenceFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.originalName}</p>
                      <p className="text-xs font-mono mt-0.5 truncate" style={{ color: '#A78BFA' }}>{f.fileHash}</p>
                    </div>
                    <button type="button" onClick={() => setReferenceFiles(referenceFiles.filter((_, idx) => idx !== i))}
                      className="ml-3 text-lg leading-none transition-colors" style={{ color: '#52525b' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#52525b'}>×</button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleRefFileUpload} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || referenceFiles.length >= 5}
              className="w-full py-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{ border: '2px dashed rgba(255,255,255,0.08)', color: '#52525b', background: 'transparent' }}
              onMouseEnter={e => { if (!uploadingFile && referenceFiles.length < 5) { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = '#a1a1aa' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#52525b' }}>
              {uploadingFile ? 'Uploading...' : `Upload Reference File (${referenceFiles.length}/5, max 10MB each)`}
            </button>
          </div>

          {/* Section 5: Review & Post */}
          <div className="dark-card p-6">
            <SectionHeader num="5" title="Review & Post" subtitle="Once posted, scope and phase guidelines are locked with a SHA-256 hash" />

            {form.title && budget > 0 && (
              <div className="mb-5 p-4 rounded-lg space-y-2" style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  ['Title', form.title],
                  ['Category', form.category],
                  ['Experience', form.experienceLevel],
                  ['Budget', `₹${budget.toLocaleString()}`],
                  ['Advance', `${form.advancePercent}% = ₹${advanceAmount.toLocaleString()}`],
                  ['Phases', `${phases.length} phases`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span style={{ color: '#a1a1aa' }}>{label}</span>
                    <span className="font-medium text-white text-right max-w-xs truncate">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-lg mb-5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p className="text-xs" style={{ color: '#A78BFA' }}>Scope Lock</p>
              <p className="text-xs mt-1" style={{ color: '#a1a1aa' }}>After posting, a SHA-256 hash of your job title, description, and all phase guidelines will be generated and stored. This creates a tamper-proof record that protects both parties in any dispute.</p>
            </div>

            <button type="submit" disabled={loading || isBlocked}
              className="btn-purple w-full font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
              {loading ? 'Posting...' : 'Post Job & Lock Scope'}
            </button>
          </div>

        </form>
    </div>
    </div>
  )
}
