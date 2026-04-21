import { useState, useEffect } from 'react'
export default function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < bp)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [bp])
  return mobile
}
