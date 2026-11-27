import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiHeart, FiShuffle, FiShare2, FiMinus, FiPlus, FiTruck, FiRefreshCw, FiShield, FiChevronRight, FiChevronDown, FiCheck, FiMapPin } from 'react-icons/fi'
import { FaHeart, FaWhatsapp, FaStar, FaRegStar } from 'react-icons/fa'
import SEO from '../components/SEO'
import ProductImage from '../components/ProductImage'
import ProductCard from '../components/ProductCard'
import VariantPicker, { useVariants } from '../components/VariantPicker'
import Stars from '../components/Stars'
import Reveal from '../components/Reveal'
import { PageLoader } from '../components/Skeletons'
import { shopAPI } from '../services/api'
import { useCart, useWishlist, useCompare, useRecent, useUI, useAuth } from '../store'
import { useConfig } from '../lib/hooks'
import { inr, discountPct, errMsg, fmtDate, waLink, img } from '../lib/format'
import { SITE_URL, BRAND, abs, clip } from '../lib/site'

function Gallery({ p }) {
  const n = Math.max(p.images?.length || 0, 1)
  const slots = p.images?.length ? p.images : [null, null, null, null]
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const hasReal = !!p.images?.length
  useEffect(() => setI(0), [p._id])
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }) }
  const count = hasReal ? n : 4

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      <div className="no-scrollbar flex gap-3 overflow-x-auto lg:max-h-[640px] lg:flex-col lg:overflow-y-auto">
        {Array.from({ length: count }).map((_, k) => (
          <button key={k} onClick={() => setI(k)} className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition lg:h-24 lg:w-[76px] ${i === k ? 'border-plum-700' : 'border-transparent opacity-70 hover:opacity-100'}`}>
            <ProductImage product={p} index={k} w={160} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden rounded-3xl bg-plum-50" onMouseEnter={() => hasReal && setZoom(true)} onMouseLeave={() => setZoom(false)} onMouseMove={move}>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="aspect-[4/5] w-full"
            drag={count > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(_, info) => { if (info.offset.x < -60) setI((x) => (x + 1) % count); if (info.offset.x > 60) setI((x) => (x - 1 + count) % count) }}>
            <ProductImage product={p} index={i} w={1000} className="h-full w-full object-cover transition-transform duration-200" alt={p.name} />
            {zoom && hasReal && <div className="pointer-events-none absolute inset-0 hidden bg-no-repeat lg:block" style={{ backgroundImage: `url(${img(p.images[i]?.url, 1400)})`, backgroundSize: '220%', backgroundPosition: `${pos.x}% ${pos.y}%` }} />}
          </motion.div>
        </AnimatePresence>
        {discountPct(p) > 0 && <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">{discountPct(p)}% off</span>}
      </div>
    </div>
  )
}

// phones (< md) get an edge-to-edge swipe carousel with dots instead of the desktop gallery (thumbnail strip + hover zoom)
function useIsPhone() {
  const q = '(max-width: 767.98px)'
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const mq = window.matchMedia(q); const h = () => setM(mq.matches); h(); mq.addEventListener?.('change', h); return () => mq.removeEventListener?.('change', h) }, [])
  return m
}

function PhoneGallery({ p }) {
  const box = useRef(null)
  const [i, setI] = useState(0)
  const count = p.images?.length || 4
  useEffect(() => { setI(0); box.current?.scrollTo({ left: 0 }) }, [p._id])
  const onScroll = () => { const el = box.current; if (el && el.clientWidth) setI(Math.round(el.scrollLeft / el.clientWidth)) }
  const go = (k) => box.current?.scrollTo({ left: k * box.current.clientWidth, behavior: 'smooth' })
  return (
    <div className="relative -mx-4 bg-plum-50 sm:-mx-6">
      <div ref={box} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
        {Array.from({ length: count }).map((_, k) => (
          <div key={k} className="aspect-[4/5] max-h-[62svh] w-full shrink-0 snap-center">
            <ProductImage product={p} index={k} w={900} sizes="100vw" priority={k === 0} className="h-full w-full object-cover" alt={k === 0 ? p.name : `${p.name} – photo ${k + 1}`} />
          </div>
        ))}
      </div>
      {discountPct(p) > 0 && <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{discountPct(p)}% off</span>}
      {count > 1 && (
        <>
          <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white">{i + 1}/{count}</span>
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            {Array.from({ length: count }).map((_, k) => <button key={k} type="button" onClick={() => go(k)} aria-label={`Photo ${k + 1}`} className="px-1 py-2"><span className={`block h-1.5 rounded-full shadow transition-all ${i === k ? 'w-5 bg-white' : 'w-1.5 bg-white/65'}`} /></button>)}
          </div>
        </>
      )}
    </div>
  )
}

function Accordion({ title, children, open: o = false }) {
  const [open, setOpen] = useState(o)
  return (
    <div className="border-b border-plum-100">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-[13px] font-medium uppercase tracking-[.18em] text-plum-800">{title}<FiChevronDown className={`transition ${open ? 'rotate-180' : ''}`} /></button>
      <AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="pb-5 text-[15px] leading-relaxed text-plum-900/75">{children}</div></motion.div>}</AnimatePresence>
    </div>
  )
}

function Delivery() {
  const [pin, setPin] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const check = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(pin)) return toast.error('Enter a valid 6-digit pincode')
    setBusy(true)
    try { const r = await shopAPI.pincode(pin); setRes(r.data) } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  const d = (x) => new Date(x).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className="rounded-2xl bg-blush p-4">
      <p className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[.18em] text-plum-800"><FiMapPin /> Check delivery</p>
      <form onSubmit={check} className="flex gap-2">
        <input value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setRes(null) }} inputMode="numeric" placeholder="Enter pincode" className="input min-w-0 flex-1 !rounded-full !py-2.5" />
        <button disabled={busy} className="btn-plum shrink-0 !px-6 !py-2.5">{busy ? '…' : 'Check'}</button>
      </form>
      {res && (res.serviceable
        ? <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-start gap-2 text-sm text-plum-900"><FiCheck className="mt-0.5 shrink-0 text-green-600" /><span>Delivery by <b>{d(res.from)} – {d(res.to)}</b>{res.zone ? ` (${res.zone})` : ''}. {res.cod ? 'Cash on Delivery available.' : 'Online payment only.'}</span></motion.p>
        : <p className="mt-3 text-sm text-rose-600">{res.reason}</p>)}
    </div>
  )
}

function ReviewCard({ r }) {
  const initial = (r.name || '?').trim().charAt(0).toUpperCase()
  return (
    <Reveal className="rounded-2xl border border-plum-100 bg-white p-5 shadow-soft transition-shadow duration-300 hover:shadow-lift sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-plum-700 to-rose-500 font-display text-xl font-semibold text-white" aria-hidden="true">{initial}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold capitalize text-plum-900">{r.name}</p>
            {r.verified && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"><FiCheck size={11} /> Verified buyer</span>}
          </div>
          <p className="mt-0.5 text-xs text-plum-700/55">{fmtDate(r.createdAt)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        <Stars value={r.rating} size={15} />
        <span className="text-sm font-semibold text-plum-800">{Number(r.rating).toFixed(1)}</span>
      </div>
      {r.title && <p className="mt-2.5 text-[17px] font-semibold leading-snug text-plum-900 first-letter:uppercase">{r.title}</p>}
      {r.comment && <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-plum-900/80 first-letter:uppercase">{r.comment}</p>}
    </Reveal>
  )
}

function Reviews({ p, onChange }) {
  const user = useAuth((s) => s.user)
  const [data, setData] = useState({ reviews: [], distribution: {} })
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })
  const [busy, setBusy] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [writing, setWriting] = useState(false)
  const load = () => shopAPI.reviews(p._id).then((r) => setData(r.data)).catch(() => {})
  useEffect(() => { load() }, [p._id]) // eslint-disable-line
  const total = Object.values(data.distribution).reduce((a, b) => a + b, 0)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { const r = await shopAPI.addReview(p._id, form); toast.success('Thank you for your review 💗'); setForm({ rating: 5, title: '', comment: '' }); load(); onChange?.(r.data.rating) }
    catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  return (
    <section id="reviews" className="mt-12 grid gap-8 sm:mt-20 sm:gap-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="eyebrow">Reviews</p><h2 className="h-section mt-2 max-md:!text-[28px]">What women say</h2>
        {p.rating?.count > 0 && (
          <div className="mt-4 flex items-center gap-4 sm:mt-6 sm:gap-5">
            <div className="font-display text-5xl font-semibold text-plum-800 sm:text-7xl">{p.rating.avg}</div>
            <div><Stars value={p.rating.avg} size={16} /><p className="mt-1 text-sm text-plum-700/60">{p.rating.count} ratings</p></div>
          </div>
        )}
        <div className="mt-5 space-y-1.5">{[5, 4, 3, 2, 1].map((s) => <div key={s} className="flex items-center gap-3 text-xs"><span className="w-3">{s}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-plum-100"><div className="h-full rounded-full bg-gold-500" style={{ width: `${total ? ((data.distribution[s] || 0) / total) * 100 : 0}%` }} /></div><span className="w-6 text-right text-plum-700/60">{data.distribution[s] || 0}</span></div>)}</div>

        <button type="button" onClick={() => setWriting((w) => !w)} aria-expanded={writing} className="btn-outline btn-cta mt-5 w-full lg:hidden">{writing ? 'Close' : 'Write a review'}</button>
        <form onSubmit={submit} className={`mt-5 rounded-2xl bg-blush p-5 lg:mt-8 ${writing ? '' : 'max-lg:hidden'}`}>
          <p className="font-display text-2xl font-semibold text-plum-800">Write a review</p>
          {!user ? <p className="mt-2 text-sm text-plum-800/70"><Link to="/login" state={{ from: `/product/${p.slug}` }} className="font-medium text-rose-500 underline">Log in</Link> to share your experience.</p> : (
            <>
              <div className="-ml-1 mt-2 flex">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={form.rating >= n} className="grid h-11 w-11 place-items-center text-gold-500">{form.rating >= n ? <FaStar size={26} /> : <FaRegStar size={26} />}</button>)}</div>
              <input className="input mt-3" placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
              <textarea className="input mt-3" rows={3} placeholder="How was it?" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} maxLength={1500} />
              <button disabled={busy} className="btn-plum mt-3 w-full">{busy ? 'Posting…' : 'Post review'}</button>
            </>
          )}
        </form>
      </div>
      <div className="space-y-5 lg:col-span-8">
        {data.reviews.length === 0 && <p className="rounded-2xl border border-dashed border-plum-200 p-10 text-center text-plum-700/70">No reviews yet — be the first to share one.</p>}
        {(showAll ? data.reviews : data.reviews.slice(0, 4)).map((r) => <ReviewCard key={r._id} r={r} />)}
        {data.reviews.length > 4 && <button onClick={() => setShowAll((v) => !v)} className="btn-outline btn-cta mx-auto flex">{showAll ? 'Show fewer reviews' : `Show all ${data.reviews.length} reviews`}</button>}
      </div>
    </section>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const nav = useNavigate()
  const cfg = useConfig()
  const [p, setP] = useState(null)
  const [err, setErr] = useState(false)
  const [rel, setRel] = useState({ products: [], look: [] })
  const [recent, setRecent] = useState([])
  const [qty, setQty] = useState(1)
  const [shake, setShake] = useState(false)
  const [added, setAdded] = useState(false)
  const [stickyOn, setStickyOn] = useState(false)
  const ctaRef = useRef(null)
  const pickerRef = useRef(null)
  const phone = useIsPhone()
  const add = useCart((s) => s.add)
  const setCart = useUI((s) => s.setCart)
  const wished = useWishlist((s) => (p ? s.ids.includes(p._id) : false))
  const toggleWish = useWishlist((s) => s.toggle)
  const inCompare = useCompare((s) => (p ? s.items.some((i) => i._id === p._id) : false))
  const toggleCompare = useCompare((s) => s.toggle)
  const { ids: recentIds, push } = useRecent()
  const v = useVariants(p)

  useEffect(() => {
    setP(null); setErr(false); setQty(1)
    shopAPI.one(slug).then((r) => { setP(r.data.product); push(r.data.product._id) }).catch(() => setErr(true))
    shopAPI.related(slug).then((r) => setRel(r.data)).catch(() => {})
  }, [slug]) // eslint-disable-line
  useEffect(() => { const ids = recentIds.filter((i) => i !== p?._id).slice(0, 6); if (ids.length && p) shopAPI.byIds(ids).then((r) => setRecent(ids.map((id) => r.data.products.find((x) => x._id === id)).filter(Boolean))).catch(() => {}) }, [p?._id]) // eslint-disable-line
  useEffect(() => { const el = ctaRef.current; if (!el) return; const io = new IntersectionObserver(([e]) => setStickyOn(!e.isIntersecting && e.boundingClientRect.top < 0)); io.observe(el); return () => io.disconnect() }, [p])

  if (err) return <div className="container-x py-32 text-center"><p className="font-display text-5xl font-semibold text-plum-800">Product not found</p><Link to="/shop" className="btn-plum mt-8">Continue shopping</Link></div>
  if (!p) return <PageLoader />

  const off = discountPct(p)
  const stockLeft = v.variant?.stock
  const submit = (buyNow = false) => {
    if (v.needsSize) { setShake(true); setTimeout(() => setShake(false), 600); pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return toast.error('Please choose a size') }
    if (!v.variant || v.variant.stock < 1) return toast.error('This combination is out of stock')
    add(p, v.variant, qty)
    if (buyNow) return nav('/checkout')
    setAdded(true); setTimeout(() => setAdded(false), 1400); setCart(true)
  }
  const wish = () => { const a = toggleWish(p._id); toast(a ? 'Added to wishlist 💗' : 'Removed from wishlist') }
  const share = async () => {
    const data = { title: p.name, text: `Look what I found on Shyfly: ${p.name}`, url: window.location.href }
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); toast.success('Link copied') } } catch (_) {}
  }
  const sizeText = v.sizes.length && v.size ? ` (size ${v.size})` : ''
  const colorText = v.color ? `, ${v.color}` : ''
  const allSold = p.variants.every((x) => x.stock === 0)
  const pageUrl = `${SITE_URL}/product/${p.slug}`
  const crumbs = [['Home', `${SITE_URL}/`], p.category && [p.category.name, `${SITE_URL}/shop/${p.category.slug}`], p.category && p.subCategory && [p.subCategory.name, `${SITE_URL}/shop/${p.category.slug}/${p.subCategory.slug}`], [p.name, pageUrl]].filter(Boolean)
  const productLd = [{
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, url: pageUrl,
    description: clip(p.description, 500) || p.name,
    image: (p.images || []).map((i) => abs(i.url)).filter(Boolean),
    sku: p.variants?.find((x) => x.sku)?.sku || String(p._id),
    brand: { '@type': 'Brand', name: p.brand || 'Shyfly' },
    ...(p.category?.name && { category: p.category.name }),
    offers: { '@type': 'Offer', url: pageUrl, priceCurrency: 'INR', price: p.price, itemCondition: 'https://schema.org/NewCondition', availability: allSold ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', seller: { '@type': 'Organization', name: BRAND } },
    ...(p.rating?.count > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.avg, reviewCount: p.rating.count } }),
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  }]

  return (
    <>
      <SEO title={p.name} type="product" description={clip(p.description) || `${p.name} – ${inr(p.price)} at Shyfly Fashion. Free shipping, Cash on Delivery & easy returns.`} image={p.images?.[0]?.url} jsonLd={productLd} />
      <div className="container-x py-6 max-md:pt-0 sm:py-10">
        <nav className="-mt-2 mb-4 flex max-md:hidden flex-wrap items-center gap-x-1.5 text-xs uppercase tracking-wider text-plum-700/60">
          <Link to="/" className="inline-block py-2 hover:text-rose-500">Home</Link><FiChevronRight size={12} />
          <Link to={`/shop/${p.category?.slug}`} className="inline-block py-2 hover:text-rose-500">{p.category?.name}</Link>
          {p.subCategory && <><FiChevronRight size={12} /><Link to={`/shop/${p.category?.slug}/${p.subCategory.slug}`} className="inline-block py-2 hover:text-rose-500">{p.subCategory.name}</Link></>}
        </nav>

        <div className="grid gap-5 md:grid-cols-2 md:gap-8 sm:landscape:grid-cols-2 sm:landscape:gap-6 lg:gap-10 xl:gap-16">
          <div className="stick-md mx-auto w-full">{phone ? <PhoneGallery p={p} /> : <Gallery p={p} />}</div>

          <div>
            <p className="eyebrow">{p.brand}</p>
            <h1 className="mt-1 font-display text-[24px] font-semibold leading-snug text-plum-800 sm:mt-2 sm:text-4xl sm:leading-tight lg:text-5xl [@media(max-height:520px)]:!text-3xl">{p.name}</h1>
            {p.rating?.count > 0 && <a href="#reviews" className="mt-1 inline-flex items-center gap-2 py-2.5"><Stars value={p.rating.avg} size={15} /><span className="text-sm text-plum-700/70 underline underline-offset-4">{p.rating.avg} · {p.rating.count} reviews</span></a>}
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:mt-5">
              <span className="text-[28px] font-semibold text-plum-800 sm:text-3xl">{inr(p.price)}</span>
              {off > 0 && <><span className="text-base text-plum-700/50 line-through sm:text-lg">{inr(p.mrp)}</span><span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[13px] font-semibold text-rose-500 sm:px-3 sm:py-1 sm:text-sm">Save {inr(p.mrp - p.price)} ({off}%)</span></>}
            </div>
            <p className="mt-1 text-xs text-plum-700/60">Inclusive of all taxes</p>

            <p className="mt-6 leading-relaxed text-plum-900/80 max-md:hidden">{p.description}</p>

            <div ref={pickerRef} className="my-4 scroll-mt-[calc(var(--header-h,60px)+12px)] border-y border-plum-100 py-4 sm:my-7 sm:py-7"><VariantPicker v={v} shake={shake} /></div>

            <div ref={ctaRef}>
              {allSold ? <div className="rounded-2xl bg-plum-50 p-5 text-center font-medium text-plum-800">Sold out — <Link to={`/shop/${p.category?.slug}`} className="underline">see similar</Link></div> : (
                <>
                  <div className="max-w-[400px] max-md:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-10 shrink-0 items-center rounded-full border border-plum-200">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-full w-8 place-items-center" aria-label="Less"><FiMinus size={14} /></button>
                        <span className="w-6 text-center text-sm font-medium">{qty}</span>
                        <button onClick={() => setQty(Math.min(stockLeft ? Math.min(10, stockLeft) : 10, qty + 1))} className="grid h-full w-8 place-items-center" aria-label="More"><FiPlus size={14} /></button>
                      </div>
                      <button onClick={() => { const a = toggleWish(p._id); toast(a ? 'Added to wishlist 💗' : 'Removed from wishlist') }} aria-label="Wishlist" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-plum-200 transition hover:border-rose-400">{wished ? <FaHeart className="text-rose-500" size={18} /> : <FiHeart size={19} />}</button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button onClick={() => submit(false)} className={`btn-plum btn-cta btn-sheen w-full ${added ? '!bg-green-600' : ''}`}>{added ? <><FiCheck size={16} /> Added</> : 'Add to bag'}</button>
                      <button onClick={() => submit(true)} className="btn-rose btn-cta w-full">Buy it now</button>
                    </div>
                  </div>
                  {stockLeft > 0 && stockLeft <= 5 && <p className="mt-3 text-sm font-medium text-rose-500 max-md:-mt-1 max-md:mb-1">🔥 Only {stockLeft} left in stock</p>}
                </>
              )}
              <div className="mt-1 flex flex-wrap gap-x-5 text-sm text-plum-800 sm:mt-4">
                <button onClick={() => { const r = toggleCompare(p); if (r === 'full') toast.error('You can compare up to 4 items') }} className="inline-flex items-center gap-2 py-2.5 hover:text-rose-500"><FiShuffle /> {inCompare ? 'In compare' : 'Compare'}</button>
                <button onClick={share} className="inline-flex items-center gap-2 py-2.5 hover:text-rose-500"><FiShare2 /> Share</button>
                {cfg.whatsapp && <a href={waLink(cfg.whatsapp, `Hi Shyfly! I'd like to order: ${p.name}${colorText}${sizeText}\n${window.location.href}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2.5 hover:text-green-600"><FaWhatsapp /> Order on WhatsApp</a>}
              </div>
            </div>

            <div className="mt-4 sm:mt-7"><Delivery /></div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-plum-800 sm:mt-6 sm:gap-3 sm:text-xs">
              {[[FiTruck, 'Free shipping', `above ${inr(cfg.freeShippingMin)}`], [FiRefreshCw, cfg.returnWindowDays > 0 ? `${cfg.returnWindowDays}-day returns` : 'Quality checked', cfg.returnWindowDays > 0 ? 'easy exchange' : 'before dispatch'], [FiShield, 'Secure checkout', 'UPI · Cards · COD']].map(([I, a, b]) => <div key={a} className="rounded-2xl bg-blush p-2.5 sm:p-3"><I className="mx-auto mb-1.5 text-rose-500" size={20} /><b className="block">{a}</b><span className="text-plum-700/60">{b}</span></div>)}
            </div>

            <div className="mt-5 border-t border-plum-100 sm:mt-8">
              {p.description && <div className="md:hidden"><Accordion title="About this product" open><p className="leading-relaxed">{p.description}</p></Accordion></div>}
              <Accordion title="Product details" open={!phone}>
                <dl className="grid grid-cols-[110px_1fr] gap-y-2">{(p.details?.length ? p.details : [{ label: 'Material', value: p.material }]).filter((d) => d.value).map((d) => <Fragment key={d.label}><dt className="text-plum-700/60">{d.label}</dt><dd>{d.value}</dd></Fragment>)}</dl>
              </Accordion>
              {p.careNote && <Accordion title="Care">{p.careNote}</Accordion>}
              <Accordion title="Shipping & returns">Free delivery above {inr(cfg.freeShippingMin)}, otherwise {inr(cfg.shippingFee)}. Estimated delivery {cfg.delivery?.min}–{cfg.delivery?.max} days.{cfg.returnWindowDays > 0 && p.returnable !== false ? ` Eligible for return or exchange within ${cfg.returnWindowDays} days of delivery — request it from Track Order.` : p.returnable === false ? ' This item is not eligible for return.' : ''}</Accordion>
            </div>
          </div>
        </div>

        <Reviews p={p} onChange={(rating) => setP((x) => ({ ...x, rating }))} />

        {rel.products.length > 0 && <section className="mt-12 sm:mt-24"><Reveal><p className="eyebrow">You may also like</p><h2 className="h-section mt-2 max-md:!text-[28px]">Similar styles</h2></Reveal><div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-8 sm:gap-x-4 sm:gap-y-9 lg:grid-cols-4">{rel.products.slice(0, 4).map((x) => <ProductCard key={x._id} product={x} />)}</div></section>}
        {rel.look.length > 0 && <section className="mt-10 sm:mt-20"><Reveal><p className="eyebrow">Complete the look</p><h2 className="h-section mt-2 max-md:!text-[28px]">Pair it with</h2></Reveal><div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-8 sm:gap-x-4 sm:gap-y-9 lg:grid-cols-4">{rel.look.map((x) => <ProductCard key={x._id} product={x} />)}</div></section>}
        {recent.length > 0 && <section className="mt-10 sm:mt-20"><Reveal><p className="eyebrow">Recently viewed</p></Reveal><div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto sm:mt-6 sm:gap-4">{recent.map((x) => <div key={x._id} className="w-40 shrink-0 sm:w-52"><ProductCard product={x} /></div>)}</div></section>}
      </div>

      <AnimatePresence>
        {stickyOn && !allSold && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-[var(--bnav-h,0px)] z-30 border-t border-plum-100 bg-white p-3 max-md:hidden lg:bg-white/95 lg:backdrop-blur-xl lg:bottom-0">
            <div className="container-x flex items-center gap-4">
              <div className="hidden h-12 w-10 overflow-hidden rounded-lg sm:block"><ProductImage product={p} w={100} className="h-full w-full object-cover" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-sm font-semibold text-plum-800">{inr(p.price)}</p></div>
              <button onClick={() => (v.needsSize ? window.scrollTo({ top: 0, behavior: 'smooth' }) : submit(false))} className="btn-plum btn-cta shrink-0">{v.needsSize ? 'Select size' : 'Add to bag'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* phones: always-on action bar (replaces the tab bar on product pages) */}
      {!allSold && (
        <div className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-plum-100 bg-white shadow-[0_-6px_20px_-12px_rgba(107,21,68,.25)] md:hidden">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <button type="button" onClick={wish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-plum-200 text-plum-800 active:scale-95">{wished ? <FaHeart className="text-rose-500" size={19} /> : <FiHeart size={20} />}</button>
            <button type="button" onClick={() => submit(false)} className={`h-12 flex-1 rounded-full bg-plum-700 text-[12.5px] font-bold uppercase tracking-wider text-white transition active:scale-[.98] ${added ? '!bg-green-600' : ''}`}>{added ? '✓ Added' : 'Add to bag'}</button>
            <button type="button" onClick={() => submit(true)} className="h-12 flex-1 rounded-full bg-rose-500 text-[12.5px] font-bold uppercase tracking-wider text-white transition active:scale-[.98]">Buy now</button>
          </div>
        </div>
      )}
    </>
  )
}
