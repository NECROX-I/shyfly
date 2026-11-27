import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiHeart, FiShoppingBag, FiUser, FiMenu, FiX, FiChevronDown, FiTruck, FiShuffle, FiArrowRight } from 'react-icons/fi'
import { useCart, useWishlist, useCompare, useAuth, useUI } from '../store'
import { useCategories, useLockBody, bottomNavHidden } from '../lib/hooks'
import { ProductArt } from '../lib/art'
import ThemeToggle from './ThemeToggle'
import SearchBox from './SearchBox'
import { img } from '../lib/format'

const Badge = ({ n }) => (n > 0 ? <span key={n} className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{n > 99 ? '99+' : n}</span> : null)

// 🍬 candy balance shown next to the theme toggle (phones/tablets) — 12,500 → "12.5k" so it never crowds the bar
const candyLabel = (n) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}k` : n.toLocaleString('en-IN'))

// label of a desktop nav entry (categories carry the dropdown chevron)
const NavLabel = ({ i, open = false }) => i.cat
  ? <span className="inline-flex items-center gap-1">{i.label}<FiChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} /></span>
  : <>{i.label}</>

export default function Navbar() {
  const cats = useCategories()
  const nav = useNavigate()
  const loc = useLocation()
  const cartCount = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0))
  const wishCount = useWishlist((s) => s.ids.length)
  const cmpCount = useCompare((s) => s.items.length)
  const user = useAuth((s) => s.user)
  const { setCart, menuOpen, setMenu } = useUI()
  const [stuck, setStuck] = useState(false)   // true while the pinned bar is actually stuck to the top (→ shadow)
  const [hover, setHover] = useState(null)
  const [openAcc, setOpenAcc] = useState(null)
  const timer = useRef()
  const bar = useRef(null)      // top bar: pinned on phones/tablets, scrolls away on desktop
  const navEl = useRef(null)    // category row: the only part that stays pinned on desktop
  const row = useRef(null)
  const ruler = useRef(null)
  const [hiddenKeys, setHiddenKeys] = useState([])   // desktop nav items that don't fit → tucked into “More”
  const [moreOpen, setMoreOpen] = useState(false)
  useLockBody(menuOpen)

  // The search row (phones) / the logo+search row (desktop) is NOT sticky: it scrolls away with the page.
  // Only the slim bar (phones: menu·logo·bag, desktop: category row) stays pinned. --header-h = height of whatever is pinned,
  // so the Shop filter bar, side panels etc. tuck in right under it.
  useEffect(() => {
    const root = document.documentElement
    const pinnedH = (el) => {
      if (!el) return 0
      const cs = getComputedStyle(el)
      return cs.display !== 'none' && (cs.position === 'sticky' || cs.position === 'fixed') ? Math.round(el.getBoundingClientRect().height) : 0
    }
    let raf = 0
    const sync = () => {
      root.style.setProperty('--header-h', `${pinnedH(bar.current) + pinnedH(navEl.current)}px`)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = [bar.current, navEl.current].find((e) => e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).position === 'sticky')
        setStuck(!!el && window.scrollY > 0 && el.getBoundingClientRect().top <= 0.5)
      })
    }
    sync()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null
    if (bar.current) ro?.observe(bar.current)
    if (navEl.current) ro?.observe(navEl.current)
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('scroll', sync); window.removeEventListener('resize', sync); window.removeEventListener('orientationchange', sync); root.style.removeProperty('--header-h') }
  }, [])
  useEffect(() => { setMenu(false); setHover(null); setMoreOpen(false) }, [loc.pathname])
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const box = [...document.querySelectorAll('input[data-search]')].find((el) => el.offsetParent !== null)
        if (box) { e.preventDefault(); box.focus(); box.select() }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const enter = (slug) => { clearTimeout(timer.current); setHover(slug) }
  const leave = () => { timer.current = setTimeout(() => { setHover(null); setMoreOpen(false) }, 140) }

  // Desktop nav never overflows: items that don't fit the row move into a “More” menu (About/Contact first, then the last categories)
  const navItems = useMemo(() => [
    { k: 'home', label: 'Home', to: '/', end: true },
    ...cats.map((c) => ({ k: c.slug, label: c.name, to: `/shop/${c.slug}`, cat: c })),
    { k: 'new', label: 'New In', to: '/shop?isNew=true', accent: true },
    { k: 'sale', label: 'Sale', to: '/shop?sale=true', accent: true },
    { k: 'about', label: 'About', to: '/about' },
    { k: 'contact', label: 'Contact', to: '/contact' },
  ], [cats])
  useLayoutEffect(() => {
    const r = row.current, m = ruler.current
    if (!r || !m) return
    const calc = () => {
      const cs = getComputedStyle(r)
      const avail = r.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      if (!(avail > 0)) return   // nav is display:none below lg
      const w = {}
      for (const el of m.children) w[el.dataset.k] = el.getBoundingClientRect().width
      const gap = parseFloat(getComputedStyle(m).columnGap) || 0
      const total = (keys, more) => keys.reduce((s, k) => s + (w[k] || 0), 0) + gap * (keys.length - 1 + (more ? 1 : 0)) + (more ? w.__more || 0 : 0)
      const order = ['contact', 'about', ...cats.map((c) => c.slug).reverse(), 'sale', 'new']   // what goes into “More” first
      let shown = navItems.map((i) => i.k)
      const hidden = []
      while (shown.length > 1 && total(shown, hidden.length > 0) > avail) {
        const k = order.find((x) => shown.includes(x))
        if (!k) break
        shown = shown.filter((x) => x !== k); hidden.push(k)
      }
      setHiddenKeys((prev) => (prev.join('|') === hidden.join('|') ? prev : hidden))
    }
    calc()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calc) : null
    ro?.observe(r)
    window.addEventListener('resize', calc)
    document.fonts?.ready?.then(calc)
    return () => { ro?.disconnect(); window.removeEventListener('resize', calc) }
  }, [navItems]) // eslint-disable-line
  const moreItems = navItems.filter((i) => hiddenKeys.includes(i.k))
  const active = cats.find((c) => c.slug === hover)

  const link = 'relative block whitespace-nowrap py-3 text-[11.5px] font-medium uppercase tracking-[.1em] xl:text-[12.5px] xl:tracking-[.2em] text-plum-800 transition hover:text-rose-500 after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-rose-500 after:transition hover:after:scale-x-100'

  const shadow = 'shadow-[0_8px_30px_-12px_rgba(107,21,68,.25)]'
  const onCheckout = loc.pathname.startsWith('/checkout')
  const bagInTabBar = !bottomNavHidden(loc.pathname) // below lg the Bag lives in the bottom tab bar → no duplicate icon up here

  return (
    <>
      {/* top bar — pinned on phones/tablets; on desktop it scrolls away (the category row below stays pinned) */}
      <header ref={bar} className={`land-static sticky top-0 z-40 bg-white transition-shadow duration-300 lg:static lg:z-auto ${stuck ? `${shadow} lg:shadow-none` : ''} ${onCheckout ? 'border-b border-plum-50 lg:border-b-0' : ''}`}>
        <div className="container-x">
          <div className="flex h-[60px] items-center gap-2 sm:h-[68px] sm:gap-4 lg:h-[76px]">
            <button className="-ml-2 p-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Menu"><FiMenu size={24} /></button>

            <Link to="/" className="shrink-0" aria-label="Shyfly home">
              <img src="/logo-mark.png" alt="Shyfly Fashion" className="h-8 w-auto min-[360px]:h-9 sm:h-11 lg:h-[52px]" width="84" height="52" />
            </Link>

            <SearchBox id="search-desktop" className="mx-auto hidden max-w-xl flex-1 lg:block" />

            <div className="ml-auto flex items-center gap-0.5 min-[360px]:gap-1 sm:gap-2 lg:ml-0">
              <Link to="/track" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[12px] uppercase tracking-[.16em] text-plum-800 transition hover:bg-plum-50 xl:flex"><FiTruck size={17} /> Track</Link>
              {typeof user?.candies === 'number' && (
                <Link key={user.candies} to="/account?tab=candy" aria-label={`${user.candies} candies — open My Candy`} className="inline-flex h-8 shrink-0 animate-pop items-center gap-0.5 rounded-full bg-blush px-2 text-[13px] min-[360px]:gap-1 min-[360px]:px-2.5 font-semibold tabular-nums text-plum-800 transition hover:text-rose-500 lg:hidden">
                  <span aria-hidden="true" className="text-[15px] leading-none">🍬</span>{candyLabel(user.candies)}
                </Link>
              )}
              <ThemeToggle className="p-2 transition hover:text-rose-500 min-[360px]:p-2.5" />
              <Link to="/compare" data-tip="Compare" className="tip relative hidden p-2 transition hover:text-rose-500 sm:block" aria-label="Compare"><FiShuffle size={20} /><Badge n={cmpCount} /></Link>
              <Link to="/wishlist" data-tip="Wishlist" className="tip relative p-2 transition hover:text-rose-500 min-[360px]:p-2.5 sm:p-2" aria-label="Wishlist"><FiHeart size={21} /><Badge n={wishCount} /></Link>
              <Link to={user ? '/account' : '/login'} data-tip={user ? `Hi, ${(user.name || 'Me').split(' ')[0]}` : 'Login'} className="tip relative hidden p-2 transition hover:text-rose-500 sm:block" aria-label="Account"><FiUser size={21} /></Link>
              <button onClick={() => setCart(true)} data-tip="Bag" className={`tip relative p-2 transition hover:text-rose-500 min-[360px]:p-2.5 ${bagInTabBar ? 'max-lg:hidden' : ''}`} aria-label="Bag"><FiShoppingBag size={22} /><Badge n={cartCount} /></button>
            </div>
          </div>
        </div>
      </header>

      {/* phones/tablets: search row — NOT sticky, scrolls away and slides under the pinned top bar (z below it so the dropdown never paints over the bar) */}
      {!onCheckout && (
        <div className="relative z-[39] border-b border-plum-50 bg-white lg:hidden">
          <div className="container-x pb-2.5"><SearchBox id="search-mobile" /></div>
        </div>
      )}

      {/* desktop category row */}
      <nav ref={navEl} aria-label="Main" onMouseLeave={leave} className={`sticky top-0 z-40 hidden bg-white/90 backdrop-blur-xl transition-shadow duration-300 lg:block ${stuck ? `border-t border-plum-50 ${shadow}` : 'border-y border-plum-50'}`}>
        {/* invisible ruler: measures every item once so we know how many fit */}
        <div ref={ruler} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 -z-10 flex h-0 w-max gap-4 overflow-hidden whitespace-nowrap xl:gap-7 2xl:gap-9 [&>*]:shrink-0">
          {navItems.map((i) => <span key={i.k} data-k={i.k} className={link}><NavLabel i={i} /></span>)}
          <span data-k="__more" className={link}><span className="inline-flex items-center gap-1">More<FiChevronDown size={12} /></span></span>
        </div>
        <div ref={row} className="container-x flex items-center justify-center gap-4 xl:gap-7 2xl:gap-9">
          {navItems.filter((i) => !hiddenKeys.includes(i.k)).map((i) => i.cat ? (
            <div key={i.k} onMouseEnter={() => enter(i.cat.slug)}>
              <NavLink to={i.to} className={link}><NavLabel i={i} open={hover === i.cat.slug} /></NavLink>
            </div>
          ) : (
            <NavLink key={i.k} to={i.to} end={i.end} onMouseEnter={() => setHover(null)} className={`${link}${i.accent ? ' text-rose-500' : ''}`}>{i.label}</NavLink>
          ))}
          {moreItems.length > 0 && (
            <div className="relative" onMouseEnter={() => setHover(null)}>
              <button type="button" onClick={() => setMoreOpen((v) => !v)} aria-haspopup="menu" aria-expanded={moreOpen} className={link}>
                <span className="inline-flex items-center gap-1">More<FiChevronDown size={12} className={`transition ${moreOpen ? 'rotate-180' : ''}`} /></span>
              </button>
              {moreOpen && (
                <ul role="menu" className="absolute right-0 top-full z-50 mt-0.5 w-60 rounded-2xl border border-plum-100 bg-white p-2 shadow-lift">
                  {moreItems.map((i) => (
                    <li key={i.k} role="none"><Link role="menuitem" to={i.to} className={`block rounded-xl px-4 py-2.5 text-[13px] uppercase tracking-[.12em] transition hover:bg-blush ${i.accent ? 'text-rose-500' : 'text-plum-800'}`}>{i.label}</Link></li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
                      {/* CHANGED: sub-category icon uses uploaded picture, falls back to artwork */}
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full">{s.image ? <img src={img(s.image, 120)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ProductArt kind={active.slug} seed={s.name} className="h-full w-full" />}</span>
                      <span className="text-[15px] text-plum-900 group-hover:text-rose-500">{s.name}</span>
                    </Link>
                  ))}
                </div>
                <Link to={`/shop/${active.slug}?sort=popular`} className="group relative col-span-4 overflow-hidden rounded-2xl">
                  {/* CHANGED: big tile uses the main category picture, falls back to artwork */}
                  {active.image ? <img src={img(active.image, 700)} alt={active.name} className="h-56 w-full object-cover transition duration-700 group-hover:scale-105" /> : <ProductArt kind={active.slug} seed={active.name + 'mega'} className="h-56 w-full transition duration-700 group-hover:scale-105" />}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-plum-900/70 to-transparent p-5 text-white">
                    <p className="text-[11px] uppercase tracking-[.3em] text-gold-300">Trending now</p>
                    <p className="font-display text-2xl font-semibold">Best of {active.name}</p>
                  </div>
                </Link>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>

      {/* mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-plum-950/50 lg:backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-white lg:hidden" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="flex items-center justify-between border-b border-plum-50 p-4">
                <img src="/logo-mark.png" alt="Shyfly" className="h-11 w-auto" />
                <button onClick={() => setMenu(false)} className="p-2" aria-label="Close"><FiX size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {cats.map((c) => (
                  <div key={c._id} className="border-b border-plum-50">
                    <button onClick={() => setOpenAcc(openAcc === c._id ? null : c._id)} className="flex w-full items-center justify-between gap-3 py-4 text-left font-display text-2xl font-semibold text-plum-800">
                      {c.name}<FiChevronDown className={`shrink-0 transition ${openAcc === c._id ? 'rotate-180' : ''}`} />
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
    </>
  )
}
