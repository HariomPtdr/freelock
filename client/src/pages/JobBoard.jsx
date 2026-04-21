import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

const CATEGORIES = ['All', 'Web Development', 'Mobile', 'Design', 'Data Science', 'DevOps', 'Content', 'Other']
const EXP_LEVELS = ['All', 'Junior', 'Mid', 'Senior']

const EXP_COLORS = {
  Junior: { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  Mid:    { background: 'rgba(255,104,3,0.1)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.2)' },
  Senior: { background: 'rgba(255,104,3,0.10)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.14)' },
}

const EMPTY = { skills: '', minBudget: '', maxBudget: '', search: '', category: '', experienceLevel: '' }

export default function JobBoard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [filters, setFilters] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchJobs = async (f) => {
    setLoading(true)
    try {
      const params = {}
      if (f.skills) params.skills = f.skills
      if (f.minBudget) params.minBudget = f.minBudget
      if (f.maxBudget) params.maxBudget = f.maxBudget
      if (f.search) params.search = f.search
      if (f.category) params.category = f.category
      if (f.experienceLevel) params.experienceLevel = f.experienceLevel
      const { data } = await api.get('/api/jobs', { params })
      setJobs(Array.isArray(data) ? data : [])
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchJobs(EMPTY) }, [])

  const applyFilters = (f) => {
    setFilters(f)
    fetchJobs(f)
  }

  const handleTextChange = (field, value) => {
    const updated = { ...filters, [field]: value }
    setFilters(updated)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchJobs(updated), 400)
  }

  const handleSelectChange = (field, value) => {
    const updated = { ...filters, [field]: value === 'All' ? '' : value }
    applyFilters(updated)
  }

  const handleEnter = (e) => { if (e.key === 'Enter') { clearTimeout(debounceRef.current); fetchJobs(filters) } }

  const clearFilters = () => applyFilters(EMPTY)

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors" style={{ color: '#BFBFBF' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
          onMouseLeave={e => e.currentTarget.style.color = '#BFBFBF'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F5EDE4' }}>
            Job Board
          </h1>
          <p className="text-sm" style={{ color: '#6b5445' }}>Browse and apply to open projects</p>
        </div>

        {/* Filters */}
        <div className="p-4 mb-5 rounded-2xl" style={{ background: 'rgba(18,10,2,0.70)', border: '1px solid rgba(255,104,3,0.12)', backdropFilter: 'blur(16px)' }}>
          {/* Search row */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b5445' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input placeholder="Search jobs by title or description..." value={filters.search}
              onChange={e => handleTextChange('search', e.target.value)}
              onKeyDown={handleEnter}
              className="dark-input w-full pl-9" />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <input placeholder="Skills (React, Node.js)" value={filters.skills}
              onChange={e => handleTextChange('skills', e.target.value)}
              onKeyDown={handleEnter}
              className="dark-input" />
            <input placeholder="Min Budget ₹" type="number" value={filters.minBudget}
              onChange={e => handleTextChange('minBudget', e.target.value)}
              onKeyDown={handleEnter}
              className="dark-input" />
            <input placeholder="Max Budget ₹" type="number" value={filters.maxBudget}
              onChange={e => handleTextChange('maxBudget', e.target.value)}
              onKeyDown={handleEnter}
              className="dark-input" />
            <select value={filters.category || 'All'}
              onChange={e => handleSelectChange('category', e.target.value)}
              className="dark-input">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <select value={filters.experienceLevel || 'All'}
              onChange={e => handleSelectChange('experienceLevel', e.target.value)}
              className="dark-input">
              {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => { clearTimeout(debounceRef.current); fetchJobs(filters) }}
              className="btn-purple px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              Search
            </button>
            <button onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
              style={{ border: '1px solid rgba(255,104,3,0.10)', background: '#120a02' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,104,3,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = '#120a02'}>
              Clear
            </button>
          </div>
        </div>

        {loading
          ? <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-[#FF6803] border-t-transparent rounded-full" />
            </div>
          : jobs.length === 0
          ? <div className="text-center py-12 text-sm" style={{ color: '#6b5445' }}>No jobs found matching your filters</div>
          : jobs.map(job => (
            <div key={job._id} className="card-lift p-5 mb-3 rounded-2xl" style={{ cursor: 'default', background: 'rgba(18,10,2,0.65)', border: '1px solid rgba(255,104,3,0.10)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-sm font-semibold text-white">{job.title}</h2>
                        {job.experienceLevel && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={EXP_COLORS[job.experienceLevel] || { background: '#120a02', color: '#BFBFBF' }}>
                            {job.experienceLevel}
                          </span>
                        )}
                        {job.verifiedOnly && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.1)', color: '#FF6803', border: '1px solid rgba(245,158,11,0.2)' }}>
                            Verified Only
                          </span>
                        )}
                      </div>

                      {/* Category */}
                      {job.category && job.category !== 'Other' && (
                        <p className="text-xs mb-1.5" style={{ color: '#6b5445' }}>{job.category}</p>
                      )}

                      <p className="text-sm line-clamp-2" style={{ color: '#BFBFBF' }}>{job.description}</p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.skills?.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(255,104,3,0.10)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.12)' }}>{s}</span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2 text-xs" style={{ color: '#BFBFBF' }}>
                        <span>Budget: <strong className="text-white">₹{job.budget?.toLocaleString()}</strong></span>
                        <span>Advance: <strong className="text-white">{job.advancePercent || 10}%</strong></span>
                        {job.phases?.length > 0 && (
                          <span>Phases: <strong className="text-white">{job.phases.length}</strong></span>
                        )}
                        <span>Deadline: <strong className="text-white">{new Date(job.deadline).toLocaleDateString()}</strong></span>
                        <span>Applications: <strong className="text-white">{job.bids?.length || 0}</strong></span>
                        {job.client?.rating > 0 && <span>Client: <strong className="text-white">★ {job.client.rating}</strong></span>}
                      </div>
                    </div>

                    <Link data-cursor="job" to={`/jobs/${job._id}`}
                      className="btn-purple flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors">
                      View & Apply
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
