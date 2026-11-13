import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { ProductArt, Butterfly, Sparkle } from '../../lib/art'

const BGS = ['from-plum-900 via-plum-700 to-rose-500', 'from-rose-500 via-plum-600 to-plum-900', 'from-plum-700 via-plum-800 to-plum-950']
const DUR = 6

export default function HeroCarousel({ slides: raw = [] }) {
  const SLIDES = raw.map((x, k) => ({ ...x, bg: BGS[k % BGS.length], title: [x.title1, x.title2].filter(Boolean) }))
  const [i, setI] = useState(0)
  const box = useRef(null)
  const mx = useMotionValue(0); const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }); const sy = useSpring(my, { stiffness: 60, damping: 18 })
  const tx1 = useTransform(sx, (v) => v * 26); const ty1 = useTransform(sy, (v) => v * 26)
  const tx2 = useTransform(sx, (v) => v * -40); const ty2 = useTransform(sy, (v) => v * -30)

  useEffect(() => { if (SLIDES.length < 2) return; const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), DUR * 1000); return () => clearTimeout(t) }, [i, SLIDES.length])

  const onMove = (e) => {
    const r = box.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const go = (d) => setI((n) => (n + d + SLIDES.length) % SLIDES.length)
  const s = SLIDES[i % Math.max(1, SLIDES.length)]
  if (!s) return null

  return (
    <div ref={box} onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0) }} className="group relative isolate h-full min-h-[440px] overflow-hidden rounded-[28px] text-white sm:min-h-[560px]">
      <AnimatePresence mode="sync">
        <motion.div key={i} className={`absolute inset-0 bg-gradient-to-br ${s.bg}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15} onDragEnd={(_, info) => { if (info.offset.x < -70) go(1); else if (info.offset.x > 70) go(-1) }}>
          <div className="absolute inset-0 bg-petal opacity-40" />
          <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

          <div className="container-x relative flex h-full max-w-none flex-col-reverse items-center justify-end gap-2 px-6 pb-14 pt-8 sm:px-12 md:flex-row md:justify-between">
            <div className="z-10 w-full max-w-lg text-center md:text-left">
              <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[11px] font-medium uppercase tracking-[.38em] text-gold-300">{s.eyebrow}</motion.p>
              <h1 className="mt-3 font-display text-[44px] font-semibold leading-[.98] sm:text-7xl">
                {s.title.map((line, k) => (
                  <span key={line} className="block overflow-hidden"><motion.span className={`block ${k === 1 ? 'italic text-rose-100' : ''}`} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.25 + k * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>{line}</motion.span></span>
                ))}
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/80 md:mx-0">{s.sub}</motion.p>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-7">
                <Link to={s.to} className="btn-white btn-sheen group/b">{s.cta}<FiArrowRight className="transition group-hover/b:translate-x-1" /></Link>
              </motion.div>
            </div>

            <div className="relative grid h-56 w-56 shrink-0 place-items-center sm:h-80 sm:w-80 md:h-[400px] md:w-[400px]">
              <motion.div style={{ x: tx2, y: ty2 }} className="absolute inset-0 rounded-full border border-dashed border-white/30 [animation:spin_40s_linear_infinite]" />
              <motion.div style={{ x: tx1, y: ty1 }} className="absolute inset-5 grid place-items-center rounded-full bg-white/10 shadow-[inset_0_0_60px_rgba(255,255,255,.15)] backdrop-blur-sm sm:inset-8">
                {s.image ? <img src={s.image} alt={s.title.join(' ')} className="h-full w-full rounded-full object-cover" /> : <div className="h-3/5 w-3/5 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,.25)]"><ProductArt kind={s.kind} glyphOnly className="h-full w-full" /></div>}
              </motion.div>
              <motion.div style={{ x: tx2, y: ty2 }} className="absolute -right-2 top-2 w-20 animate-float sm:w-28"><Butterfly /></motion.div>
              <motion.div style={{ x: tx1, y: ty1 }} className="absolute bottom-6 left-0"><Sparkle className="h-7 w-7 animate-float text-gold-300 sm:h-9 sm:w-9" /></motion.div>
              <Sparkle className="absolute right-6 bottom-12 h-5 w-5 animate-pulse text-white/80" />
              <Sparkle className="absolute left-10 top-4 h-4 w-4 animate-pulse text-rose-200" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {SLIDES.length > 1 && <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2">
        {SLIDES.map((_, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className="relative h-1.5 w-12 overflow-hidden rounded-full bg-white/25">
            {k === i && <motion.span key={`p${i}`} className="absolute inset-y-0 left-0 bg-white" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: DUR, ease: 'linear' }} />}
            {k < i && <span className="absolute inset-0 bg-white" />}
          </button>
        ))}
      </div>}
      <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100 md:block"><FiChevronLeft size={20} /></button>
      <button onClick={() => go(1)} aria-label="Next" className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100 md:block"><FiChevronRight size={20} /></button>
    </div>
  )
}
