import { NavLink } from 'react-router-dom'
import { FiHome, FiGrid, FiHeart, FiShoppingBag, FiUser } from 'react-icons/fi'
import { useCart, useWishlist, useUI, useAuth } from '../store'

export default function BottomNav() {
  const cart = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0))
  const wish = useWishlist((s) => s.ids.length)
  const setCart = useUI((s) => s.setCart)
  const user = useAuth((s) => s.user)
  const item = ({ isActive }) => `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-rose-500' : 'text-plum-800/70'}`
  const dot = (n) => n > 0 && <span className="absolute right-[26%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] text-white">{n}</span>
  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-30 flex border-t border-plum-100 bg-white/95 backdrop-blur-xl lg:hidden">
      <NavLink to="/" end className={item}><FiHome size={20} />Home</NavLink>
      <NavLink to="/shop" className={item}><FiGrid size={20} />Shop</NavLink>
      <NavLink to="/wishlist" className={item}><FiHeart size={20} />Wishlist{dot(wish)}</NavLink>
      <button onClick={() => setCart(true)} className={item({ isActive: false })}><FiShoppingBag size={20} />Bag{dot(cart)}</button>
      <NavLink to={user ? '/account' : '/login'} className={item}><FiUser size={20} />Me</NavLink>
    </nav>
  )
}
