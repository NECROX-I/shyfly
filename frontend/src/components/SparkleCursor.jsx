import { useEffect } from 'react'

// subtle sparkle trail — desktop pointers only, respects reduced motion
export default function SparkleCursor() {
  useEffect(() => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let last = 0
    const colors = ['#f9698f', '#C9A24B', '#ffc7d9', '#ec4876']
    const move = (e) => {
      const now = performance.now()
      if (now - last < 70) return
      last = now
      const s = document.createElement('span')
      const size = 6 + Math.random() * 8
      Object.assign(s.style, {
        position: 'fixed', left: `${e.clientX}px`, top: `${e.clientY}px`, width: `${size}px`, height: `${size}px`, pointerEvents: 'none', zIndex: 9999,
        background: colors[(Math.random() * colors.length) | 0], clipPath: 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)',
      })
      document.body.appendChild(s)
      const dx = (Math.random() - 0.5) * 36; const dy = 18 + Math.random() * 28
      const a = s.animate([{ transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 0.9 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0) rotate(160deg)`, opacity: 0 }], { duration: 750, easing: 'ease-out' })
      a.onfinish = () => s.remove()
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return null
}
