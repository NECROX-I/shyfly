import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiHeart, FiEye, FiShuffle } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import ProductImage from './ProductImage'
import Stars from './Stars'
import { useWishlist, useCompare, useUI } from '../store'
import { inr, discountPct, totalStock } from '../lib/format'

function ProductCard({ product: p, priority = false }) {
  const wished = useWishlist((s) => s.ids.includes(p._id))
  const toggleWish = useWishlist((s) => s.toggle)
  const inCompare = useCompare((s) => s.items.some((i) => i._id === p._id))
  const toggleCompare = useCompare((s) => s.toggle)
  const setQuickView = useUI((s) => s.setQuickView)
  const [pop, setPop] = useState(false)
  const off = discountPct(p)
  const soldOut = totalStock(p) === 0
  const hasSecond = !!p.images?.[1]?.url
  const swatches = [...new Map((p.variants || []).filter((v) => v.colorHex).map((v) => [v.color, v])).values()].slice(0, 5)

  const onWish = (e) => {
    e.preventDefault(); e.stopPropagation()
    const added = toggleWish(p._id)
    setPop(true); setTimeout(() => setPop(false), 450)
    toast(added ? 'Added to wishlist 💗' : 'Removed from wishlist', { icon: added ? undefined : '🤍' })
  }
  const onCompare = (e) => {
    e.preventDefault(); e.stopPropagation()
    const r = toggleCompare(p)
    if (r === 'full') toast.error('You can compare up to 4 items')
    else toast(r === 'added' ? 'Added to compare' : 'Removed from compare')
  }
  const onQuick = (e) => { e.preventDefault(); e.stopPropagation(); setQuickView(p) }

  return (
    <motion.article layout="position" className="group relative">
      <Link to={`/product/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-plum-50">
          <ProductImage product={p} w={600} className={`absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.07] ${hasSecond ? 'group-hover:opacity-0' : ''}`} />
          {hasSecond && <ProductImage product={p} index={1} w={600} className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-700 group-hover:scale-100 group-hover:opacity-100" />}

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {off > 0 && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">{off}% off</span>}
            {p.isNewArrival && !off && <span className="rounded-full bg-plum-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">New</span>}
          </div>

          <button onClick={onWish} aria-label="Wishlist" className={`absolute right-2.5 top-2.5 grid h-10 w-10 sm:right-3 sm:top-3 sm:h-9 sm:w-9 place-items-center rounded-full bg-white/90 shadow backdrop-blur transition hover:scale-110 ${pop ? 'animate-pop' : ''}`}>
            {wished ? <FaHeart className="text-rose-500" size={15} /> : <FiHeart className="text-plum-700" size={16} />}
          </button>

          <div className="absolute right-3 top-14 flex translate-x-12 flex-col gap-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 max-lg:hidden">
            <button onClick={onQuick} aria-label="Quick view" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow backdrop-blur hover:scale-110 hover:bg-plum-700 hover:text-white"><FiEye size={15} /></button>
            <button onClick={onCompare} aria-label="Compare" className={`grid h-9 w-9 place-items-center rounded-full shadow backdrop-blur hover:scale-110 ${inCompare ? 'bg-plum-700 text-white' : 'bg-white/90 hover:bg-plum-700 hover:text-white'}`}><FiShuffle size={15} /></button>
          </div>

          {!soldOut && (
            <button onClick={onQuick} className="absolute inset-x-3 bottom-3 translate-y-14 rounded-full bg-white/95 py-2.5 text-[11px] font-medium uppercase tracking-[.18em] text-plum-800 shadow backdrop-blur transition duration-300 group-hover:translate-y-0 max-lg:hidden">
              Quick add
            </button>
          )}
          {soldOut && <div className="absolute inset-0 grid place-items-center bg-white/60 text-xs font-semibold uppercase tracking-[.25em] text-plum-800 backdrop-blur-[1px]">Sold out</div>}
        </div>

        <div className="mt-3 px-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[11px] uppercase tracking-[.18em] text-plum-700/55">{p.subCategory?.name || p.category?.name}</p>
            <div className="flex -space-x-1">{swatches.map((s) => <span key={s.color} title={s.color} className="h-3.5 w-3.5 rounded-full border border-white ring-1 ring-plum-100" style={{ background: s.colorHex }} />)}</div>
          </div>
          <h3 className="mt-1 line-clamp-1 font-body text-[15px] font-medium text-plum-950">{p.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[15px] font-semibold text-plum-800">{inr(p.price)}</span>
            {off > 0 && <span className="text-sm text-plum-700/45 line-through">{inr(p.mrp)}</span>}
            {p.rating?.count > 0 && <Stars value={p.rating.avg} size={10} className="ml-auto" />}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

export default memo(ProductCard)
