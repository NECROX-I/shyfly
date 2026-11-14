import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiX } from 'react-icons/fi'
import { useUI, useCart } from '../store'
import { useLockBody } from '../lib/hooks'
import { inr, discountPct } from '../lib/format'
import ProductImage from './ProductImage'
import VariantPicker, { useVariants } from './VariantPicker'
import Stars from './Stars'

function Body({ p, close }) {
  const v = useVariants(p)
  const add = useCart((s) => s.add)
  const setCart = useUI((s) => s.setCart)
  const [shake, setShake] = useState(false)
  const off = discountPct(p)

  const submit = () => {
    if (v.needsSize) { setShake(true); setTimeout(() => setShake(false), 600); return toast.error('Please choose a size') }
    if (!v.variant || v.variant.stock < 1) return toast.error('This combination is out of stock')
    add(p, v.variant, 1); close(); setCart(true)
  }

  return (
    <div className="grid max-h-[90dvh] overflow-y-auto sm:grid-cols-2">
      <div className="aspect-[4/3] bg-plum-50 sm:aspect-auto sm:min-h-[460px]"><ProductImage product={p} w={800} className="h-full w-full object-cover" /></div>
      <div className="flex flex-col p-6 sm:p-8">
        <p className="eyebrow">{p.subCategory?.name || p.category?.name}</p>
        <h2 className="mt-2 font-display text-4xl font-semibold leading-tight text-plum-800">{p.name}</h2>
        {p.rating?.count > 0 && <Stars value={p.rating.avg} count={p.rating.count} className="mt-2" />}
        <div className="mt-3 flex items-baseline gap-3"><span className="text-2xl font-semibold text-plum-800">{inr(p.price)}</span>{off > 0 && <><span className="text-plum-700/50 line-through">{inr(p.mrp)}</span><span className="text-sm font-medium text-rose-500">{off}% off</span></>}</div>
        <div className="my-6"><VariantPicker v={v} shake={shake} /></div>
        <div className="mt-auto flex gap-3">
          <button onClick={submit} className="btn-plum btn-sheen flex-1">Add to bag</button>
          <Link to={`/product/${p.slug}`} onClick={close} className="btn-outline">Details</Link>
        </div>
      </div>
    </div>
  )
}

export default function QuickView() {
  const { quickView, setQuickView } = useUI()
  useLockBody(!!quickView)
  const close = () => setQuickView(null)
  return (
    <AnimatePresence>
      {quickView && (
        <motion.div className="fixed inset-0 z-[58] grid place-items-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-plum-950/55 backdrop-blur-sm" onClick={close} />
          <motion.div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl" initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <button onClick={close} className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-plum-50" aria-label="Close"><FiX size={20} /></button>
            <Body p={quickView} close={close} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
