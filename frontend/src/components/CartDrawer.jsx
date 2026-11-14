import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiTruck } from 'react-icons/fi'
import { useCart, useUI } from '../store'
import { useConfig, useLockBody } from '../lib/hooks'
import { inr } from '../lib/format'
import ProductImage from './ProductImage'

export function FreeShipBar({ subtotal }) {
  const cfg = useConfig()
  const left = Math.max(0, cfg.freeShippingMin - subtotal)
  const pct = Math.min(100, (subtotal / cfg.freeShippingMin) * 100)
  return (
    <div className="rounded-2xl bg-blush p-4">
      <p className="flex items-center gap-2 text-sm text-plum-800"><FiTruck />{left > 0 ? <>Add <b>{inr(left)}</b> more for <b>free shipping</b></> : <b>🎉 You’ve unlocked free shipping!</b>}</p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-plum-600" initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} />
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const { cartOpen, setCart } = useUI()
  const { items, setQty, remove } = useCart()
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const nav = useNavigate()
  useLockBody(cartOpen)

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="fixed inset-0 z-[55] bg-plum-950/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCart(false)} />
          <motion.aside className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-md flex-col bg-white shadow-2xl" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center justify-between border-b border-plum-50 px-5 py-4">
              <h2 className="font-display text-3xl font-semibold text-plum-800">Your bag <span className="text-lg text-plum-700/50">({items.reduce((a, i) => a + i.qty, 0)})</span></h2>
              <button onClick={() => setCart(false)} className="rounded-full p-2 hover:bg-plum-50" aria-label="Close"><FiX size={22} /></button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-blush text-plum-300"><FiShoppingBag size={38} /></div>
                <p className="font-display text-3xl font-semibold text-plum-800">Your bag is empty</p>
                <p className="text-plum-700/70">Beautiful things are waiting for you.</p>
                <button onClick={() => { setCart(false); nav('/shop') }} className="btn-plum mt-2">Start shopping</button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  <FreeShipBar subtotal={subtotal} />
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.div key={i.key} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }} className="flex gap-4">
                        <Link to={`/product/${i.slug}`} onClick={() => setCart(false)} className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-plum-50">
                          <ProductImage product={{ name: i.name, images: i.image ? [{ url: i.image }] : [], category: i.category }} w={240} className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link to={`/product/${i.slug}`} onClick={() => setCart(false)} className="line-clamp-2 text-[15px] font-medium leading-snug">{i.name}</Link>
                          <p className="mt-1 text-xs text-plum-700/60">{[i.color, i.size && `Size ${i.size}`].filter(Boolean).join(' · ')}</p>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-plum-100">
                              <button onClick={() => setQty(i.key, i.qty - 1)} className="p-2.5 disabled:opacity-30" disabled={i.qty <= 1} aria-label="Less"><FiMinus size={14} /></button>
                              <span className="w-7 text-center text-sm font-medium">{i.qty}</span>
                              <button onClick={() => setQty(i.key, i.qty + 1)} className="p-2.5 disabled:opacity-30" disabled={i.qty >= (i.max || 10)} aria-label="More"><FiPlus size={14} /></button>
                            </div>
                            <p className="font-semibold text-plum-800">{inr(i.price * i.qty)}</p>
                          </div>
                        </div>
                        <button onClick={() => remove(i.key)} className="self-start p-2 text-plum-300 transition hover:text-rose-500" aria-label="Remove"><FiTrash2 size={16} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="safe-b border-t border-plum-50 p-5">
                  <div className="mb-1 flex justify-between text-[15px]"><span>Subtotal</span><b className="text-lg text-plum-800">{inr(subtotal)}</b></div>
                  <p className="mb-4 text-xs text-plum-700/60">Shipping & coupons calculated at checkout</p>
                  <button onClick={() => { setCart(false); nav('/checkout') }} className="btn-plum btn-sheen w-full">Checkout</button>
                  <button onClick={() => { setCart(false); nav('/cart') }} className="mt-3 w-full text-center text-sm text-plum-700 underline-offset-4 hover:underline">View full bag</button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
