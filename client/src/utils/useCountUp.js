import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 1200, prefix = '') {
  const [display, setDisplay] = useState(prefix + '0')
  const frame = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const numeric = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0
    if (numeric === 0) {
      setDisplay(prefix + '0')
      return
    }

    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * numeric)
      setDisplay(prefix + current.toLocaleString())
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [target, duration, prefix])

  return display
}
