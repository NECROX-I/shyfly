import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FiX, FiLock, FiCheck, FiShield, FiTruck, FiRefreshCw, FiTag, FiChevronRight, FiChevronLeft, FiChevronDown, FiHeart, FiPlus,
  FiMapPin, FiPackage, FiSmartphone, FiCreditCard, FiGlobe, FiBriefcase, FiShoppingBag, FiPercent,
} from 'react-icons/fi'
import SEO from '../components/SEO'
import ProductImage from '../components/ProductImage'
import { FreeShipBar } from '../components/CartDrawer'
import { useCart, useAuth, useWishlist } from '../store'
import { useConfig, useLockBody } from '../lib/hooks'
import { authAPI, orderAPI, shopAPI } from '../services/api'
import { inr, errMsg, discountPct } from '../lib/format'

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
]

const STEPS = [['bag', 'Bag'], ['address', 'Address'], ['payment', 'Payment']]

// Payment tabs (left list, like Myntra). "cod" is handled by us; every other tab opens Razorpay with that method on top.
const METHODS = [
  { id: 'cod', label: 'Cash on Delivery', short: 'Pay on Delivery (Cash/UPI)', Icon: FiPackage, blurb: 'Pay in cash or UPI to the delivery partner when your order arrives.' },
  { id: 'upi', label: 'UPI (Pay via any App)', short: 'UPI (Pay via any App)', Icon: FiSmartphone, blurb: 'Pay with Google Pay, PhonePe, Paytm, BHIM or any UPI app.' },
  { id: 'card', label: 'Credit / Debit Card', short: 'Credit/Debit Card', Icon: FiCreditCard, blurb: 'Visa, Mastercard, RuPay and American Express cards accepted.' },
  { id: 'wallet', label: 'Wallets', short: 'Wallets', Icon: FiBriefcase, blurb: 'Paytm, PhonePe, Amazon Pay, Freecharge and more.' },
  { id: 'netbanking', label: 'Net Banking', short: 'Net Banking', Icon: FiGlobe, blurb: 'All major Indian banks supported.' },
]
const RECOMMENDED = ['cod', 'upi', 'card']

const loadRazorpay = () =>
  new Promise((res, rej) => {
    if (window.Razorpay) return res()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = res
    s.onerror = () => rej(new Error('Could not load payment gateway'))
    document.body.appendChild(s)
  })

const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }
const dShort = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const lineOf = (a) => [a.line1, a.line2, a.landmark].filter(Boolean).join(', ')
const lineKey = (productId, variantId) => `${productId}:${variantId}` // same format as the cart store

// ── small UI bits ─────────────────────────────────────────────
const Field = ({ label, error, prefix, ...rest }) => (
  <div>
    <label className="label">{label}</label>
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-plum-700/70">{prefix}</span>}
      <input className={`input !rounded ${prefix ? '!pl-12' : ''} ${error ? '!border-rose-500' : ''}`} {...rest} />
    </div>
    {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
  </div>
)

const OutlineBtn = ({ className = '', ...p }) => (
  <button type="button" className={`min-h-[38px] rounded border border-plum-200 px-4 text-xs font-bold uppercase tracking-wide text-plum-800 transition hover:border-rose-400 hover:text-rose-500 disabled:opacity-50 ${className}`} {...p} />
)

const PrimaryBtn = ({ className = '', ...p }) => (
  <button type="button" className={`relative inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-rose-500 px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-rose-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...p} />
)

// Myntra-style dialog: centred card on desktop, bottom sheet on phones
function Modal({ title, onClose, children, footer, wide }) {
  useLockBody(true)
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} initial={{ y: 48, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }} transition={{ duration: 0.2 }}
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-white shadow-2xl sm:rounded ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-plum-100 px-5 py-3.5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-plum-800">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid h-10 w-10 place-items-center text-plum-700 hover:text-rose-500"><FiX size={20} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="safe-b border-t border-plum-100 p-4">{footer}</div>}
      </motion.div>
    </motion.div>
  )
}

function Thumb({ i, className = 'h-20 w-16' }) {
  return <div className={`shrink-0 overflow-hidden rounded bg-plum-50 ${className}`}><ProductImage product={{ name: i.name, images: i.image ? [{ url: i.image }] : [], category: i.category }} w={200} className="h-full w-full object-cover" /></div>
}

// ── Stepper (BAG ── ADDRESS ── PAYMENT) ───────────────────────
function Stepper({ step, onGo }) {
  const idx = STEPS.findIndex((s) => s[0] === step)
  return (
    <ol className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] sm:gap-4 sm:text-xs">
      {STEPS.map(([k, l], i) => (
        <li key={k} className="flex items-center gap-2 sm:gap-4">
          <button type="button" disabled={i > idx} onClick={() => onGo(k)} className={`py-2 ${i === idx ? 'text-rose-500' : i < idx ? 'text-plum-800' : 'text-plum-700/40'}`}>
            {i < idx && <FiCheck className="mr-1 inline" size={13} />}{l}
          </button>
          {i < STEPS.length - 1 && <span className="h-px w-5 border-t border-dashed border-plum-300 sm:w-14" />}
        </li>
      ))}
    </ol>
  )
}

// ── Price details ─────────────────────────────────────────────
const Row = ({ l, children, green, extra }) => (
  <div className="flex items-center justify-between py-1.5 text-[14px]">
    <span className="flex items-center gap-1.5">{l}{extra}</span>
    <span className={green ? 'text-green-700' : ''}>{children}</span>
  </div>
)
const KnowMore = ({ onClick }) => <button type="button" onClick={onClick} className="-my-1.5 py-1.5 text-xs font-bold text-rose-500">Know more</button>

function PriceDetails({ count, mrpTotal, mrpDiscount, discount, shipping, shippingFee, total, onCoupon, onShipInfo }) {
  const saved = mrpDiscount + discount
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-plum-700/70">Price details ({count} item{count === 1 ? '' : 's'})</h3>
      <Row l="Total MRP">{inr(mrpTotal)}</Row>
      {mrpDiscount > 0 && <Row l="Discount on MRP" green>− {inr(mrpDiscount)}</Row>}
      {discount > 0
        ? <Row l="Coupon discount" green>− {inr(discount)}</Row>
        : onCoupon && <Row l="Coupon discount"><button type="button" onClick={onCoupon} className="-my-1.5 py-1.5 font-bold text-rose-500">Apply coupon</button></Row>}
      <Row l="Shipping fee" extra={onShipInfo && <KnowMore onClick={onShipInfo} />}>{shipping ? inr(shipping) : <><s className="mr-2 text-plum-700/50">{inr(shippingFee)}</s><b className="text-green-700">FREE</b></>}</Row>
      <div className="mt-2 flex items-center justify-between border-t border-dashed border-plum-200 pt-3 text-base font-bold text-plum-800"><span>Total amount</span><span>{inr(total)}</span></div>
      {saved > 0 && <p className="mt-4 rounded bg-green-50 p-3 text-sm font-medium text-green-800">🎉 You will save {inr(saved)} on this order</p>}
    </div>
  )
}

// ── Bag line ──────────────────────────────────────────────────
function BagItem({ i, checked, onToggle, onRemove, onSize, onQty, returnDays, eta }) {
  const off = discountPct({ mrp: i.mrp, price: i.price })
  const pill = 'inline-flex min-h-8 items-center gap-1 rounded bg-plum-50 px-2.5 py-1.5 text-xs font-bold text-plum-800 transition hover:bg-rose-50 hover:text-rose-500'
  return (
    <div className={`relative flex gap-3 rounded border border-plum-100 bg-white p-3 sm:gap-4 sm:p-4 ${checked ? '' : 'opacity-60'}`}>
      <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded bg-plum-50 sm:h-36 sm:w-28">
        <Link to={`/product/${i.slug}`}><ProductImage product={{ name: i.name, images: i.image ? [{ url: i.image }] : [], category: i.category }} w={260} className="h-full w-full object-cover" /></Link>
        <input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Select ${i.name}`} className="absolute left-1.5 top-1.5 h-5 w-5 accent-rose-500" />
      </div>
      <div className="min-w-0 flex-1 pr-7 text-sm">
        <p className="text-sm font-bold text-plum-900">Shyfly</p>
        <Link to={`/product/${i.slug}`} className="line-clamp-2 leading-snug text-plum-800/80">{i.name}</Link>
        <p className="mt-0.5 text-xs text-plum-700/60">Sold by: Shyfly{i.color ? ` · ${i.color}` : ''}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {i.size && <button type="button" onClick={onSize} className={pill}>Size: {i.size}<FiChevronDown size={13} /></button>}
          <button type="button" onClick={onQty} className={pill}>Qty: {i.qty}<FiChevronDown size={13} /></button>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <b className="text-base text-plum-800">{inr(i.price * i.qty)}</b>
          {off > 0 && <><s className="text-xs text-plum-700/50">{inr(i.mrp * i.qty)}</s><span className="text-xs font-bold text-rose-500">{off}% OFF</span></>}
        </div>
        {returnDays > 0 && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-plum-800/80"><FiRefreshCw size={12} /><b>{returnDays} days</b> return available</p>}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-plum-800/80"><FiTruck size={12} /> Delivery by <b>{eta}</b></p>
      </div>
      <button type="button" onClick={onRemove} aria-label="Remove from bag" className="absolute right-1 top-1 grid h-10 w-10 place-items-center text-plum-500 hover:text-rose-500"><FiX size={18} /></button>
    </div>
  )
}

// ── Address card ──────────────────────────────────────────────
function AddressCard({ a, selected, onSelect, onEdit, onRemove, pinRes }) {
  return (
    <div role="radio" aria-checked={selected} tabIndex={0} onClick={onSelect} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      className={`cursor-pointer rounded border p-4 transition ${selected ? 'border-plum-400 bg-blush/50' : 'border-plum-100 bg-white hover:border-plum-300'}`}>
      <div className="flex gap-3">
        <input type="radio" readOnly checked={selected} tabIndex={-1} className="mt-1 h-4 w-4 accent-rose-500" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] text-plum-900">{a.name}</b>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${a.label === 'Work' ? 'border-amber-600 text-amber-700' : 'border-green-600 text-green-700'}`}>{a.label === 'Work' ? 'Office' : 'Home'}</span>
          </p>
          <p className="mt-1.5 leading-relaxed text-plum-800/80">{lineOf(a)}<br />{a.city}, {a.state} – {a.pincode}</p>
          <p className="mt-1.5 text-plum-800/80">Mobile: <b>{a.phone}</b></p>
          {pinRes && (pinRes.serviceable
            ? <p className="mt-2 text-xs text-plum-800/80"><span className="text-green-600">●</span> {pinRes.cod ? 'Pay on Delivery available' : 'Pay on Delivery not available'}</p>
            : <p className="mt-2 text-xs font-medium text-rose-600">✕ {pinRes.reason || 'We cannot deliver to this pincode'}</p>)}
          <div className="mt-3 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <OutlineBtn onClick={onRemove}>Remove</OutlineBtn>
            <OutlineBtn onClick={onEdit}>Edit</OutlineBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dialogs ───────────────────────────────────────────────────
// generic two-button confirm (remove from bag, delete address …)
function Confirm({ title, body, children, left, right, onClose }) {
  return (
    <Modal title={title} onClose={onClose}
      footer={<div className="grid grid-cols-2 gap-3"><OutlineBtn className="!min-h-[46px]" onClick={left.run}>{left.label}</OutlineBtn><PrimaryBtn className="!min-h-[46px]" onClick={right.run}>{right.label}</PrimaryBtn></div>}>
      {children}
      <p className="text-sm leading-relaxed text-plum-800/80">{body}</p>
    </Modal>
  )
}

// "Select Size"
function SizeModal({ item, onClose, onDone }) {
  const [p, setP] = useState(null)
  const [err, setErr] = useState(false)
  const [size, setSize] = useState(item.size)
  useEffect(() => { shopAPI.one(item.slug).then((r) => setP(r.data.product)).catch(() => setErr(true)) }, []) // eslint-disable-line
  const vs = (p?.variants || []).filter((v) => v.size && (!item.color || v.color === item.color))
  const chosen = vs.find((v) => v.size === size)
  return (
    <Modal title="Select size" onClose={onClose}
      footer={<PrimaryBtn className="w-full" disabled={!chosen || chosen.stock === 0} onClick={() => { onDone(p, chosen); onClose() }}>Done</PrimaryBtn>}>
      <div className="mb-5 flex items-center gap-3 border-b border-plum-100 pb-4">
        <Thumb i={item} className="h-16 w-12" />
        <div className="min-w-0 text-sm"><p className="truncate font-bold text-plum-900">{item.name}</p><p className="text-plum-700/70">{inr(p?.price ?? item.price)}</p></div>
      </div>
      {err ? <p className="text-sm text-rose-500">Couldn’t load sizes. Please try again.</p>
        : !p ? <div className="flex gap-3">{[0, 1, 2, 3].map((k) => <span key={k} className="h-12 w-12 animate-pulse rounded-full bg-plum-50" />)}</div>
        : (
          <div className="flex flex-wrap gap-3">
            {vs.map((v) => {
              const on = v.size === size
              return (
                <div key={v._id} className="text-center">
                  <button type="button" disabled={v.stock === 0} onClick={() => setSize(v.size)}
                    className={`grid h-12 min-w-[48px] place-items-center rounded-full border px-3 text-sm font-bold transition ${on ? 'border-rose-500 text-rose-500' : 'border-plum-200 text-plum-800 hover:border-rose-400'} ${v.stock === 0 ? 'cursor-not-allowed border-dashed text-plum-300 line-through opacity-60' : ''}`}>
                    {v.size}
                  </button>
                  {v.stock > 0 && v.stock <= 3 && <p className="mt-1 text-[10px] font-medium text-rose-500">{v.stock} left</p>}
                </div>
              )
            })}
          </div>
        )}
    </Modal>
  )
}

// "Select Quantity"
function QtyModal({ item, onClose, onDone }) {
  const max = Math.max(1, Math.min(10, item.max || 10))
  const [q, setQ] = useState(Math.min(item.qty, max))
  return (
    <Modal title="Select quantity" onClose={onClose} footer={<PrimaryBtn className="w-full" onClick={() => { onDone(q); onClose() }}>Done</PrimaryBtn>}>
      <div className="mb-5 flex items-center gap-3 border-b border-plum-100 pb-4">
        <Thumb i={item} className="h-16 w-12" />
        <div className="min-w-0 text-sm"><p className="truncate font-bold text-plum-900">{item.name}</p><p className="text-plum-700/70">{[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' · ')}</p></div>
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: max }, (_, k) => k + 1).map((n) => (
          <button key={n} type="button" onClick={() => setQ(n)} className={`grid h-12 w-12 place-items-center rounded-full border text-sm font-bold transition ${q === n ? 'border-rose-500 text-rose-500' : 'border-plum-200 text-plum-800 hover:border-rose-400'}`}>{n}</button>
        ))}
      </div>
      {max < 10 && <p className="mt-4 text-xs text-rose-500">Only {max} in stock for this size.</p>}
    </Modal>
  )
}

// "Apply Coupon"
function CouponModal({ coupon, offers, subtotal, onApply, onClose }) {
  const [code, setCode] = useState('')
  const [pick, setPick] = useState(coupon?.code || null)
  const [info, setInfo] = useState({}) // code → discount | { err }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    offers.forEach((o) => {
      if ((o.minOrder || 0) > subtotal) return
      shopAPI.validateCoupon(o.code, subtotal)
        .then((r) => setInfo((x) => ({ ...x, [o.code]: r.data.discount })))
        .catch((e) => setInfo((x) => ({ ...x, [o.code]: { err: errMsg(e) } })))
    })
  }, []) // eslint-disable-line

  const run = async (c) => { setBusy(true); const ok = await onApply(c); setBusy(false); if (ok) onClose() }
  const saving = pick && typeof info[pick] === 'number' ? info[pick] : 0

  return (
    <Modal title="Apply coupon" onClose={onClose} wide
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1 text-sm">{saving > 0 ? <><p className="text-xs text-plum-700/60">Maximum savings</p><p className="text-lg font-bold text-plum-800">{inr(saving)}</p></> : <p className="text-xs text-plum-700/60">Select a coupon to see your savings</p>}</div>
          <PrimaryBtn className="min-w-[140px]" disabled={!pick || busy || (info[pick] && info[pick].err)} onClick={() => run(pick)}>{busy ? 'Applying…' : 'Apply'}</PrimaryBtn>
        </div>
      }>
      <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(code.trim()) }} className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input !rounded !py-2.5" autoFocus />
        <OutlineBtn type="submit" disabled={!code.trim() || busy} className="!min-h-[46px]">Check</OutlineBtn>
      </form>

      <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-plum-700/70">Available coupons</p>
      {offers.length === 0 && <p className="rounded bg-blush p-4 text-sm text-plum-800/70">No coupons are available right now.</p>}
      <div className="space-y-3">
        {offers.map((o) => {
          const short = (o.minOrder || 0) > subtotal
          const r = info[o.code]
          const bad = short || (r && r.err)
          return (
            <label key={o.code} className={`flex gap-3 rounded border p-3.5 ${bad ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${pick === o.code ? 'border-rose-400 bg-rose-50/40' : 'border-plum-100'}`}>
              <input type="radio" name="coupon" disabled={bad} checked={pick === o.code} onChange={() => setPick(o.code)} className="mt-1 h-4 w-4 accent-rose-500" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="inline-block rounded border border-dashed border-plum-300 px-2 py-0.5 text-xs font-bold tracking-wider text-plum-800">{o.code}</p>
                {typeof r === 'number' && <p className="mt-1.5 font-bold text-green-700">Save {inr(r)} on this order!</p>}
                {o.description && <p className="mt-1 text-xs text-plum-800/75">{o.description}</p>}
                {o.minOrder > 0 && <p className="mt-1 text-xs text-plum-700/60">Min. order {inr(o.minOrder)}</p>}
                {short && <p className="mt-1.5 text-xs font-medium text-rose-500">Add items worth {inr(o.minOrder - subtotal)} more to unlock</p>}
                {r && r.err && <p className="mt-1.5 text-xs font-medium text-rose-500">{r.err}</p>}
              </div>
            </label>
          )
        })}
      </div>
    </Modal>
  )
}

// "Check delivery time & services" (guests / no saved address)
function PincodeModal({ initial, onClose, onResult }) {
  const [pin, setPin] = useState(initial || '')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const check = async (e) => {
    e?.preventDefault()
    if (!/^\d{6}$/.test(pin)) return toast.error('Enter a valid 6-digit pincode')
    setBusy(true)
    try { const r = await shopAPI.pincode(pin); setRes(r.data); onResult({ pin, res: r.data }) } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  return (
    <Modal title="Check delivery time & services" onClose={onClose} footer={<PrimaryBtn className="w-full" onClick={onClose}>Done</PrimaryBtn>}>
      <form onSubmit={check} className="flex gap-2">
        <input value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setRes(null) }} inputMode="numeric" placeholder="Enter pincode" className="input !rounded !py-2.5" autoFocus />
        <PrimaryBtn type="submit" disabled={busy} className="!min-h-[46px]">{busy ? '…' : 'Check'}</PrimaryBtn>
      </form>
      {res && (res.serviceable ? (
        <div className="mt-5 space-y-2 text-sm text-plum-800">
          <p className="flex items-center gap-2"><FiTruck className="text-green-600" /> Get it by <b>{dShort(res.from)} – {dShort(res.to)}</b></p>
          <p className="flex items-center gap-2"><FiPackage className={res.cod ? 'text-green-600' : 'text-plum-400'} /> {res.cod ? 'Pay on Delivery available' : 'Pay on Delivery not available'}</p>
          <p className="flex items-center gap-2"><FiRefreshCw className="text-green-600" /> Easy returns available</p>
        </div>
      ) : <p className="mt-5 text-sm font-medium text-rose-600">✕ {res.reason || 'We cannot deliver to this pincode yet.'}</p>)}
    </Modal>
  )
}

// "Change address" from the bag
function AddressPicker({ saved, selectedId, pins, onClose, onPick, onAdd }) {
  const [id, setId] = useState(selectedId)
  return (
    <Modal title="Select delivery address" onClose={onClose} wide
      footer={<PrimaryBtn className="w-full" onClick={() => { onPick(id); onClose() }}>Done</PrimaryBtn>}>
      <div className="space-y-3">
        {saved.map((a) => {
          const pr = pins[a.pincode]
          return (
            <label key={a._id} className={`flex cursor-pointer gap-3 rounded border p-3.5 text-sm ${id === a._id ? 'border-plum-400 bg-blush/50' : 'border-plum-100'}`}>
              <input type="radio" name="addr" checked={id === a._id} onChange={() => setId(a._id)} className="mt-1 h-4 w-4 accent-rose-500" />
              <div className="min-w-0">
                <p><b className="text-plum-900">{a.name}</b> <span className="ml-1 text-[10px] font-bold uppercase text-green-700">{a.label === 'Work' ? 'Office' : 'Home'}</span></p>
                <p className="mt-1 text-plum-800/80">{lineOf(a)}, {a.city}, {a.state} – {a.pincode}</p>
                <p className="mt-1 text-plum-800/80">Mobile: <b>{a.phone}</b></p>
                {pr && !pr.serviceable && <p className="mt-1.5 text-xs font-medium text-rose-600">✕ {pr.reason || 'Not deliverable'}</p>}
              </div>
            </label>
          )
        })}
      </div>
      <OutlineBtn className="mt-4 w-full !min-h-[44px]" onClick={onAdd}><FiPlus className="mr-1 inline" />Add new address</OutlineBtn>
    </Modal>
  )
}

// Add / edit address
function AddressModal({ init, user, isFirst, onClose, onSave }) {
  const [f, setF] = useState(() => ({
    _id: init?._id, name: init?.name || user.name || '', phone: init?.phone || user.phone || '', pincode: init?.pincode || '',
    line1: init?.line1 || '', line2: init?.line2 || '', landmark: init?.landmark || '', city: init?.city || '', state: init?.state || '',
    label: init?.label === 'Work' ? 'Work' : 'Home', isDefault: isFirst || !!init?.isDefault,
  }))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const touched = useRef(false)

  // pincode → city / state autofill
  useEffect(() => {
    if (!/^\d{6}$/.test(f.pincode)) return
    const ctrl = new AbortController()
    fetch(`https://api.postalpincode.in/pincode/${f.pincode}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const po = d?.[0]?.PostOffice?.[0]
        if (po) setF((x) => ({
          ...x,
          city: touched.current || !x.city ? po.District : x.city,
          state: touched.current || !x.state ? (STATES.includes(po.State) ? po.State : 'Other') : x.state,
        }))
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [f.pincode])

  const on = (k) => (e) => {
    let v = e.target.value
    if (k === 'phone') v = v.replace(/\D/g, '').slice(0, 10)
    if (k === 'pincode') { v = v.replace(/\D/g, '').slice(0, 6); touched.current = true }
    setF((x) => ({ ...x, [k]: v })); setErrors((x) => ({ ...x, [k]: null }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.name.trim()) er.name = 'Please enter your name'
    if (!/^[6-9]\d{9}$/.test(f.phone)) er.phone = 'Please enter a valid 10-digit mobile number'
    if (!/^\d{6}$/.test(f.pincode)) er.pincode = 'Please enter a valid 6-digit pin code'
    if (!f.line1.trim()) er.line1 = 'Please enter your address'
    if (!f.line2.trim()) er.line2 = 'Please enter your locality / town'
    if (!f.city.trim()) er.city = 'Required'
    if (!f.state) er.state = 'Required'
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try { await onSave(f); onClose() } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title={init ? 'Edit address' : 'Add new address'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-plum-700/70">Contact details</p>
        <div className="space-y-4">
          <Field label="Name*" value={f.name} onChange={on('name')} error={errors.name} autoComplete="name" />
          <Field label="Mobile no*" prefix="+91" value={f.phone} onChange={on('phone')} error={errors.phone} inputMode="numeric" autoComplete="tel-national" />
        </div>

        <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-plum-700/70">Address</p>
        <div className="space-y-4">
          <Field label="Pin code*" value={f.pincode} onChange={on('pincode')} error={errors.pincode} inputMode="numeric" autoComplete="postal-code" />
          <Field label="Address (house no, building, street, area)*" value={f.line1} onChange={on('line1')} error={errors.line1} autoComplete="address-line1" />
          <Field label="Locality / town*" value={f.line2} onChange={on('line2')} error={errors.line2} autoComplete="address-line2" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City / district*" value={f.city} onChange={on('city')} error={errors.city} autoComplete="address-level2" />
            <div>
              <label className="label">State*</label>
              <select className={`input !rounded ${errors.state ? '!border-rose-500' : ''}`} value={f.state} onChange={on('state')}>
                <option value="">Select</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <p className="mt-1 text-xs text-rose-500">{errors.state}</p>}
            </div>
          </div>
          <Field label="Landmark (optional)" value={f.landmark} onChange={on('landmark')} />
        </div>

        <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-plum-700/70">Save address as</p>
        <div className="flex gap-2">
          {[['Home', 'Home'], ['Work', 'Office']].map(([v, l]) => <button type="button" key={v} onClick={() => setF({ ...f, label: v })} className={`chip ${f.label === v ? 'chip-on' : ''}`}>{l}</button>)}
        </div>
        <label className="mt-4 flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-rose-500" checked={f.isDefault} disabled={isFirst} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} />
          Make this my default address
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <OutlineBtn className="!min-h-[48px]" onClick={onClose}>Cancel</OutlineBtn>
          <PrimaryBtn type="submit" disabled={busy}>{busy ? 'Saving…' : init ? 'Save' : 'Add address'}</PrimaryBtn>
        </div>
      </form>
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function Checkout() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const cfg = useConfig()
  const user = useAuth((s) => s.user)
  const setUser = useAuth((s) => s.setUser)
  const { items, coupon, setCoupon } = useCart()

  const step = STEPS.some(([k]) => k === sp.get('step')) ? sp.get('step') : 'bag'
  const go = (s) => setSp(s === 'bag' ? {} : { step: s })

  const [unsel, setUnsel] = useState(() => new Set()) // keys the shopper un-ticked
  const [addrId, setAddrId] = useState(null)
  const [pins, setPins] = useState({})
  const [dlg, setDlg] = useState(null) // the open dialog: { type, ... }
  const [dpin, setDpin] = useState(null) // pincode checked by a guest: { pin, res }
  const [tab, setTab] = useState('recommended')
  const [method, setMethod] = useState('cod')
  const [note, setNote] = useState('')
  const [offers, setOffers] = useState([])
  const [showAllOffers, setShowAllOffers] = useState(false)
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState(false)
  const close = () => setDlg(null)

  // ── derived money ──
  const sel = items.filter((i) => !unsel.has(i.key))
  const subtotal = sel.reduce((s, i) => s + i.price * i.qty, 0)
  const mrpTotal = sel.reduce((s, i) => s + Math.max(i.mrp || i.price, i.price) * i.qty, 0)
  const mrpDiscount = mrpTotal - subtotal
  const discount = coupon?.discount || 0
  const after = subtotal - discount
  const shipping = sel.length && after < cfg.freeShippingMin ? cfg.shippingFee : 0
  const total = after + shipping

  // ── addresses ──
  const saved = user?.addresses || []
  const ordered = [...saved].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
  const addr = saved.find((a) => a._id === addrId) || saved.find((a) => a.isDefault) || saved[0]
  const pin = addr ? pins[addr.pincode] : null
  const codBlocked = total > cfg.codMax || cfg.codEnabled === false || pin?.cod === false

  const pinsKey = saved.map((a) => a.pincode).join(',')
  useEffect(() => {
    const need = [...new Set(saved.map((a) => a.pincode).filter((p) => /^\d{6}$/.test(p)))].filter((p) => !pins[p])
    need.forEach((p) => shopAPI.pincode(p).then((r) => setPins((x) => ({ ...x, [p]: r.data }))).catch(() => {}))
  }, [pinsKey]) // eslint-disable-line

  useEffect(() => { shopAPI.coupons().then((r) => setOffers(r.data.coupons)).catch(() => {}) }, [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [step])
  useEffect(() => { if (step === 'address' && user && saved.length === 0) setDlg({ type: 'address', init: null }) }, [step]) // eslint-disable-line

  // payment: choose a method (keeps the left tab in sync unless "Recommended" is open)
  const pick = (id) => { setMethod(id); setTab((t) => (t === 'recommended' ? t : id)) }
  useEffect(() => { if (!cfg.onlinePayment && method !== 'cod') pick('cod') }, [cfg.onlinePayment]) // eslint-disable-line
  useEffect(() => { if (method === 'cod' && codBlocked && cfg.onlinePayment) pick('upi') }, [codBlocked, cfg.onlinePayment]) // eslint-disable-line

  // keep the coupon honest when the selection / quantities change
  useEffect(() => {
    if (!coupon) return
    if (!subtotal) return setCoupon(null)
    shopAPI.validateCoupon(coupon.code, subtotal)
      .then((r) => setCoupon({ code: r.data.code, discount: r.data.discount }))
      .catch(() => { setCoupon(null); toast(`Coupon ${coupon.code} removed — order no longer qualifies`, { icon: 'ℹ️' }) })
  }, [subtotal]) // eslint-disable-line

  const applyCoupon = async (c) => {
    try {
      const r = await shopAPI.validateCoupon(String(c).trim(), subtotal)
      setCoupon({ code: r.data.code, discount: r.data.discount }); toast.success(`${r.data.code} applied — you saved ${inr(r.data.discount)}`)
      return true
    } catch (e) { toast.error(errMsg(e)); return false }
  }

  // ── bag edits (these keep the coupon; the effect above re-checks it) ──
  const patchItems = (fn) => useCart.setState((s) => ({ items: fn(s.items) }))
  const toggleSel = (key) => setUnsel((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })
  const allSel = sel.length === items.length
  const toggleAll = () => setUnsel(allSel ? new Set(items.map((i) => i.key)) : new Set())
  const dropFromBag = (keys) => patchItems((l) => l.filter((i) => !keys.has(i.key)))
  const toWishlist = (list) => list.forEach((i) => { if (!useWishlist.getState().ids.includes(i.productId)) useWishlist.getState().toggle(i.productId) })

  const setQty = (item, qty) => patchItems((l) => l.map((i) => (i.key === item.key ? { ...i, qty } : i)))
  const changeSize = (item, product, variant) => {
    const key = lineKey(item.productId, variant._id)
    if (key === item.key) return
    const max = Math.min(10, variant.stock)
    patchItems((l) => {
      const other = l.find((i) => i.key === key)
      const moved = { ...item, key, variantId: variant._id, size: variant.size, max, price: product.price, mrp: product.mrp, qty: Math.min(item.qty, max) }
      if (other) return l.filter((i) => i.key !== item.key).map((i) => (i.key === key ? { ...i, max, qty: Math.min(max, i.qty + item.qty) } : i))
      return l.map((i) => (i.key === item.key ? moved : i))
    })
    setUnsel((s) => { if (!s.has(item.key)) return s; const n = new Set(s); n.delete(item.key); n.add(key); return n })
  }

  // ── address CRUD (stored on the account) ──
  const saveAddress = async (f) => {
    const clean = { label: f.label, name: f.name.trim(), phone: f.phone, line1: f.line1.trim(), line2: f.line2.trim(), landmark: f.landmark.trim(), city: f.city.trim(), state: f.state, pincode: f.pincode }
    let list
    if (f._id) list = saved.map((a) => (a._id === f._id ? { ...a, ...clean } : a))
    else {
      if (saved.length >= 5) throw new Error('You can save up to 5 addresses. Remove one first.')
      list = [...saved, clean]
    }
    const target = f._id ? list.find((a) => a._id === f._id) : clean
    if (f.isDefault || !saved.length) list = list.map((a) => ({ ...a, isDefault: a === target }))
    else if (f._id) list = list.map((a) => (a._id === f._id ? { ...a, isDefault: false } : a))
    if (!list.some((a) => a.isDefault)) list = list.map((a, i) => ({ ...a, isDefault: i === 0 }))
    const r = await authAPI.update({ addresses: list })
    setUser(r.data.user)
    const hit = f._id ? r.data.user.addresses.find((a) => a._id === f._id) : r.data.user.addresses.find((a) => a.pincode === clean.pincode && a.line1 === clean.line1)
    if (hit) setAddrId(hit._id)
    toast.success(f._id ? 'Address updated' : 'Address added')
  }
  const removeAddress = async (a) => {
    let rest = saved.filter((x) => x._id !== a._id)
    if (a.isDefault && rest.length) rest = rest.map((x, i) => ({ ...x, isDefault: i === 0 }))
    try { const r = await authAPI.update({ addresses: rest }); setUser(r.data.user); setAddrId(null); toast.success('Address removed') } catch (e) { toast.error(errMsg(e)) }
  }
  const addAddress = () => (saved.length >= 5 ? toast.error('You can save up to 5 addresses. Remove one first.') : setDlg({ type: 'address', init: null }))

  // ── step transitions ──
  const toAddress = () => {
    if (!sel.length) return toast.error('Select at least one item')
    if (!user) return nav('/login', { state: { from: '/checkout?step=address', mode: 'register', reason: 'checkout' } })
    go('address')
  }
  const toPayment = () => {
    if (!addr) return setDlg({ type: 'address', init: null })
    if (pin && !pin.serviceable) return toast.error(pin.reason || 'We cannot deliver to this pincode')
    go('payment')
  }

  const finish = (order) => {
    setPlaced(true)
    dropFromBag(new Set(sel.map((i) => i.key)))
    authAPI.me().then((r) => setUser(r.data.user)).catch(() => {})
    nav(`/order-success/${order.orderNumber}`, { state: { order, phone: addr.phone } })
  }

  const place = async () => {
    if (!addr) return go('address')
    setBusy(true)
    try {
      const { data } = await orderAPI.place({
        items: sel.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        customer: { name: addr.name || user.name, phone: addr.phone || user.phone, email: user.email },
        address: { line1: addr.line1, line2: addr.line2, landmark: addr.landmark, city: addr.city, state: addr.state, pincode: addr.pincode },
        paymentMethod: method === 'cod' ? 'cod' : 'razorpay',
        couponCode: coupon?.code,
        notes: note,
      })
      if (method === 'cod') return finish(data.order)
      await loadRazorpay()
      const m = METHODS.find((x) => x.id === method)
      const rz = new window.Razorpay({
        key: data.razorpay.keyId, amount: data.razorpay.amount, currency: 'INR', name: 'Shyfly',
        description: `Order ${data.order.orderNumber}`, order_id: data.razorpay.orderId, image: '/icon-192.png',
        theme: { color: '#6b1544' },
        prefill: { name: addr.name || user.name, email: user.email, contact: addr.phone },
        // show the chosen tab's method first; the rest stay available
        config: { display: { blocks: { preferred: { name: m.label, instruments: [{ method }] } }, sequence: ['block.preferred'], preferences: { show_default_blocks: true } } },
        handler: async (resp) => {
          try { const v = await orderAPI.verify(resp); finish(v.data.order) }
          catch (err) {
            toast.error('Payment received but verification is pending. Check Track Order shortly.')
            setPlaced(true); dropFromBag(new Set(sel.map((i) => i.key))); nav('/track')
          }
        },
        modal: { ondismiss: () => { setBusy(false); toast('Payment not completed. Your items are held for 30 minutes.', { icon: '⏳', duration: 5000 }) } },
      })
      rz.on('payment.failed', (r) => toast.error(r.error?.description || 'Payment failed, please try again'))
      rz.open()
    } catch (err) { toast.error(errMsg(err)); setBusy(false) }
  }

  // ── guards (after all hooks) ──
  if (placed) return null
  if (!items.length) return (
    <div className="container-x py-28 text-center">
      <SEO title="Your bag" noindex />
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-blush text-plum-300"><FiShoppingBag size={38} /></div>
      <p className="mt-5 font-display text-5xl font-semibold text-plum-800">Your bag is empty</p>
      <p className="mt-2 text-plum-700/70">Beautiful things are waiting for you.</p>
      <Link to="/shop" className="btn-plum mt-8">Start shopping</Link>
    </div>
  )
  if (step !== 'bag' && !user) return <Navigate to="/login" replace state={{ from: `/checkout?step=${step}`, mode: 'register', reason: 'checkout' }} />
  if (step !== 'bag' && !sel.length) return <Navigate to="/checkout" replace />
  if (step === 'payment' && !addr) return <Navigate to="/checkout?step=address" replace />

  const returnDays = cfg.returnWindowDays
  const checked = dpin?.res?.serviceable ? dpin.res : null
  const etaTo = pin?.serviceable ? pin.to : checked ? checked.to : addDays((cfg.delivery?.max ?? 7))
  const etaRange = pin?.serviceable ? `${dShort(pin.from)} – ${dShort(pin.to)}` : `${dShort(addDays(cfg.delivery?.min ?? 4))} – ${dShort(addDays(cfg.delivery?.max ?? 7))}`
  const onlineOff = !cfg.onlinePayment
  const cta = step === 'bag' ? { label: 'Place order', run: toAddress } : step === 'address' ? { label: 'Continue', run: toPayment } : { label: method === 'cod' ? 'Place order' : `Pay ${inr(total)}`, run: place }
  const ctaOff = busy || !sel.length
    || (step === 'address' && !!addr && pin?.serviceable === false)
    || (step === 'payment' && (method === 'cod' ? codBlocked : onlineOff))
  const back = () => (step === 'bag' ? nav(-1) : go(step === 'payment' ? 'address' : 'bag'))
  const off = (id) => (id === 'cod' ? codBlocked : onlineOff)
  const curTab = METHODS.find((m) => m.id === tab)
  const shownOffers = showAllOffers ? offers : offers.slice(0, 2)

  const doMove = (list) => { toWishlist(list); dropFromBag(new Set(list.map((i) => i.key))); toast.success('Moved to wishlist 💗'); close() }
  const doRemove = (list) => { dropFromBag(new Set(list.map((i) => i.key))); toast.success(list.length > 1 ? 'Items removed from bag' : 'Item removed from bag'); close() }
  const selectedFirst = () => { if (!sel.length) { toast('Select items first'); return false } return true }

  return (
    <div className="container-x pb-2 pt-4 sm:pt-8">
      <SEO title="Checkout" noindex />

      {/* top bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-plum-100 pb-3">
        <button type="button" onClick={back} className="-ml-2 inline-flex min-h-[44px] items-center gap-1 justify-self-start px-2 text-sm font-medium text-plum-800 hover:text-rose-500"><FiChevronLeft size={20} /><span className="hidden sm:inline">Back</span></button>
        <Stepper step={step} onGo={go} />
        <span className="hidden items-center gap-1.5 justify-self-end text-[11px] font-bold uppercase tracking-wide text-plum-700/70 sm:flex"><FiShield className="text-green-600" size={16} /> 100% secure</span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        {/* ───── left column ───── */}
        <div className="space-y-4">
          {step === 'bag' && (
            <>
              {/* delivery strip */}
              <div className="flex items-center justify-between gap-3 rounded border border-plum-100 bg-white p-3.5 text-sm">
                {user && addr ? (
                  <>
                    <p className="flex min-w-0 items-center gap-2"><FiMapPin className="shrink-0 text-rose-500" /><span className="truncate">Deliver to: <b>{addr.name}, {addr.pincode}</b></span></p>
                    <OutlineBtn onClick={() => setDlg({ type: 'addrPick' })}>Change<span className="hidden sm:inline">&nbsp;address</span></OutlineBtn>
                  </>
                ) : checked ? (
                  <>
                    <p className="min-w-0 text-sm"><FiMapPin className="mr-1.5 inline text-rose-500" />Deliver to: <b>{dpin.pin}</b><span className="block text-xs text-green-700 sm:ml-1 sm:inline">· Get it by {dShort(checked.to)}{checked.cod ? ' · Pay on Delivery available' : ''}</span></p>
                    <OutlineBtn onClick={() => setDlg({ type: 'pin' })}>Change</OutlineBtn>
                  </>
                ) : (
                  <>
                    <div className="min-w-0"><p className="flex items-center gap-2 font-bold text-plum-900"><FiMapPin className="text-rose-500" />Check delivery time & services</p>{dpin?.res && !dpin.res.serviceable && <p className="mt-1 text-xs text-rose-600">✕ {dpin.res.reason}</p>}</div>
                    <OutlineBtn onClick={() => setDlg({ type: 'pin' })}>Enter pin code</OutlineBtn>
                  </>
                )}
              </div>

              {/* available offers */}
              {offers.length > 0 && (
                <div className="rounded border border-plum-100 bg-white p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-plum-900"><FiPercent className="text-rose-500" /> Available offers</p>
                  <ul className="mt-2 space-y-1.5 text-[13px] text-plum-800/85">
                    {shownOffers.map((o) => <li key={o.code}>• <b>{o.code}</b>{o.description ? ` — ${o.description}` : ''}{o.minOrder > 0 ? ` (min. order ${inr(o.minOrder)})` : ''}</li>)}
                  </ul>
                  {offers.length > 2 && <button type="button" onClick={() => setShowAllOffers((v) => !v)} className="mt-2 text-xs font-bold text-rose-500">{showAllOffers ? 'Show less' : `Show ${offers.length - 2} more`} <FiChevronDown className={`inline transition ${showAllOffers ? 'rotate-180' : ''}`} /></button>}
                </div>
              )}

              <FreeShipBar subtotal={subtotal} />

              {/* selection bar */}
              <div className="flex items-center justify-between gap-3 rounded border border-plum-100 bg-white p-3.5">
                <label className="flex min-h-[40px] cursor-pointer items-center gap-3 text-xs font-bold uppercase tracking-wide text-plum-800">
                  <input type="checkbox" className="h-5 w-5 accent-rose-500" checked={allSel} onChange={toggleAll} />
                  {sel.length}/{items.length} items selected
                </label>
                <div className="flex items-center text-[11px] font-bold uppercase tracking-wide text-plum-700">
                  <button type="button" onClick={() => selectedFirst() && setDlg({ type: 'bulkRemove' })} className="px-2 py-3 hover:text-rose-500">Remove</button>
                  <span className="text-plum-300">|</span>
                  <button type="button" onClick={() => selectedFirst() && setDlg({ type: 'bulkMove' })} className="px-2 py-3 hover:text-rose-500">Move to wishlist</button>
                </div>
              </div>

              {items.map((i) => (
                <BagItem key={i.key} i={i} checked={!unsel.has(i.key)} onToggle={() => toggleSel(i.key)} returnDays={returnDays} eta={dShort(etaTo)}
                  onSize={() => setDlg({ type: 'size', item: i })} onQty={() => setDlg({ type: 'qty', item: i })} onRemove={() => setDlg({ type: 'remove', item: i })} />
              ))}

              <Link to="/wishlist" className="flex items-center justify-between rounded border border-plum-100 bg-white p-4 text-sm font-bold uppercase tracking-wide text-plum-800 hover:border-rose-300">
                <span className="flex items-center gap-2"><FiHeart className="text-rose-500" /> Add more from wishlist</span><FiChevronRight />
              </Link>
            </>
          )}

          {step === 'address' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-plum-800">Select delivery address</h2>
                <OutlineBtn onClick={addAddress}><FiPlus className="mr-1 inline" />Add new address</OutlineBtn>
              </div>
              {saved.length === 0 && (
                <div className="rounded border border-dashed border-plum-200 bg-white p-10 text-center">
                  <FiMapPin className="mx-auto text-rose-500" size={28} />
                  <p className="mt-3 font-medium text-plum-800">No saved address yet</p>
                  <PrimaryBtn onClick={addAddress} className="mt-5">Add address</PrimaryBtn>
                </div>
              )}
              {ordered.some((a) => a.isDefault) && <p className="pt-1 text-xs font-bold uppercase tracking-wide text-plum-700/70">Default address</p>}
              {ordered.filter((a) => a.isDefault).map((a) => <AddressCard key={a._id} a={a} selected={addr?._id === a._id} pinRes={pins[a.pincode]} onSelect={() => setAddrId(a._id)} onEdit={() => setDlg({ type: 'address', init: a })} onRemove={() => setDlg({ type: 'delAddr', a })} />)}
              {ordered.some((a) => !a.isDefault) && <p className="pt-1 text-xs font-bold uppercase tracking-wide text-plum-700/70">Other addresses</p>}
              {ordered.filter((a) => !a.isDefault).map((a) => <AddressCard key={a._id} a={a} selected={addr?._id === a._id} pinRes={pins[a.pincode]} onSelect={() => setAddrId(a._id)} onEdit={() => setDlg({ type: 'address', init: a })} onRemove={() => setDlg({ type: 'delAddr', a })} />)}
            </>
          )}

          {step === 'payment' && addr && (
            <>
              <div className="flex items-start justify-between gap-3 rounded border border-plum-100 bg-white p-4 text-sm">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-plum-700/60">Delivering to</p>
                  <p className="mt-1"><b>{addr.name}</b> · {addr.phone}</p>
                  <p className="text-plum-800/70">{lineOf(addr)}, {addr.city} – {addr.pincode}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700"><FiTruck /> Estimated delivery by <b>{pin?.serviceable ? dShort(pin.to) : dShort(etaTo)}</b></p>
                </div>
                <OutlineBtn onClick={() => go('address')}>Change</OutlineBtn>
              </div>

              <h2 className="pt-1 text-sm font-bold uppercase tracking-wide text-plum-800">Choose payment mode</h2>
              <div className="overflow-hidden rounded border border-plum-100 bg-white md:grid md:grid-cols-[250px_minmax(0,1fr)]">
                <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-plum-100 bg-blush/50 p-3 md:flex-col md:gap-0 md:border-b-0 md:border-r md:p-0">
                  {[{ id: 'recommended', label: 'Recommended', Icon: FiCheck }, ...METHODS].map(({ id, label, Icon }) => {
                    const dis = id !== 'recommended' && off(id)
                    const on = tab === id
                    return (
                      <button key={id} type="button" disabled={dis} onClick={() => { setTab(id); if (id !== 'recommended') setMethod(id) }}
                        className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition md:rounded-none md:border-0 md:border-l-4 md:px-5 md:py-4 ${on ? 'border-rose-500 text-rose-500 md:border-l-rose-500 md:bg-white' : 'border-plum-100 bg-white text-plum-800 md:border-l-transparent md:bg-transparent'} ${dis ? 'cursor-not-allowed opacity-40' : ''}`}>
                        <Icon size={17} />{id === 'cod' ? 'Cash on Delivery' : label}
                      </button>
                    )
                  })}
                </div>

                <div className="p-5 sm:p-7">
                  {tab === 'recommended' ? (
                    <>
                      <p className="text-sm font-bold uppercase tracking-wide text-plum-800">Recommended payment options</p>
                      <div className="mt-4 divide-y divide-plum-100 rounded border border-plum-100">
                        {RECOMMENDED.map((id) => {
                          const m = METHODS.find((x) => x.id === id)
                          const dis = off(id)
                          return (
                            <label key={id} className={`flex items-center gap-3 p-4 text-sm ${dis ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
                              <input type="radio" name="rec" disabled={dis} checked={method === id} onChange={() => setMethod(id)} className="h-4 w-4 accent-rose-500" />
                              <m.Icon className="text-plum-700" size={18} />
                              <span className="min-w-0"><b className="block text-plum-900">{m.short}</b>{id === 'cod' && dis && <span className="text-xs text-amber-700">Not available for this order</span>}</span>
                            </label>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="flex items-center gap-2 text-base font-semibold text-plum-800"><curTab.Icon className="text-rose-500" />{curTab.short}</p>
                      <p className="mt-2 text-sm leading-relaxed text-plum-800/70">{curTab.blurb}</p>
                    </>
                  )}

                  {/* status line for the chosen method */}
                  {(tab === 'recommended' || tab === method) && (
                    method === 'cod' ? (
                      codBlocked
                        ? <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">{cfg.codEnabled === false || pin?.cod === false ? 'Cash on Delivery is not available for this order.' : `Cash on Delivery is available up to ${inr(cfg.codMax)}. Please pay online.`}</p>
                        : <p className="mt-4 rounded bg-blush p-3 text-sm text-plum-800">Cash/UPI accepted at delivery. You will pay <b>{inr(total)}</b> when the order arrives. Please keep the exact amount handy.</p>
                    ) : onlineOff
                      ? <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">Online payment is currently unavailable. Please choose Cash on Delivery.</p>
                      : <p className="mt-4 flex items-start gap-2 rounded bg-blush p-3 text-sm text-plum-800"><FiLock className="mt-0.5 shrink-0" /><span>You will pay <b>{inr(total)}</b> securely in Razorpay’s payment window. We never see or store your card details.</span></p>
                  )}
                </div>
              </div>

              <details className="rounded border border-plum-100 bg-white p-4 text-sm">
                <summary className="cursor-pointer font-medium text-plum-800">Add a gift message or delivery instruction (optional)</summary>
                <textarea rows={2} className="input mt-3 !rounded" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Gift message, delivery instructions…" />
              </details>
            </>
          )}
        </div>

        {/* ───── right column ───── */}
        <aside className="stick-lg h-fit space-y-4">
          {step === 'bag' && (
            <section className="rounded border border-plum-100 bg-white p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-plum-700/70">Coupons</h3>
              {coupon ? (
                <div className="text-sm">
                  <p className="flex items-center gap-2 text-green-800"><FiCheck className="shrink-0" /><span><b>{coupon.code}</b> applied · saved {inr(coupon.discount)}</span></p>
                  <div className="mt-2 flex gap-4 pl-6 text-xs font-bold uppercase tracking-wide">
                    <button type="button" onClick={() => setDlg({ type: 'coupon' })} className="text-rose-500">Change</button>
                    <button type="button" onClick={() => setCoupon(null)} className="text-plum-700">Remove</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-plum-900"><FiTag className="text-plum-700" /> Apply coupons</span>
                  <OutlineBtn onClick={() => setDlg({ type: 'coupon' })}>Apply</OutlineBtn>
                </div>
              )}
            </section>
          )}

          <div className="rounded border border-plum-100 bg-white p-5">
            <PriceDetails count={sel.reduce((s, i) => s + i.qty, 0)} mrpTotal={mrpTotal} mrpDiscount={mrpDiscount} discount={discount} shipping={shipping} shippingFee={cfg.shippingFee} total={total}
              onCoupon={step === 'bag' && !coupon ? () => setDlg({ type: 'coupon' }) : undefined} onShipInfo={() => setDlg({ type: 'shipInfo' })} />
            {/* desktop only — phones use the sticky bar below */}
            <PrimaryBtn onClick={cta.run} disabled={ctaOff} className="mt-5 w-full max-lg:hidden">
              {step === 'payment' && <FiLock size={15} />} {busy ? 'Please wait…' : cta.label}
            </PrimaryBtn>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] leading-tight text-plum-800">
            <div className="rounded border border-plum-100 bg-white p-2.5"><FiShield className="mx-auto mb-1 text-green-600" size={18} />100% secure payments</div>
            <div className="rounded border border-plum-100 bg-white p-2.5"><FiRefreshCw className="mx-auto mb-1 text-rose-500" size={18} />{returnDays > 0 ? `${returnDays}-day easy returns` : 'Quality checked'}</div>
            <div className="rounded border border-plum-100 bg-white p-2.5"><FiTruck className="mx-auto mb-1 text-plum-700" size={18} />Tracked delivery</div>
          </div>
          <p className="text-center text-xs text-plum-700/60">Online payments are processed by Razorpay (PCI-DSS compliant).</p>
        </aside>
      </div>

      {/* phone sticky bar — the only Place-order button on small screens */}
      <div className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-plum-100 bg-white p-3 lg:hidden">
        <div className="flex items-center gap-4">
          <div><p className="text-xs text-plum-700/60">Total</p><p className="text-xl font-semibold leading-tight text-plum-800">{inr(total)}</p></div>
          <PrimaryBtn onClick={cta.run} disabled={ctaOff} className="flex-1">
            {step === 'payment' && <FiLock size={15} />} {busy ? 'Please wait…' : cta.label}
          </PrimaryBtn>
        </div>
      </div>

      {/* dialogs */}
      <AnimatePresence>
        {dlg?.type === 'size' && <SizeModal key={`size-${dlg.item.key}`} item={dlg.item} onClose={close} onDone={(p, v) => changeSize(dlg.item, p, v)} />}
        {dlg?.type === 'qty' && <QtyModal key={`qty-${dlg.item.key}`} item={dlg.item} onClose={close} onDone={(q) => setQty(dlg.item, q)} />}
        {dlg?.type === 'remove' && (
          <Confirm key="remove" title="Remove from bag" onClose={close} body="Are you sure you want to remove this item from bag?"
            left={{ label: 'Remove', run: () => doRemove([dlg.item]) }} right={{ label: 'Move to wishlist', run: () => doMove([dlg.item]) }}>
            <div className="mb-4 flex items-center gap-3"><Thumb i={dlg.item} /><div className="min-w-0 text-sm"><p className="truncate font-bold text-plum-900">{dlg.item.name}</p><p className="text-plum-700/70">{[dlg.item.color, dlg.item.size && `Size ${dlg.item.size}`].filter(Boolean).join(' · ')}</p><p className="mt-1 font-bold text-plum-800">{inr(dlg.item.price * dlg.item.qty)}</p></div></div>
          </Confirm>
        )}
        {dlg?.type === 'bulkRemove' && (
          <Confirm key="bulkRemove" title={`Remove ${sel.length} item${sel.length > 1 ? 's' : ''}`} onClose={close} body={`Are you sure you want to remove the ${sel.length} selected item${sel.length > 1 ? 's' : ''} from your bag?`}
            left={{ label: 'Cancel', run: close }} right={{ label: 'Remove', run: () => doRemove(sel) }} />
        )}
        {dlg?.type === 'bulkMove' && (
          <Confirm key="bulkMove" title={`Move ${sel.length} item${sel.length > 1 ? 's' : ''} to wishlist`} onClose={close} body="The selected items will be removed from your bag and saved to your wishlist."
            left={{ label: 'Cancel', run: close }} right={{ label: 'Move to wishlist', run: () => doMove(sel) }} />
        )}
        {dlg?.type === 'coupon' && <CouponModal key="coupon" coupon={coupon} offers={offers} subtotal={subtotal} onApply={applyCoupon} onClose={close} />}
        {dlg?.type === 'pin' && <PincodeModal key="pin" initial={dpin?.pin} onClose={close} onResult={setDpin} />}
        {dlg?.type === 'addrPick' && <AddressPicker key="addrPick" saved={ordered} selectedId={addr?._id} pins={pins} onClose={close} onPick={setAddrId} onAdd={addAddress} />}
        {dlg?.type === 'address' && <AddressModal key={dlg.init?._id || 'new'} init={dlg.init} user={user} isFirst={saved.length === 0} onClose={close} onSave={saveAddress} />}
        {dlg?.type === 'delAddr' && (
          <Confirm key="delAddr" title="Remove address" onClose={close} body="Are you sure you want to delete this address?"
            left={{ label: 'Cancel', run: close }} right={{ label: 'Remove', run: () => { removeAddress(dlg.a); close() } }}>
            <p className="mb-3 rounded bg-blush p-3 text-sm text-plum-800"><b>{dlg.a.name}</b><br />{lineOf(dlg.a)}, {dlg.a.city} – {dlg.a.pincode}</p>
          </Confirm>
        )}
        {dlg?.type === 'shipInfo' && (
          <Modal key="shipInfo" title="Shipping fee" onClose={close} footer={<PrimaryBtn className="w-full" onClick={close}>Got it</PrimaryBtn>}>
            <p className="text-sm leading-relaxed text-plum-800/85">Delivery is <b>free</b> on orders of {inr(cfg.freeShippingMin)} or more (after coupon discount). Below that, a flat shipping fee of <b>{inr(cfg.shippingFee)}</b> applies.</p>
            <p className="mt-3 text-sm text-plum-800/85">Estimated delivery: <b>{etaRange}</b>.</p>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
