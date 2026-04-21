import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FREELANCER_BADGES, CLIENT_BADGES, BADGE_COLORS } from '../utils/badges'
import api from '../api'
import NavbarCanvas from './NavbarCanvas'
import { LogoMark } from './SafeLancerLogo'

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
        setJobs(Array.isArray(data) ? data : [])
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

  const [mobileOpen, setMobileOpen] = useState(false)
  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const linkStyle = (path) => ({
    color: isActive(path) ? '#BFBFBF' : '#BFBFBF',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'color 0.15s',
    textDecoration: 'none',
  })

  const dropdownStyle = {
    background: '#120a02',
    border: '1px solid rgba(255,104,3,0.18)',
    borderRadius: '14px',
    boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 20px rgba(255,104,3,0.06)',
    overflow: 'hidden',
  }

  return (
    <div className="sticky top-0 z-50" style={{ position: 'relative' }}>
      {/* 3D data-stream canvas — sits behind all nav content */}
      <NavbarCanvas />
      <nav
        className="px-6 py-3 flex items-center justify-between"
        style={{
          position: 'relative',
          background: 'rgba(11,5,1,0.82)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,104,3,0.16)',
          boxShadow: '0 1px 0 rgba(255,104,3,0.08)',
        }}
      >
        {/* Logo */}
        <Link to={dashboardPath} className="flex items-center gap-2 no-underline" data-cursor="logo"
          style={{ transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <LogoMark size={22} />
          <span className="text-base font-bold tracking-tight navbar-logo-text" style={{ color: '#F5EDE4' }}>SafeLancer</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase"
            style={{ background: 'rgba(255,104,3,0.14)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.25)', animation: 'badge-pulse 2.8s ease-in-out infinite' }}
          >
            Beta
          </span>
        </Link>

        {/* Hamburger — mobile only */}
        {user && (
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(v => !v)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexDirection: 'column', gap: '5px', zIndex: 300 }}
          >
            <span style={{ display: 'block', width: '22px', height: '2px', background: mobileOpen ? '#FF6803' : '#BFBFBF', borderRadius: '2px', transition: 'transform .2s, opacity .2s', transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#BFBFBF', borderRadius: '2px', transition: 'opacity .2s', opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: mobileOpen ? '#FF6803' : '#BFBFBF', borderRadius: '2px', transition: 'transform .2s, opacity .2s', transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        )}

        {user && (
          <div className="nav-desktop-links flex items-center gap-5">
            <Link to={dashboardPath} data-cursor="link" className="nav-link-wrap" style={linkStyle(dashboardPath)}
              onMouseEnter={e => e.currentTarget.style.color = '#F5EDE4'}
              onMouseLeave={e => e.currentTarget.style.color = isActive(dashboardPath) ? '#BFBFBF' : '#BFBFBF'}>
              Home
            </Link>

            {/* Jobs section — hidden for admin */}
            {user.role !== 'admin' && (
              user.role === 'client' ? (
                <>
                  <Link to="/jobs/post" data-cursor="link" className="nav-link-wrap" style={linkStyle('/jobs/post')}
                    onMouseEnter={e => e.currentTarget.style.color = '#F5EDE4'}
                    onMouseLeave={e => e.currentTarget.style.color = isActive('/jobs/post') ? '#BFBFBF' : '#BFBFBF'}>
                    Post Job
                  </Link>

                  <div className="relative" ref={jobsRef}>
                    <button
                      onClick={openJobsDropdown}
                      className="flex items-center gap-1 text-sm font-medium transition-colors"
                      style={{ color: jobsOpen ? '#BFBFBF' : '#BFBFBF', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      My Jobs
                      <svg className={`w-3.5 h-3.5 transition-transform ${jobsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {jobsOpen && (
                      <div className="absolute left-0 top-full mt-2 w-72 z-50" style={dropdownStyle}>
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,104,3,0.12)' }}>
                          <p className="text-sm font-semibold text-white">My Posted Jobs</p>
                          <Link to="/dashboard/client" onClick={() => setJobsOpen(false)}
                            className="text-xs font-medium transition-colors" style={{ color: '#BFBFBF' }}>
                            View all →
                          </Link>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {jobsLoading ? (
                            <div className="flex justify-center py-6">
                              <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" style={{ borderColor: '#FF6803', borderTopColor: 'transparent' }} />
                            </div>
                          ) : jobs.length === 0 ? (
                            <div className="py-6 text-center">
                              <p className="text-sm" style={{ color: '#6b5445' }}>No jobs posted yet</p>
                              <Link to="/jobs/post" onClick={() => setJobsOpen(false)}
                                className="inline-block mt-2 text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ background: 'rgba(255,104,3,0.14)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.25)' }}>
                                Post a Job
                              </Link>
                            </div>
                          ) : jobs.map(j => {
                            const bids = j.bids || []
                            const pending = bids.filter(b => b.status === 'applied').length
                            return (
                              <Link key={j._id} to={`/jobs/${j._id}`} onClick={() => setJobsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 transition-colors"
                                style={{ borderBottom: '1px solid rgba(255,104,3,0.08)', color: 'inherit', textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,104,3,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{j.title}</p>
                                  <p className="text-xs mt-0.5" style={{ color: '#6b5445' }}>
                                    ₹{j.budget?.toLocaleString()} · {bids.length} applicant{bids.length !== 1 ? 's' : ''}
                                    {pending > 0 ? ` · ${pending} new` : ''}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize flex-shrink-0"
                                  style={{ background: 'rgba(255,104,3,0.12)', color: '#BFBFBF' }}>
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
                <Link to="/jobs" data-cursor="link" className="nav-link-wrap" style={linkStyle('/jobs')}
                  onMouseEnter={e => e.currentTarget.style.color = '#F5EDE4'}
                  onMouseLeave={e => e.currentTarget.style.color = isActive('/jobs') ? '#BFBFBF' : '#BFBFBF'}>
                  Jobs
                </Link>
              )
            )}

            {/* Profile & Payments — hidden for admin */}
            {user.role !== 'admin' && (
              <>
                <Link to="/profile/setup" data-cursor="profile" className="nav-link-wrap" style={linkStyle('/profile/setup')}
                  onMouseEnter={e => e.currentTarget.style.color = '#F5EDE4'}
                  onMouseLeave={e => e.currentTarget.style.color = isActive('/profile/setup') ? '#BFBFBF' : '#BFBFBF'}>
                  Profile
                </Link>
                <Link to="/payments" data-cursor="link" className="nav-link-wrap" style={linkStyle('/payments')}
                  onMouseEnter={e => e.currentTarget.style.color = '#F5EDE4'}
                  onMouseLeave={e => e.currentTarget.style.color = isActive('/payments') ? '#BFBFBF' : '#BFBFBF'}>
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
                  style={{ color: badgeOpen ? '#BFBFBF' : '#BFBFBF', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span className="text-base leading-none">🏅</span>
                  {hasAnyBadgeData ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded leading-none font-semibold"
                      style={earnedCount > 0
                        ? { background: 'rgba(251,191,36,0.15)', color: '#FF6803' }
                        : { background: 'rgba(255,104,3,0.10)', color: '#BFBFBF' }
                      }>
                      {earnedCount}/{totalCount}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded leading-none font-semibold"
                      style={{ background: 'rgba(255,104,3,0.10)', color: '#BFBFBF' }}>
                      Badges
                    </span>
                  )}
                </button>

                {badgeOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 z-50" style={dropdownStyle}>
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,104,3,0.12)' }}>
                      <div>
                        <p className="text-sm font-semibold text-white">Badges & Achievements</p>
                        {hasAnyBadgeData && (
                          <p className="text-xs mt-0.5" style={{ color: '#6b5445' }}>{earnedCount} of {totalCount} earned</p>
                        )}
                      </div>
                      <Link to="/profile/setup" onClick={() => setBadgeOpen(false)}
                        className="text-xs font-medium" style={{ color: '#BFBFBF' }}>
                        View profile →
                      </Link>
                    </div>

                    <div className="p-3 max-h-96 overflow-y-auto">
                      {!hasAnyBadgeData ? (
                        <div className="py-6 text-center">
                          <p className="text-2xl mb-2">🏅</p>
                          <p className="text-sm font-medium" style={{ color: '#BFBFBF' }}>No badge data yet</p>
                          <p className="text-xs mt-1" style={{ color: '#6b5445' }}>Visit your profile to load your badges</p>
                          <Link to="/profile/setup" onClick={() => setBadgeOpen(false)}
                            className="inline-block mt-3 text-xs px-3 py-1.5 rounded-lg font-medium"
                            style={{ background: 'rgba(255,104,3,0.14)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.25)' }}>
                            Go to Profile
                          </Link>
                        </div>
                      ) : earnedBadges.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: '#6b5445' }}>Earned</p>
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
            <div className="flex items-center gap-3 pl-4" data-cursor="profile"
              style={{ borderLeft: '1px solid rgba(255,104,3,0.18)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)', boxShadow: '0 0 10px rgba(255,104,3,0.40)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 18px rgba(255,104,3,0.70)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 10px rgba(255,104,3,0.40)'}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight" style={{ color: '#F5EDE4' }}>{user.name}</div>
                <div className="text-[11px] capitalize leading-tight" style={{ color: '#6b5445' }}>{user.role}</div>
              </div>
            </div>

            <button
              data-cursor="danger"
              onClick={logout}
              className="text-sm font-medium transition-colors"
              style={{ color: '#6b5445', background: 'none', border: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b5445'}
            >
              Logout
            </button>
          </div>
        )}
      </nav>
      {/* Animated bottom glow sweep */}
      <div className="nav-glow-line" />

      {/* Mobile drawer */}
      {mobileOpen && user && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 250,
          background: 'rgba(11,5,1,0.97)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,104,3,0.16)',
          padding: '16px 20px 24px',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0 16px', borderBottom: '1px solid rgba(255,104,3,0.10)', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF6803,#AE3A02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#F5EDE4' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: '#6b5445', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>

          {/* Nav links */}
          {[
            { label: 'Home', path: dashboardPath },
            ...(user.role === 'client' ? [
              { label: 'Post Job', path: '/jobs/post' },
              { label: 'My Jobs', path: '/dashboard/client' },
            ] : user.role === 'freelancer' ? [
              { label: 'Browse Jobs', path: '/jobs' },
              { label: 'My Work', path: '/dashboard/freelancer' },
            ] : []),
            ...(user.role !== 'admin' ? [
              { label: 'Profile', path: '/profile/setup' },
              { label: 'Payments', path: '/payments' },
            ] : []),
          ].map(({ label, path }) => (
            <Link key={label} to={path} onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '12px 8px', fontSize: '15px', fontWeight: 500, color: isActive(path) ? '#FF6803' : '#BFBFBF', textDecoration: 'none', borderRadius: '8px', transition: 'background .15s' }}
              onTouchStart={e => e.currentTarget.style.background = 'rgba(255,104,3,0.08)'}
              onTouchEnd={e => e.currentTarget.style.background = 'transparent'}
            >
              {label}
            </Link>
          ))}

          <button onClick={() => { setMobileOpen(false); logout() }}
            style={{ marginTop: '12px', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px', color: '#ef4444', fontSize: '14px', fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
