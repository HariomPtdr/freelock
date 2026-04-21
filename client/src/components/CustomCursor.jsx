import { useEffect, useRef } from 'react'

// Context types and their visual config
const TYPES = {
  default:   { size: 30,  br: '50%',   label: '',          color: '#FF6803', fill: false, dotScale: 1   },
  link:      { size: 42,  br: '50%',   label: '→',         color: '#BFBFBF', fill: false, dotScale: 0.6 },
  button:    { size: 48,  br: '50%',   label: '',          color: '#FF6803', fill: true,  dotScale: 0.5 },
  card:      { size: 52,  br: '10px',  label: 'VIEW',      color: '#BFBFBF', fill: false, dotScale: 0.8 },
  profile:   { size: 50,  br: '50%',   label: 'PROFILE',   color: '#FF6803', fill: false, dotScale: 0.7 },
  input:     { size: 3,   br: '2px',   label: '',          color: '#BFBFBF', fill: true,  dotScale: 1,  tall: true },
  logo:      { size: 54,  br: '50%',   label: '⚡',         color: '#FF6803', fill: false, dotScale: 0.5, spin: true },
  danger:    { size: 42,  br: '50%',   label: '✕',         color: '#ef4444', fill: false, dotScale: 1   },
  contract:  { size: 50,  br: '8px',   label: 'CONTRACT',  color: '#BFBFBF', fill: false, dotScale: 0.7 },
  verify:    { size: 46,  br: '50%',   label: '# VERIFY',  color: '#10B981', fill: false, dotScale: 0.8 },
  job:       { size: 48,  br: '10px',  label: 'APPLY',     color: '#FF6803', fill: false, dotScale: 0.8 },
}

function resolveType(el) {
  if (!el) return 'default'
  let node = el
  while (node && node !== document.body) {
    const dt = node.dataset?.cursor
    if (dt && TYPES[dt]) return dt
    const tag = node.tagName?.toLowerCase()
    if (tag === 'button') return 'button'
    if (tag === 'a') return 'link'
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'input'
    const cls = node.className || ''
    if (typeof cls === 'string') {
      if (cls.includes('card-lift')) return 'card'
      if (cls.includes('btn-purple')) return 'button'
    }
    node = node.parentElement
  }
  return 'default'
}

const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches

export default function CustomCursor() {
  const dotRef   = useRef(null)
  const ringRef  = useRef(null)
  const labelRef = useRef(null)
  const spinRef  = useRef(0)

  useEffect(() => {
    if (isTouch) return
    // Hide native cursor globally
    document.documentElement.style.cursor = 'none'

    let mx = 0,   my = 0
    let rx = 0,   ry = 0
    let curType = 'default'
    let id

    const onMove = e => {
      mx = e.clientX; my = e.clientY
      curType = resolveType(e.target)
    }
    const onLeave = () => {
      dotRef.current  && (dotRef.current.style.opacity  = '0')
      ringRef.current && (ringRef.current.style.opacity = '0')
    }
    const onEnter = () => {
      dotRef.current  && (dotRef.current.style.opacity  = '1')
      ringRef.current && (ringRef.current.style.opacity = '1')
    }

    document.addEventListener('mousemove',  onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    const tick = () => {
      id = requestAnimationFrame(tick)

      const dot   = dotRef.current
      const ring  = ringRef.current
      const label = labelRef.current
      if (!dot || !ring || !label) return

      // Lerp ring to mouse
      rx += (mx - rx) * 0.11
      ry += (my - ry) * 0.11

      const cfg  = TYPES[curType] || TYPES.default
      const half = cfg.size / 2

      // ── Dot ───────────────────────────────────────────
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%) scale(${cfg.dotScale})`
      dot.style.background = cfg.color
      dot.style.boxShadow  = `0 0 ${cfg.dotScale > 0.7 ? 10 : 6}px ${cfg.color}cc`

      // ── Ring ──────────────────────────────────────────
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-${half}px,-${half}px)` +
                             (cfg.spin ? ` rotate(${spinRef.current}deg)` : '')
      ring.style.width        = cfg.tall ? '2px'       : `${cfg.size}px`
      ring.style.height       = cfg.tall ? '22px'      : `${cfg.size}px`
      ring.style.borderRadius = cfg.br
      ring.style.borderColor  = cfg.color
      ring.style.background   = cfg.fill ? `${cfg.color}22` : 'transparent'
      ring.style.boxShadow    = cfg.fill ? `0 0 12px ${cfg.color}55` : 'none'

      if (cfg.spin) spinRef.current = (spinRef.current + 1.4) % 360

      // ── Label ─────────────────────────────────────────
      label.textContent   = cfg.label
      label.style.color   = cfg.color
      label.style.opacity = cfg.label ? '1' : '0'
      label.style.transform = `translate(${mx + 18}px,${my - 10}px)`
    }
    tick()

    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.documentElement.style.cursor = ''
    }
  }, [])

  if (isTouch) return null

  const BASE = {
    position: 'fixed', top: 0, left: 0,
    pointerEvents: 'none', zIndex: 999999,
    willChange: 'transform',
  }

  return (
    <>
      {/* Inner dot */}
      <div ref={dotRef} style={{
        ...BASE,
        width: '7px', height: '7px',
        borderRadius: '50%',
        background: '#FF6803',
        boxShadow: '0 0 8px rgba(255,104,3,0.85)',
        transition: 'background 0.18s, transform 0.06s, box-shadow 0.18s',
      }} />

      {/* Outer ring */}
      <div ref={ringRef} style={{
        ...BASE,
        border: '1.5px solid #FF6803',
        borderRadius: '50%',
        transition: [
          'width 0.28s cubic-bezier(0.16,1,0.3,1)',
          'height 0.28s cubic-bezier(0.16,1,0.3,1)',
          'border-radius 0.28s cubic-bezier(0.16,1,0.3,1)',
          'border-color 0.22s ease',
          'background 0.22s ease',
          'box-shadow 0.22s ease',
        ].join(','),
      }} />

      {/* Context label */}
      <div ref={labelRef} style={{
        ...BASE,
        fontSize: '8.5px', fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        fontFamily: "'Inter', -apple-system, sans-serif",
        whiteSpace: 'nowrap',
        transition: 'opacity 0.18s ease, color 0.18s ease',
      }} />
    </>
  )
}
