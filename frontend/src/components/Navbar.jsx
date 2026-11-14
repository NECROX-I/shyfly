import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX, FiChevronDown, FiTruck, FiShuffle, FiArrowRight } from 'react-icons/fi'
import { useCart, useWishlist, useCompare, useAuth, useUI } from '../store'
import { useCategories, useLockBody } from '../lib/hooks'
import { ProductArt } from '../lib/art'

const Badge = ({ n }) => (n > 0 ? <span key={n} className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{n > 99 ? '99+' : n}</span> : null)

export default function Navbar() {
  const cats = useCategories()
  const nav = useNavigate()
  const loc = useLocation()
  const cartCount = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0))
  const wishCount = useWishlist((s) => s.ids.length)
  const cmpCount = useCompare((s) => s.items.length)
  const user = useAuth((s) => s.user)
  const { setCart, setSearch, menuOpen, setMenu } = useUI()
  const [scrolled, setScrolled] = useState(false)
  const [hover, setHover] = useState(null)
  const [openAcc, setOpenAcc] = useState(null)
  const timer = useRef()
  useLockBody(menuOpen)

  useEffect(() => { const h = () => setScrolled(window.scrollY > 60); h(); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h) }, [])
  useEffect(() => { setMenu(false); setHover(null) }, [loc.pathname])

  const enter = (slug) => { clearTimeout(timer.current); setHover(slug) }
  const leave = () => { timer.current = setTimeout(() => setHover(null), 140) }
  const active = cats.find((c) => c.slug === hover)

  const link = 'relative py-3 text-[12.5px] font-medium uppercase tracking-[.2em] text-plum-800 transition hover:text-rose-500 after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-rose-500 after:transition hover:after:scale-x-100'

  return (
    <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? 'shadow-[0_8px_30px_-12px_rgba(107,21,68,.25)]' : 'border-b border-plum-50'}`} onMouseLeave={leave}>
      <div className="container-x">
        <div className={`flex items-center gap-4 transition-all duration-300 ${scrolled ? 'h-[56px] sm:h-[62px]' : 'h-[60px] sm:h-[76px]'}`}>
          <button className="-ml-2 p-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Menu"><FiMenu size={24} /></button>

          <Link to="/" className="shrink-0" aria-label="Shyfly home">
            <img src="/logo-mark.png" alt="Shyfly" className={`w-auto transition-all duration-300 ${scrolled ? 'h-8 sm:h-10' : 'h-9 sm:h-[52px]'}`} width="84" height="52" />
          </Link>

          <button onClick={() => setSearch(true)} className="mx-auto hidden max-w-xl flex-1 items-center gap-3 rounded-full border border-plum-100 bg-blush px-5 py-2.5 text-left text-sm text-plum-700/60 transition hover:border-rose-300 hover:bg-white hover:shadow-soft md:flex">
            <FiSearch size={17} /> Search for necklaces, kurtis, heels, sunglasses…
          </button>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
            <button onClick={() => setSearch(true)} className="p-2.5 md:hidden" aria-label="Search"><FiSearch size={22} /></button>
            <Link to="/track" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[12px] uppercase tracking-[.16em] text-plum-800 transition hover:bg-plum-50 xl:flex"><FiTruck size={17} /> Track</Link>
            <Link to="/compare" className="relative hidden p-2 transition hover:text-rose-500 sm:block" aria-label="Compare"><FiShuffle size={20} /><Badge n={cmpCount} /></Link>
            <Link to="/wishlist" className="relative hidden p-2 transition hover:text-rose-500 sm:block" aria-label="Wishlist"><FiHeart size={21} /><Badge n={wishCount} /></Link>
            <Link to={user ? '/account' : '/login'} className="hidden p-2 transition hover:text-rose-500 sm:block" aria-label="Account"><FiUser size={21} /></Link>
            <button onClick={() => setCart(true)} className="relative p-2.5 transition hover:text-rose-500" aria-label="Bag"><FiShoppingBag size={22} /><Badge n={cartCount} /></button>
          </div>
        </div>
      </div>

      {/* desktop category row */}
      <nav className="hidden border-t border-plum-50 lg:block">
        <div className="container-x flex items-center justify-center gap-9">
          <NavLink to="/" end className={link}>Home</NavLink>
          {cats.map((c) => (
            <div key={c._id} onMouseEnter={() => enter(c.slug)}>
              <NavLink to={`/shop/${c.slug}`} className={link}>
                <span className="inline-flex items-center gap-1">{c.name}<FiChevronDown size={12} className={`transition ${hover === c.slug ? 'rotate-180' : ''}`} /></span>
              </NavLink>
            </div>
          ))}
          <NavLink to="/shop?isNew=true" onMouseEnter={() => setHover(null)} className={`${link} text-rose-500`}>New In</NavLink>
          <NavLink to="/shop?sale=true" onMouseEnter={() => setHover(null)} className={`${link} text-rose-500`}>Sale</NavLink>
          <NavLink to="/about" onMouseEnter={() => setHover(null)} className={link}>About</NavLink>
          <NavLink to="/contact" onMouseEnter={() => setHover(null)} className={link}>Contact</NavLink>
        </div>
      </nav>

      {/* mega menu */}
      <AnimatePresence>
        {active && (
          <motion.div key="mega" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} onMouseEnter={() => enter(active.slug)}
            className="absolute inset-x-0 top-full hidden border-t border-plum-50 bg-white shadow-lift lg:block">
            <div className="container-x grid grid-cols-12 gap-10 py-9">
              <div className="col-span-3">
                <p className="eyebrow">{active.name}</p>
                <p className="mt-3 font-display text-3xl font-semibold leading-tight text-plum-800">{active.tagline || `Explore ${active.name}`}</p>
                <Link to={`/shop/${active.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-rose-500 hover:gap-3 transition-all">Shop all {active.name} <FiArrowRight /></Link>
              </div>
              <div className="col-span-5 grid grid-cols-2 gap-x-8 gap-y-1">
                {active.children.map((s) => (
                  <Link key={s._id} to={`/shop/${active.slug}/${s.slug}`} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-blush">
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full"><ProductArt kind={active.slug} seed={s.name} className="h-full w-full" /></span>
                    <span className="text-[15px] text-plum-900 group-hover:text-rose-500">{s.name}</span>
                  </Link>
                ))}
              </div>
              <Link to={`/shop/${active.slug}?sort=popular`} className="group relative col-span-4 overflow-hidden rounded-2xl">
                <ProductArt kind={active.slug} seed={active.name + 'mega'} className="h-56 w-full transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-plum-900/70 to-transparent p-5 text-white">
                  <p className="text-[11px] uppercase tracking-[.3em] text-gold-300">Trending now</p>
                  <p className="font-display text-2xl font-semibold">Best of {active.name}</p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-plum-950/50 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-white lg:hidden" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="flex items-center justify-between border-b border-plum-50 p-4">
                <img src="/logo-mark.png" alt="Shyfly" className="h-11 w-auto" />
                <button onClick={() => setMenu(false)} className="p-2" aria-label="Close"><FiX size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {cats.map((c) => (
                  <div key={c._id} className="border-b border-plum-50">
                    <button onClick={() => setOpenAcc(openAcc === c._id ? null : c._id)} className="flex w-full items-center justify-between py-4 font-display text-2xl font-semibold text-plum-800">
                      {c.name}<FiChevronDown className={`transition ${openAcc === c._id ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {openAcc === c._id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <Link to={`/shop/${c.slug}`} className="block py-2 text-sm font-medium text-rose-500">View all</Link>
                          {c.children.map((s) => <Link key={s._id} to={`/shop/${c.slug}/${s.slug}`} className="block py-2 text-[15px] text-plum-900/80">{s.name}</Link>)}
                          <div className="h-3" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  {[['New In', '/shop?isNew=true'], ['Sale', '/shop?sale=true'], ['Track order', '/track'], ['Wishlist', '/wishlist'], ['Compare', '/compare'], ['About us', '/about'], ['Contact', '/contact'], [user ? 'My account' : 'Login', user ? '/account' : '/login']].map(([l, to]) => (
                    <Link key={l} to={to} className="rounded-xl bg-blush px-4 py-3 text-center font-medium text-plum-800">{l}</Link>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
