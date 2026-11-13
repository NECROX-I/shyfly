import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ProductArt } from '../../lib/art'

const BG = ['bg-[#f3e4ec]', 'bg-[#fde9e2]', 'bg-[#e9e2f8]', 'bg-[#fff0cf]']
const TAG = ['bg-plum-700', 'bg-rose-500', 'bg-[#7a5fc0]', 'bg-gold-600']

export default function PromoTiles({ tiles = [] }) {
  return (
    <div className="grid h-full grid-cols-2 gap-3 sm:gap-4">
      {tiles.map((t, i) => (
        <motion.div key={t.tag + i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}>
          <Link to={t.to} className={`group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-[22px] p-4 transition duration-500 hover:-translate-y-1 hover:shadow-lift sm:min-h-[260px] sm:p-5 ${BG[i % 4]}`}>
            <div className="relative z-10">
              <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white ${TAG[i % 4]}`}>{t.tag}</span>
              <h3 className="mt-3 max-w-[11ch] font-display text-[22px] font-semibold leading-[1.05] text-plum-800 sm:text-[28px]">{t.label}</h3>
            </div>
            <p className="relative z-10 text-xs font-medium uppercase tracking-wider text-plum-700/60">{t.sub} →</p>
            <div className="absolute -bottom-4 -right-4 h-28 w-28 text-plum-700/70 transition duration-700 group-hover:-rotate-6 group-hover:scale-110 sm:h-36 sm:w-36"><ProductArt kind={t.kind} glyphOnly className="h-full w-full" /></div>
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/50 blur-xl" />
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
