import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { computeBadges, BADGE_COLORS } from '../utils/badges'

const FILE_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const Icons = {
  github: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  globe: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  ),
  paperclip: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

const SectionLabel = ({ text, sub }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="h-px flex-1" style={{ background: 'rgba(255,104,3,0.12)' }} />
    <div className="text-center">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#BFBFBF' }}>{text}</h2>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: '#6b5445' }}>{sub}</p>}
    </div>
    <div className="h-px flex-1" style={{ background: 'rgba(255,104,3,0.12)' }} />
  </div>
)

export default function FreelancerProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const me = JSON.parse(localStorage.getItem('user') || '{}')
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: p }, { data: r }] = await Promise.all([
          api.get(`/api/portfolio/${userId}`),
          api.get(`/api/ratings/user/${userId}`)
        ])
        setProfile(p)
        setRatings(Array.isArray(r) ? r : [])
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    }
    load()
  }, [userId])

  if (loading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 rounded-full" style={{ borderColor: 'rgba(255,104,3,0.12)' }} />
          <div className="absolute inset-0 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#FF6803' }} />
        </div>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen">
      <Navbar />
      <p className="text-center py-12 text-sm" style={{ color: '#6b5445' }}>Profile not found</p>
    </div>
  )

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : null

  const avatarUrl = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${FILE_BASE}${profile.avatarUrl}`)
    : null

  const { earned: earnedBadges, total: totalBadges } = computeBadges('freelancer', profile.user, profile)

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Back button */}
      <div className="max-w-4xl mx-auto px-6 pt-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: '#6b5445' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F5EDE4'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b5445'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Cover banner */}
      <div className="h-36 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #120a02 0%, #1c1008 50%, #120a02 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(255,104,3,0.18) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 75% 40%, rgba(174,58,2,0.10) 0%, transparent 50%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'rgba(255,104,3,0.15)' }} />
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-16">

        {/* Hero card */}
        <div className="rounded-2xl p-6 -mt-12 mb-5" style={{ background: 'linear-gradient(135deg, rgba(18,10,2,0.96) 0%, rgba(28,16,8,0.92) 100%)', border: '1px solid rgba(255,104,3,0.18)', backdropFilter: 'blur(24px)', boxShadow: '0 0 40px rgba(255,104,3,0.06), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              {avatarUrl
                ? <img src={avatarUrl} alt={profile.user?.name}
                    className="w-20 h-20 rounded-xl object-cover -mt-14 flex-shrink-0"
                    style={{ border: '3px solid #120a02', boxShadow: '0 0 0 1px rgba(255,104,3,0.30), 0 0 20px rgba(255,104,3,0.15)' }} />
                : <div className="w-20 h-20 rounded-xl -mt-14 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 select-none"
                    style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)', border: '3px solid #120a02', boxShadow: '0 0 0 1px rgba(255,104,3,0.30), 0 0 20px rgba(255,104,3,0.20)' }}>
                    {profile.user?.name?.[0]?.toUpperCase()}
                  </div>
              }
              <div className="pb-0.5">
                <h1 className="text-xl font-bold" style={{ color: '#F5EDE4' }}>{profile.user?.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {profile.user?.verificationStatus === 'approved' && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verified
                    </span>
                  )}
                  {avgRating && (
                    <span className="flex items-center gap-1 font-bold text-sm" style={{ color: '#FF6803' }}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {avgRating}
                      <span className="font-normal text-xs" style={{ color: '#6b5445' }}>({ratings.length})</span>
                    </span>
                  )}
                  {profile.user?.totalJobsCompleted > 0 && (
                    <span className="text-xs" style={{ color: '#6b5445' }}>{profile.user.totalJobsCompleted} jobs completed</span>
                  )}
                  {profile.hourlyRate > 0 && (
                    <span className="text-xs font-semibold" style={{ color: '#BFBFBF' }}>₹{profile.hourlyRate}/hr</span>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={
                    profile.availability === 'full-time'
                      ? { background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                      : profile.availability === 'part-time'
                      ? { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }
                      : { background: '#120a02', color: '#6b5445', border: '1px solid rgba(255,104,3,0.08)' }
                  }>
                    {profile.availability === 'full-time' ? 'Available full-time'
                      : profile.availability === 'part-time' ? 'Available part-time'
                      : 'Not available'}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA — only shown to clients */}
            {me.role === 'client' && (
              <Link to={`/jobs/post?freelancer=${userId}`}
                className="btn-purple text-sm font-semibold px-4 py-2 rounded-xl flex-shrink-0">
                Hire
              </Link>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-5 text-sm leading-relaxed pt-4" style={{ color: '#BFBFBF', borderTop: '1px solid rgba(255,104,3,0.10)' }}>
              {profile.bio}
            </p>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile.skills.map(s => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,104,3,0.10)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.18)' }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Links */}
          {(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,104,3,0.10)' }}>
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
                  style={{ color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.12)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5EDE4'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#BFBFBF'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.12)' }}>
                  {Icons.github} GitHub
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
                  style={{ color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.12)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5EDE4'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#BFBFBF'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.12)' }}>
                  {Icons.linkedin} LinkedIn
                </a>
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
                  style={{ color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.12)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5EDE4'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#BFBFBF'; e.currentTarget.style.borderColor = 'rgba(255,104,3,0.12)' }}>
                  {Icons.globe} Portfolio
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="dark-card mb-5">
          <div className="grid grid-cols-4" style={{ borderBottom: '1px solid rgba(255,104,3,0.08)' }}>
            {[
              { value: avgRating ? `${avgRating}` : '—', label: 'Avg Rating' },
              { value: profile.user?.totalJobsCompleted || 0, label: 'Jobs Done' },
              { value: `${profile.user?.onTimeDeliveryRate?.toFixed(0) || 0}%`, label: 'On-time' },
              { value: `${profile.user?.disputeRate?.toFixed(0) || 0}%`, label: 'Disputes' },
            ].map((stat, idx) => (
              <div key={stat.label} className="py-4 px-2 text-center"
                style={idx > 0 ? { borderLeft: '1px solid rgba(255,104,3,0.08)' } : {}}>
                <div className="text-xl font-bold" style={{ color: stat.label === 'Avg Rating' && avgRating ? '#FF6803' : '#F5EDE4' }}>{stat.value}</div>
                <div className="text-xs mt-0.5 leading-tight" style={{ color: '#6b5445' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {(earnedBadges.length > 0 || totalBadges > 0) && (
          <div className="dark-card p-5 mb-5">
            <SectionLabel text="Badges & Achievements" sub={`${earnedBadges.length} / ${totalBadges} earned`} />
            {earnedBadges.length === 0 ? (
              <p className="text-sm italic text-center py-2" style={{ color: '#6b5445' }}>No badges earned yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {earnedBadges.map(badge => {
                  const c = BADGE_COLORS[badge.color]
                  return (
                    <div key={badge.id} className={`flex items-start gap-2 border rounded-xl px-3 py-2.5 ${c.earned}`}>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${c.icon}`}>
                        {badge.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold leading-tight truncate">{badge.title}</p>
                        <p className="text-[10px] opacity-60 mt-0.5 leading-tight line-clamp-2">{badge.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Portfolio Samples */}
        {profile.projectSamples?.length > 0 && (
          <div className="dark-card p-5 mb-5">
            <SectionLabel text="Portfolio Samples" sub={`${profile.projectSamples.length} project${profile.projectSamples.length !== 1 ? 's' : ''}`} />
            <div className="flex flex-col gap-2">
              {profile.projectSamples.map((sample, i) => (
                <div key={i}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                  style={{ border: '1px solid rgba(255,104,3,0.10)', background: '#120a02' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,104,3,0.30)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,104,3,0.10)'}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)', boxShadow: '0 0 10px rgba(255,104,3,0.25)' }}>
                    {Icons.paperclip}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F5EDE4' }}>{sample.title}</p>
                    {sample.description
                      ? <p className="text-xs mt-0.5 truncate" style={{ color: '#6b5445' }}>{sample.description}</p>
                      : sample.fileUrl && (
                        <a href={sample.fileUrl.startsWith('http') ? sample.fileUrl : `${FILE_BASE}${sample.fileUrl}`}
                          target="_blank" rel="noreferrer"
                          className="text-xs mt-0.5 truncate block transition-colors" style={{ color: '#6b5445' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#FF6803'}
                          onMouseLeave={e => e.currentTarget.style.color = '#6b5445'}>
                          View / Download
                        </a>
                      )
                    }
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sample.description && sample.fileUrl && (
                      <a href={sample.fileUrl.startsWith('http') ? sample.fileUrl : `${FILE_BASE}${sample.fileUrl}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs font-semibold transition-colors" style={{ color: '#6b5445' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#FF6803'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b5445'}>
                        Download
                      </a>
                    )}
                    {sample.fileHash && (
                      <a href={`/verify/${sample.fileHash}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                        style={{ background: 'rgba(255,104,3,0.10)', color: '#BFBFBF', border: '1px solid rgba(255,104,3,0.20)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,104,3,0.18)'; e.currentTarget.style.color = '#F5EDE4' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,104,3,0.10)'; e.currentTarget.style.color = '#BFBFBF' }}>
                        {Icons.shield}
                        SHA-256
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        {ratings.length > 0 && (
          <div className="dark-card p-5 mb-5">
            <SectionLabel text="Client Reviews" sub={`${ratings.length} review${ratings.length !== 1 ? 's' : ''}`} />
            <div className="flex flex-col gap-3">
              {ratings.map((r, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: '#120a02', border: '1px solid rgba(255,104,3,0.10)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #FF6803, #AE3A02)' }}>
                        {r.ratedBy?.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#F5EDE4' }}>{r.ratedBy?.name || 'Client'}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <svg key={n} className="w-3.5 h-3.5" fill={n <= r.stars ? '#FF6803' : 'none'} stroke={n <= r.stars ? '#FF6803' : '#6b5445'} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {r.review && <p className="text-sm leading-relaxed" style={{ color: '#BFBFBF' }}>{r.review}</p>}
                  {(r.communication || r.quality || r.timeliness) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {r.communication && <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,104,3,0.08)', color: '#6b5445', border: '1px solid rgba(255,104,3,0.10)' }}>Communication {r.communication}/5</span>}
                      {r.quality && <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,104,3,0.08)', color: '#6b5445', border: '1px solid rgba(255,104,3,0.10)' }}>Quality {r.quality}/5</span>}
                      {r.timeliness && <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,104,3,0.08)', color: '#6b5445', border: '1px solid rgba(255,104,3,0.10)' }}>Timeliness {r.timeliness}/5</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
