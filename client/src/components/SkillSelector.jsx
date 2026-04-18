import { useState, useRef, useEffect } from 'react'

const SKILL_LIST = [
  // Frontend
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'React Native', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
  'Tailwind CSS', 'Bootstrap', 'Sass/SCSS', 'Redux', 'jQuery', 'Webpack', 'Vite',
  // Backend
  'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot',
  'PHP', 'Laravel', 'Ruby on Rails', 'C#', 'ASP.NET', 'Go', 'Rust', 'C++', 'Kotlin', 'Swift',
  // Database
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'DynamoDB', 'Cassandra', 'Supabase',
  // DevOps / Cloud
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Linux', 'Nginx', 'CI/CD', 'Git', 'GitHub Actions',
  'Terraform', 'Ansible',
  // Mobile
  'Android', 'iOS', 'Flutter',
  // Data / ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Science',
  'Pandas', 'NumPy', 'Scikit-learn', 'Power BI', 'Tableau', 'Excel', 'SQL',
  // Design
  'UI/UX Design', 'Figma', 'Photoshop', 'Illustrator', 'After Effects', 'Blender',
  'Wireframing', 'Prototyping', 'Adobe XD', 'Sketch',
  // Other Tech
  'GraphQL', 'REST API', 'WebSocket', 'Blockchain', 'Solidity', 'Unity', 'Unreal Engine',
  'WordPress', 'Shopify', 'Salesforce',
  // Soft / Business
  'SEO', 'Content Writing', 'Copywriting', 'Digital Marketing', 'Video Editing',
  'Product Management', 'Agile', 'Scrum', 'Jira', 'Project Management', 'Technical Writing'
]

export default function SkillSelector({ selected = [], onChange, maxSkills = 15, error }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const trimmed = query.trim()

  const filtered = SKILL_LIST
    .filter(s => s.toLowerCase().includes(trimmed.toLowerCase()) && !selected.includes(s))
    .slice(0, 10)

  const showAll = !trimmed
    ? SKILL_LIST.filter(s => !selected.includes(s)).slice(0, 10)
    : []

  const displayList = trimmed ? filtered : showAll

  const exactMatch = SKILL_LIST.some(s => s.toLowerCase() === trimmed.toLowerCase())
  const alreadyAdded = selected.some(s => s.toLowerCase() === trimmed.toLowerCase())
  const showCreate = trimmed && !exactMatch && !alreadyAdded

  const add = (skill) => {
    if (selected.length >= maxSkills) return
    onChange([...selected, skill])
    setQuery('')
    inputRef.current?.focus()
  }

  const remove = (skill) => onChange(selected.filter(s => s !== skill))

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Tag input box */}
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
        className={`min-h-[48px] rounded-lg px-3 py-2 flex flex-wrap gap-2 cursor-text transition-colors ${
          open ? 'border border-[#8B5CF6]' :
          error ? 'border border-red-500' :
          'border border-white/[0.08] hover:border-white/20'
        }`}
        style={{ background: '#111113' }}
      >
        {selected.map(skill => (
          <span
            key={skill}
            className="flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-md"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            {skill}
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); remove(skill) }}
              className="font-bold text-base leading-none ml-0.5 transition-colors"
              style={{ color: '#A78BFA' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#A78BFA'}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? 'Search skills or type to create new...' : selected.length < maxSkills ? 'Add more skills...' : ''}
          disabled={selected.length >= maxSkills}
          className="flex-1 min-w-[180px] outline-none text-sm bg-transparent py-1"
          style={{ color: '#f4f4f5' }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl shadow-lg overflow-hidden" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}>
          {displayList.length === 0 && !showCreate && trimmed && (
            <p className="px-4 py-3 text-sm italic" style={{ color: '#52525b' }}>No matching skills found</p>
          )}

          <div className="max-h-52 overflow-y-auto">
            {displayList.map(skill => (
              <button
                key={skill}
                type="button"
                onMouseDown={e => { e.preventDefault(); add(skill) }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#a1a1aa' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f4f4f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa' }}
              >
                {skill}
              </button>
            ))}
          </div>

          {showCreate && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); add(trimmed) }}
              className="w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2"
              style={{ color: '#f4f4f5', borderTop: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="w-5 h-5 flex items-center justify-center text-white rounded-md text-xs font-bold" style={{ background: '#8B5CF6' }}>+</span>
              Create skill "{trimmed}"
            </button>
          )}

          {selected.length >= maxSkills && (
            <div className="px-4 py-2 text-xs" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              Maximum {maxSkills} skills reached
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-1.5">
        {error
          ? <p className="text-xs text-red-500">{error}</p>
          : <p className="text-xs" style={{ color: '#52525b' }}>Search from list or type a custom skill and press Create</p>
        }
        <p className="text-xs" style={{ color: '#52525b' }}>{selected.length}/{maxSkills}</p>
      </div>
    </div>
  )
}
