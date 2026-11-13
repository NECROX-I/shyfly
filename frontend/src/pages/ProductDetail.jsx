import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiHeart, FiShuffle, FiShare2, FiMinus, FiPlus, FiTruck, FiRefreshCw, FiShield, FiChevronRight, FiChevronDown, FiCheck, FiMapPin } from 'react-icons/fi'
import { FaHeart, FaWhatsapp } from 'react-icons/fa'
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
        <input value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setRes(null) }} inputMode="numeric" placeholder="Enter pincode" className="input !rounded-full !py-2.5" />
        <button disabled={busy} className="btn-plum !px-6 !py-2.5">{busy ? '…' : 'Check'}</button>
      </form>
      {res && (res.serviceable
        ? <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-start gap-2 text-sm text-plum-900"><FiCheck className="mt-0.5 shrink-0 text-green-600" /><span>Delivery by <b>{d(res.from)} – {d(res.to)}</b>{res.zone ? ` (${res.zone})` : ''}. {res.cod ? 'Cash on Delivery available.' : 'Online payment only.'}</span></motion.p>
        : <p className="mt-3 text-sm text-rose-600">{res.reason}</p>)}
    </div>
  )
}

function Reviews({ p, onChange }) {
  const user = useAuth((s) => s.user)
  const [data, setData] = useState({ reviews: [], distribution: {} })
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })
  const [busy, setBusy] = useState(false)
  const load = () => shopAPI.reviews(p._id).then((r) => setData(r.data)).catch(() => {})
  useEffect(() => { load() }, [p._id]) // eslint-disable-line
  const total = Object.values(data.distribution).reduce((a, b) => a + b, 0)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { const r = await shopAPI.addReview(p._id, form); toast.success('Thank you for your review 💗'); setForm({ rating: 5, title: '', comment: '' }); load(); onChange?.(r.data.rating) }
    catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  return (
    <section id="reviews" className="mt-20 grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="eyebrow">Reviews</p><h2 className="h-section mt-2">What women say</h2>
        {p.rating?.count > 0 && (
          <div className="mt-6 flex items-center gap-5">
            <div className="font-display text-7xl font-semibold text-plum-800">{p.rating.avg}</div>
            <div><Stars value={p.rating.avg} size={16} /><p className="mt-1 text-sm text-plum-700/60">{p.rating.count} ratings</p></div>
          </div>
        )}
        <div className="mt-5 space-y-1.5">{[5, 4, 3, 2, 1].map((s) => <div key={s} className="flex items-center gap-3 text-xs"><span className="w-3">{s}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-plum-100"><div className="h-full rounded-full bg-gold-500" style={{ width: `${total ? ((data.distribution[s] || 0) / total) * 100 : 0}%` }} /></div><span className="w-6 text-right text-plum-700/60">{data.distribution[s] || 0}</span></div>)}</div>

        <form onSubmit={submit} className="mt-8 rounded-2xl bg-blush p-5">
          <p className="font-display text-2xl font-semibold text-plum-800">Write a review</p>
          {!user ? <p className="mt-2 text-sm text-plum-800/70"><Link to="/login" state={{ from: `/product/${p.slug}` }} className="font-medium text-rose-500 underline">Log in</Link> to share your experience.</p> : (
            <>
              <div className="mt-3 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} stars`}><Stars value={form.rating >= n ? 5 : 0} size={24} className="[&>svg]:mr-0.5" /></button>)}</div>
              <input className="input mt-3" placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
              <textarea className="input mt-3" rows={3} placeholder="How was it?" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} maxLength={1500} />
              <button disabled={busy} className="btn-plum mt-3 w-full">{busy ? 'Posting…' : 'Post review'}</button>
            </>
          )}
        </form>
      </div>
      <div className="space-y-5 lg:col-span-8">
        {data.reviews.length === 0 && <p className="rounded-2xl border border-dashed border-plum-200 p-10 text-center text-plum-700/70">No reviews yet — be the first to share one.</p>}
        {data.reviews.map((r) => (
          <Reveal key={r._id} className="rounded-2xl border border-plum-100 p-6">
            <div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-plum-700/50">{fmtDate(r.createdAt)}</span></div>
            {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
            {r.comment && <p className="mt-1.5 text-[15px] leading-relaxed text-plum-900/80">{r.comment}</p>}
            <p className="mt-3 text-sm text-plum-700/70">{r.name} {r.verified && <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">✓ Verified buyer</span>}</p>
          </Reveal>
        ))}
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
    if (v.needsSize) { setShake(true); setTimeout(() => setShake(false), 600); return toast.error('Please choose a size') }
    if (!v.variant || v.variant.stock < 1) return toast.error('This combination is out of stock')
    add(p, v.variant, qty)
    if (buyNow) return nav('/checkout')
    setAdded(true); setTimeout(() => setAdded(false), 1400); setCart(true)
  }
  const share = async () => {
    const data = { title: p.name, text: `Look what I found on Shyfly: ${p.name}`, url: window.location.href }
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); toast.success('Link copied') } } catch (_) {}
  }
  const sizeText = v.sizes.length && v.size ? ` (size ${v.size})` : ''
  const colorText = v.color ? `, ${v.color}` : ''
  const allSold = p.variants.every((x) => x.stock === 0)

  return (
    <>
      <SEO title={p.name} description={p.description?.slice(0, 155)} image={p.images?.[0]?.url} />
      <div className="container-x py-6 sm:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs uppercase tracking-wider text-plum-700/60">
          <Link to="/" className="hover:text-rose-500">Home</Link><FiChevronRight size={12} />
          <Link to={`/shop/${p.category?.slug}`} className="hover:text-rose-500">{p.category?.name}</Link>
          {p.subCategory && <><FiChevronRight size={12} /><Link to={`/shop/${p.category?.slug}/${p.subCategory.slug}`} className="hover:text-rose-500">{p.subCategory.name}</Link></>}
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 xl:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start"><Gallery p={p} /></div>

          <div>
            <p className="eyebrow">{p.brand}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-plum-800 sm:text-5xl">{p.name}</h1>
            {p.rating?.count > 0 && <a href="#reviews" className="mt-3 inline-flex items-center gap-2"><Stars value={p.rating.avg} size={15} /><span className="text-sm text-plum-700/70 underline underline-offset-4">{p.rating.avg} · {p.rating.count} reviews</span></a>}
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-semibold text-plum-800">{inr(p.price)}</span>
              {off > 0 && <><span className="text-lg text-plum-700/50 line-through">{inr(p.mrp)}</span><span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-500">Save {inr(p.mrp - p.price)} ({off}%)</span></>}
            </div>
            <p className="mt-1 text-xs text-plum-700/60">Inclusive of all taxes</p>

            <p className="mt-6 leading-relaxed text-plum-900/80">{p.description}</p>

            <div className="my-7 border-y border-plum-100 py-7"><VariantPicker v={v} shake={shake} /></div>

            <div ref={ctaRef}>
              {allSold ? <div className="rounded-2xl bg-plum-50 p-5 text-center font-medium text-plum-800">Sold out — <Link to={`/shop/${p.category?.slug}`} className="underline">see similar</Link></div> : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-plum-200">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3.5" aria-label="Less"><FiMinus size={15} /></button>
                      <span className="w-8 text-center font-medium">{qty}</span>
                      <button onClick={() => setQty(Math.min(stockLeft ? Math.min(10, stockLeft) : 10, qty + 1))} className="p-3.5" aria-label="More"><FiPlus size={15} /></button>
                    </div>
                    <button onClick={() => submit(false)} className={`btn-plum btn-sheen flex-1 ${added ? '!bg-green-600' : ''}`}>{added ? <><FiCheck size={16} /> Added</> : 'Add to bag'}</button>
                    <button onClick={() => { const a = toggleWish(p._id); toast(a ? 'Added to wishlist 💗' : 'Removed from wishlist') }} aria-label="Wishlist" className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border border-plum-200 transition hover:border-rose-400">{wished ? <FaHeart className="text-rose-500" size={18} /> : <FiHeart size={19} />}</button>
                  </div>
                  <button onClick={() => submit(true)} className="btn-rose mt-3 w-full">Buy it now</button>
                  {stockLeft > 0 && stockLeft <= 5 && <p className="mt-3 text-sm font-medium text-rose-500">🔥 Only {stockLeft} left in stock</p>}
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-5 text-sm text-plum-800">
                <button onClick={() => { const r = toggleCompare(p); if (r === 'full') toast.error('You can compare up to 4 items') }} className="inline-flex items-center gap-2 hover:text-rose-500"><FiShuffle /> {inCompare ? 'In compare' : 'Compare'}</button>
                <button onClick={share} className="inline-flex items-center gap-2 hover:text-rose-500"><FiShare2 /> Share</button>
                {cfg.whatsapp && <a href={waLink(cfg.whatsapp, `Hi Shyfly! I'd like to order: ${p.name}${colorText}${sizeText}\n${window.location.href}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-green-600"><FaWhatsapp /> Order on WhatsApp</a>}
              </div>
            </div>

            <div className="mt-7"><Delivery /></div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-plum-800">
              {[[FiTruck, 'Free shipping', `above ${inr(cfg.freeShippingMin)}`], [FiRefreshCw, cfg.returnWindowDays > 0 ? `${cfg.returnWindowDays}-day returns` : 'Quality checked', cfg.returnWindowDays > 0 ? 'easy exchange' : 'before dispatch'], [FiShield, 'Secure checkout', 'UPI · Cards · COD']].map(([I, a, b]) => <div key={a} className="rounded-2xl bg-blush p-3"><I className="mx-auto mb-1.5 text-rose-500" size={20} /><b className="block">{a}</b><span className="text-plum-700/60">{b}</span></div>)}
            </div>

            <div className="mt-8 border-t border-plum-100">
              <Accordion title="Product details" open>
                <dl className="grid grid-cols-[110px_1fr] gap-y-2">{(p.details?.length ? p.details : [{ label: 'Material', value: p.material }]).filter((d) => d.value).map((d) => <Fragment key={d.label}><dt className="text-plum-700/60">{d.label}</dt><dd>{d.value}</dd></Fragment>)}</dl>
              </Accordion>
              {p.careNote && <Accordion title="Care">{p.careNote}</Accordion>}
              <Accordion title="Shipping & returns">Free delivery above {inr(cfg.freeShippingMin)}, otherwise {inr(cfg.shippingFee)}. Estimated delivery {cfg.delivery?.min}–{cfg.delivery?.max} days.{cfg.returnWindowDays > 0 && p.returnable !== false ? ` Eligible for return or exchange within ${cfg.returnWindowDays} days of delivery — request it from Track Order.` : p.returnable === false ? ' This item is not eligible for return.' : ''}</Accordion>
            </div>
          </div>
        </div>

        <Reviews p={p} onChange={(rating) => setP((x) => ({ ...x, rating }))} />

        {rel.products.length > 0 && <section className="mt-24"><Reveal><p className="eyebrow">You may also like</p><h2 className="h-section mt-2">Similar styles</h2></Reveal><div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">{rel.products.slice(0, 4).map((x) => <ProductCard key={x._id} product={x} />)}</div></section>}
        {rel.look.length > 0 && <section className="mt-20"><Reveal><p className="eyebrow">Complete the look</p><h2 className="h-section mt-2">Pair it with</h2></Reveal><div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">{rel.look.map((x) => <ProductCard key={x._id} product={x} />)}</div></section>}
        {recent.length > 0 && <section className="mt-20"><Reveal><p className="eyebrow">Recently viewed</p></Reveal><div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto">{recent.map((x) => <div key={x._id} className="w-40 shrink-0 sm:w-52"><ProductCard product={x} /></div>)}</div></section>}
      </div>

      <AnimatePresence>
        {stickyOn && !allSold && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-[58px] z-30 border-t border-plum-100 bg-white/95 p-3 backdrop-blur-xl lg:bottom-0">
            <div className="container-x flex items-center gap-4">
              <div className="hidden h-12 w-10 overflow-hidden rounded-lg sm:block"><ProductImage product={p} w={100} className="h-full w-full object-cover" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-sm font-semibold text-plum-800">{inr(p.price)}</p></div>
              <button onClick={() => (v.needsSize ? window.scrollTo({ top: 0, behavior: 'smooth' }) : submit(false))} className="btn-plum !px-8 !py-3">{v.needsSize ? 'Select size' : 'Add to bag'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
