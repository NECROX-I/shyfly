import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { FiGrid, FiBox, FiShoppingBag, FiLayers, FiTag, FiUsers, FiLogOut, FiMenu, FiExternalLink, FiSettings, FiEdit3, FiShield, FiCornerUpLeft } from 'react-icons/fi'
import { useAuth } from '../../store'

const LINKS = [['dashboard', 'Dashboard', FiGrid], ['orders', 'Orders', FiShoppingBag], ['returns', 'Returns', FiCornerUpLeft], ['products', 'Products', FiBox], ['categories', 'Categories', FiLayers], ['coupons', 'Coupons', FiTag], ['people', 'Customers & messages', FiUsers], ['content', 'Website content', FiEdit3], ['settings', 'Store settings', FiSettings], ['team', 'Team & security', FiShield]]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const cls = ({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition ${isActive ? 'bg-plum-700 text-white shadow-soft' : 'text-plum-800 hover:bg-plum-50'}`
  return (
    <div className="min-h-screen bg-[#faf6f8] lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-plum-100 bg-white p-5 transition lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <img src="/logo-mark.png" alt="Shyfly" className="mb-1 h-12 w-auto" /><p className="mb-6 text-[11px] uppercase tracking-[.25em] text-plum-700/50">Admin panel</p>
        <nav className="space-y-1">{LINKS.map(([to, l, I]) => <NavLink key={to} to={to} className={cls} onClick={() => setOpen(false)}><I size={18} />{l}</NavLink>)}</nav>
        <div className="absolute inset-x-5 bottom-5 space-y-2">
          <Link to="/" target="_blank" className="flex items-center gap-2 px-4 py-2 text-sm text-plum-700 hover:text-rose-500"><FiExternalLink /> View store</Link>
          <button onClick={() => { logout(); nav('/admin/login') }} className="flex w-full items-center gap-2 rounded-xl bg-blush px-4 py-3 text-sm text-plum-800"><FiLogOut /> Log out ({user?.name?.split(' ')[0]})</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-plum-950/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-plum-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden"><button onClick={() => setOpen(true)} aria-label="Menu"><FiMenu size={24} /></button><b className="font-display text-2xl text-plum-800">Shyfly admin</b></div>
        <main className="p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
