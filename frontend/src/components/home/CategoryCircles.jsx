import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ProductArt } from '../../lib/art'
import { useCategories } from '../../lib/hooks'

export default function CategoryCircles() {
  const cats = useCategories()
  const extra = [
    { key: 'new', name: 'New In', to: '/shop?isNew=true', kind: 'accessories', ring: 'from-plum-600 to-plum-800' },
    { key: 'sale', name: 'Sale', to: '/shop?sale=true', kind: 'ornaments', ring: 'from-rose-400 to-rose-600' },
  ]
  const items = [
    ...cats.map((c) => ({ key: c._id, name: c.name, to: `/shop/${c.slug}`, kind: c.slug, ring: 'from-rose-300 via-rose-500 to-gold-400', image: c.image })),
    ...extra,
  ]
  return (
    <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 py-3 sm:mx-0 sm:justify-between sm:gap-4 sm:px-0">
      {(items.length ? items : Array.from({ length: 8 }).map((_, i) => ({ key: i, skeleton: true }))).map((c, idx) =>
        c.skeleton ? (
          <div key={c.key} className="flex shrink-0 flex-col items-center gap-3"><div className="skeleton h-[88px] w-[88px] rounded-full sm:h-[110px] sm:w-[110px]" /><div className="skeleton h-3 w-14 rounded" /></div>
        ) : (
          <motion.div key={c.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Link to={c.to} className="group flex shrink-0 flex-col items-center gap-3">
              <span className={`relative grid h-[88px] w-[88px] place-items-center rounded-full bg-gradient-to-tr p-[3px] transition duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[8deg] group-hover:shadow-lift sm:h-[110px] sm:w-[110px] ${c.ring}`}>
                <span className="h-full w-full overflow-hidden rounded-full border-[3px] border-white bg-white">
                  {c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-cover" /> : <ProductArt kind={c.kind} seed={c.name} className="h-full w-full transition duration-700 group-hover:scale-110" />}
                </span>
              </span>
              <span className="text-[13px] font-medium tracking-wide text-plum-900 transition group-hover:text-rose-500">{c.name}</span>
            </Link>
          </motion.div>
        )
      )}
    </div>
  )
}
