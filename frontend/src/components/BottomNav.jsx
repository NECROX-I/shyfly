import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FiHome, FiGrid, FiGift, FiShoppingBag, FiUser } from 'react-icons/fi'
import { useCart, useUI, useAuth } from '../store'
import { useCssVarHeight, bottomNavHidden } from '../lib/hooks'
import ReferSheet from './ReferSheet'

export default function BottomNav() {
  const cart = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0))
  const setCart = useUI((s) => s.setCart)
  const user = useAuth((s) => s.user)
  const { pathname } = useLocation()
  const [refer, setRefer] = useState(false)
  const hidden = bottomNavHidden(pathname)   // checkout + product pages have their own sticky action bar
  const bar = useRef(null)
  useCssVarHeight(bar, '--bnav-h', [hidden])
  if (hidden) return null
  const item = ({ isActive }) => `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-rose-500' : 'text-plum-800/70'}`
  const dot = (n) => n > 0 && <span className="bn-dot absolute right-[26%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] text-white">{n}</span>
  return (
    <>
      <nav ref={bar} className="bnav safe-b fixed inset-x-0 bottom-0 z-30 flex border-t border-plum-100 bg-white lg:bg-white/95 lg:backdrop-blur-xl lg:hidden">
        <NavLink to="/" end className={item}><FiHome size={20} />Home</NavLink>
        <NavLink to="/shop" className={item}><FiGrid size={20} />Shop</NavLink>
        {/* wishlist lives in the top bar now — this slot is Refer & Earn (opens a sheet, no need to visit Account) */}
        <button onClick={() => setRefer(true)} className={item({ isActive: false })}><FiGift size={20} />Refer</button>
        <button onClick={() => setCart(true)} className={item({ isActive: false })}><FiShoppingBag size={20} />Bag{dot(cart)}</button>
        <NavLink to={user ? '/account' : '/login'} className={item}><FiUser size={20} />Me</NavLink>
      </nav>
      <ReferSheet open={refer} onClose={() => setRefer(false)} />
    </>
  )
}
