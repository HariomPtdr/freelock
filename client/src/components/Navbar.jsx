import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FREELANCER_BADGES, CLIENT_BADGES, BADGE_COLORS } from '../utils/badges'
import api from '../api'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [badgeOpen, setBadgeOpen] = useState(false)
  const [earnedIds, setEarnedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('earnedBadgeIds') || '[]') } catch { return [] }
  })
  const [earnedCount, setEarnedCount] = useState(
    parseInt(localStorage.getItem('earnedBadgeCount') || '0', 10)
  )
  const [totalCount, setTotalCount] = useState(
    parseInt(localStorage.getItem('totalBadgeCount') || '0', 10)
  )
  const badgeRef = useRef(null)
  const jobsRef = useRef(null)
  const [jobsOpen, setJobsOpen] = useState(false)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)

  useEffect(() => {
    const sync = () => {
      try { setEarnedIds(JSON.parse(localStorage.getItem('earnedBadgeIds') || '[]')) } catch {}
      setEarnedCount(parseInt(localStorage.getItem('earnedBadgeCount') || '0', 10))
      setTotalCount(parseInt(localStorage.getItem('totalBadgeCount') || '0', 10))
    }
    window.addEventListener('profileUpdated', sync)
    return () => window.removeEventListener('profileUpdated', sync)
  }, [])

  useEffect(() => {
    if (!badgeOpen) return
    const handler = (e) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target)) setBadgeOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [badgeOpen])

  useEffect(() => {
    if (!jobsOpen) return
    const handler = (e) => {
      if (jobsRef.current && !jobsRef.current.contains(e.target)) setJobsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [jobsOpen])

  const openJobsDropdown = async () => {
    setJobsOpen(v => !v)
    if (!jobsOpen && jobs.length === 0) {
      setJobsLoading(true)
      try {
        const { data } = await api.get('/api/jobs/my-jobs')
        setJobs(data)
      } catch {}
      finally { setJobsLoading(false) }
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const dashboardPath = user?.role === 'client'
    ? '/dashboard/client'
    : user?.role === 'freelancer'
    ? '/dashboard/freelancer'
    : '/admin'

  const allBadges = user?.role === 'freelancer' ? FREELANCER_BADGES : CLIENT_BADGES
  const earnedBadges = allBadges.filter(b => earnedIds.includes(b.id))
  const hasAnyBadgeData = totalCount > 0

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const linkStyle = (path) => ({
    color: isActive(path) ? '#A78BFA' : '#71717a',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'color 0.15s',
    textDecoration: 'none',
  })

  const dropdownStyle = {
    background: '#111113',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  }

  return (
    <div className="sticky top-0 z-50">
      <nav
        className="px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(10,10,11,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <Link to={dashboardPath} className="flex items-center gap-2 no-underline">
          <span className="text-lg">🔒</span>
          <span className="text-base font-bold text-white tracking-tight">SafeLancer</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase"
            style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            Beta
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-5">
            <Link to={dashboardPath} style={linkStyle(dashboardPath)}
              onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
              onMouseLeave={e => e.currentTarget.style.color = isActive(dashboardPath) ? '#A78BFA' : '#71717a'}>
              Home
            </Link>

            {/* Jobs section — hidden for admin */}
            {user.role !== 'admin' && (
              user.role === 'client' ? (
                <>
                  <Link to="/jobs/post" style={linkStyle('/jobs/post')}
                    onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
                    onMouseLeave={e => e.currentTarget.style.color = isActive('/jobs/post') ? '#A78BFA' : '#71717a'}>
                    Post Job
                  </Link>

                  <div className="relative" ref={jobsRef}>
                    <button
                      onClick={openJobsDropdown}
                      className="flex items-center gap-1 text-sm font-medium transition-colors"
                      style={{ color: jobsOpen ? '#A78BFA' : '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      My Jobs
                      <svg className={`w-3.5 h-3.5 transition-transform ${jobsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {jobsOpen && (
                      <div className="absolute left-0 top-full mt-2 w-72 z-50" style={dropdownStyle}>
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-sm font-semibold text-white">My Posted Jobs</p>
                          <Link to="/dashboard/client" onClick={() => setJobsOpen(false)}
                            className="text-xs font-medium transition-colors" style={{ color: '#A78BFA' }}>
                            View all →
                          </Link>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {jobsLoading ? (
                            <div className="flex justify-center py-6">
                              <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }} />
                            </div>
                          ) : jobs.length === 0 ? (
                            <div className="py-6 text-center">
                              <p className="text-sm" style={{ color: '#52525b' }}>No jobs posted yet</p>
                              <Link to="/jobs/post" onClick={() => setJobsOpen(false)}
                                className="inline-block mt-2 text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
                                Post a Job
                              </Link>
                            </div>
                          ) : jobs.map(j => {
                            const bids = j.bids || []
                            const pending = bids.filter(b => b.status === 'applied').length
                            return (
                              <Link key={j._id} to={`/jobs/${j._id}`} onClick={() => setJobsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 transition-colors"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'inherit', textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{j.title}</p>
                                  <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>
                                    ₹{j.budget?.toLocaleString()} · {bids.length} applicant{bids.length !== 1 ? 's' : ''}
                                    {pending > 0 ? ` · ${pending} new` : ''}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize flex-shrink-0"
                                  style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                                  {j.status.replace('_', ' ')}
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link to="/jobs" style={linkStyle('/jobs')}
                  onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
                  onMouseLeave={e => e.currentTarget.style.color = isActive('/jobs') ? '#A78BFA' : '#71717a'}>
                  Jobs
                </Link>
              )
            )}

            {/* Profile & Payments — hidden for admin */}
            {user.role !== 'admin' && (
              <>
                <Link to="/profile/setup" style={linkStyle('/profile/setup')}
                  onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
                  onMouseLeave={e => e.currentTarget.style.color = isActive('/profile/setup') ? '#A78BFA' : '#71717a'}>
                  Profile
                </Link>
                <Link to="/payments" style={linkStyle('/payments')}
                  onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
                  onMouseLeave={e => e.currentTarget.style.color = isActive('/payments') ? '#A78BFA' : '#71717a'}>
                  Payments
                </Link>
              </>
            )}

            {/* Badge indicator — hidden for admin */}
            {user.role !== 'admin' && (
              <div className="relative" ref={badgeRef}>
                <button
                  onClick={() => setBadgeOpen(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: badgeOpen ? '#A78BFA' : '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span className="text-base leading-none">🏅</span>
                  {hasAnyBadgeData ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded leading-none font-semibold"
                      style={earnedCount > 0
                        ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
                        : { background: 'rgba(255,255,255,0.08)', color: '#71717a' }
                      }>
                      {earnedCount}/{totalCount}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded leading-none font-semibold"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#71717a' }}>
                      Badges
                    </span>
                  )}
                </button>

                {badgeOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 z-50" style={dropdownStyle}>
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p className="text-sm font-semibold text-white">Badges & Achievements</p>
                        {hasAnyBadgeData && (
                          <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{earnedCount} of {totalCount} earned</p>
                        )}
                      </div>
                      <Link to="/profile/setup" onClick={() => setBadgeOpen(false)}
                        className="text-xs font-medium" style={{ color: '#A78BFA' }}>
                        View profile →
                      </Link>
                    </div>

                    <div className="p-3 max-h-96 overflow-y-auto">
                      {!hasAnyBadgeData ? (
                        <div className="py-6 text-center">
                          <p className="text-2xl mb-2">🏅</p>
                          <p className="text-sm font-medium" style={{ color: '#a1a1aa' }}>No badge data yet</p>
                          <p className="text-xs mt-1" style={{ color: '#52525b' }}>Visit your profile to load your badges</p>
                          <Link to="/profile/setup" onClick={() => setBadgeOpen(false)}
                            className="inline-block mt-3 text-xs px-3 py-1.5 rounded-lg font-medium"
                            style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
                            Go to Profile
                          </Link>
                        </div>
                      ) : earnedBadges.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: '#52525b' }}>Earned</p>
                          <div className="space-y-1.5">
                            {earnedBadges.map(badge => {
                              const c = BADGE_COLORS[badge.color]
                              return (
                                <div key={badge.id} className={`flex items-center gap-2.5 border rounded-lg px-3 py-2 ${c.earned}`}>
                                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                                    {badge.icon}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold leading-tight">{badge.title}</p>
                                    <p className="text-[11px] opacity-70 mt-0.5 leading-tight">{badge.description}</p>
                                  </div>
                                  <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User info */}
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-[11px] capitalize leading-tight" style={{ color: '#52525b' }}>{user.role}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-sm font-medium transition-colors"
              style={{ color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </div>
  )
}
