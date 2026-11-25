import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiUser, FiPackage, FiStar, FiEdit2, FiCheck, FiTruck, FiGift, FiPercent, FiMapPin } from 'react-icons/fi'
import SEO from '../components/SEO'
import OrderTracker from '../components/OrderTracker'
import { authAPI, orderAPI } from '../services/api'
import { useAuth } from '../store'
import { errMsg } from '../lib/format'

const TABS = [['profile', 'My Profile', FiUser], ['orders', 'My Orders', FiPackage], ['premium', 'Shyfly Premium', FiStar]]

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 border-b border-plum-50 py-3.5 last:border-0">
    <span className="text-sm text-plum-700/60">{label}</span>
    <span className="text-right text-[15px] font-medium text-plum-800">{children}</span>
  </div>
)

function Profile({ user, setUser }) {
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState({ name: user.name || '', phone: user.phone || '' })
  const [busy, setBusy] = useState(false)
  const addrs = user.addresses || []
  const open = () => { setF({ name: user.name || '', phone: user.phone || '' }); setEdit(true) }
  const save = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return toast.error('Name is required')
    if (f.phone && !/^[6-9]\d{9}$/.test(f.phone)) return toast.error('Enter a valid 10-digit mobile number')
    setBusy(true)
    try { const r = await authAPI.update({ name: f.name.trim(), phone: f.phone }); setUser(r.data.user); setEdit(false); toast.success('Profile updated') }
    catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  const saveAddrs = async (list, msg) => {
    try { const r = await authAPI.update({ addresses: list }); setUser(r.data.user); toast.success(msg) } catch (err) { toast.error(errMsg(err)) }
  }
  const makeDefault = (id) => saveAddrs(addrs.map((a) => ({ ...a, isDefault: a._id === id })), 'Default address changed')
  const remove = (a) => {
    if (!window.confirm('Remove this address?')) return
    const rest = addrs.filter((x) => x._id !== a._id)
    if (a.isDefault && rest.length) rest[0] = { ...rest[0], isDefault: true }
    saveAddrs(rest, 'Address removed')
  }
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="h-fit rounded-3xl bg-blush p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-plum-700 font-display text-2xl text-white">{(user.name || '?').trim()[0]?.toUpperCase()}</span>
            <h2 className="font-display text-2xl font-semibold text-plum-800 sm:text-3xl">My Profile</h2>
          </div>
          {!edit && <button onClick={open} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-plum-200 bg-white px-4 text-sm text-plum-800 hover:border-rose-400 hover:text-rose-500"><FiEdit2 size={14} /> Edit</button>}
        </div>

        {!edit ? (
          <div className="mt-5 rounded-2xl bg-white px-5">
            <Row label="Name">{user.name}</Row>
            <Row label="Mobile">{user.phone ? `+91 ${user.phone}` : <button onClick={open} className="text-rose-500 underline">Add mobile number</button>}</Row>
            <Row label="Email"><span className="break-all">{user.email}</span></Row>
          </div>
        ) : (
          <form onSubmit={save} className="mt-5 space-y-4">
            <div><label className="label">Name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></div>
            <div><label className="label">Mobile</label><input className="input" inputMode="numeric" autoComplete="tel-national" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
            <div><label className="label">Email</label><input className="input opacity-60" value={user.email} disabled /></div>
            <div className="flex gap-3"><button disabled={busy} className="btn-plum flex-1">{busy ? 'Saving…' : 'Save'}</button><button type="button" onClick={() => setEdit(false)} className="btn-outline flex-1">Cancel</button></div>
          </form>
        )}
      </section>

      <section className="h-fit rounded-3xl border border-plum-100 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-3xl font-semibold text-plum-800"><FiMapPin size={22} className="text-rose-500" /> Saved address</h2>
        {addrs.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-plum-700/70">No address saved yet. Enter it once while placing your order — we’ll save it and fill it in for you next time.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {addrs.map((a) => (
              <div key={a._id} className="rounded-2xl bg-blush/60 p-4 text-[15px] leading-relaxed text-plum-800">
                <div className="flex items-start justify-between gap-3">
                  <b>{a.name}</b>
                  {a.isDefault && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"><FiCheck size={12} /> Default</span>}
                </div>
                <p className="mt-1 text-plum-700/80">{[a.line1, a.line2, a.landmark].filter(Boolean).join(', ')}<br />{a.city}, {a.state} – {a.pincode}</p>
                {a.phone && <p className="text-sm text-plum-700/60">+91 {a.phone}</p>}
                <div className="mt-2 flex gap-5 text-sm">
                  {!a.isDefault && <button onClick={() => makeDefault(a._id)} className="text-rose-500 underline">Make default</button>}
                  <button onClick={() => remove(a)} className="text-plum-700/60 underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Premium() {
  const perks = [[FiTruck, 'Free delivery', 'On every order, no minimum.'], [FiPercent, 'Member-only prices', 'Special offers kept just for members.'], [FiGift, 'Early access', 'Shop new collections before everyone else.']]
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-plum-800 to-rose-500 p-7 text-white sm:p-10">
      <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[.2em]">Coming soon</span>
      <h2 className="mt-5 font-display text-5xl font-semibold leading-none sm:text-6xl">Shyfly Premium</h2>
      <p className="mt-4 max-w-xl text-white/85">A little extra love for our regulars. We’re putting the finishing touches on it — you’ll find it right here when it’s ready.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {perks.map(([I, t, d]) => (
          <div key={t} className="rounded-2xl bg-white/10 p-5 backdrop-blur"><I size={22} /><p className="mt-3 font-medium">{t}</p><p className="mt-1 text-sm text-white/75">{d}</p></div>
        ))}
      </div>
    </div>
  )
}

export default function Account() {
  const { user, setUser, logout } = useAuth()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const tab = TABS.some(([k]) => k === sp.get('tab')) ? sp.get('tab') : 'profile' // always open on My Profile (view mode)
  const [orders, setOrders] = useState(null)
  const load = () => orderAPI.mine().then((r) => setOrders(r.data.orders)).catch(() => setOrders([]))
  useEffect(() => { if (user) load() }, [user?._id]) // eslint-disable-line
  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />

  const cancel = async (o) => {
    const paid = o.payment?.status === 'paid'
    if (!window.confirm(paid ? 'Cancel this order? Your payment will be refunded to the original payment method.' : 'Cancel this order?')) return
    try { const r = await orderAPI.cancel({ orderNumber: o.orderNumber, phone: o.customer?.phone || user.phone || '' }); setOrders((x) => x.map((y) => (y._id === o._id ? { ...y, ...r.data.order } : y))); toast.success(paid ? 'Order cancelled — refund started' : 'Order cancelled') }
    catch (err) { toast.error(errMsg(err)) }
  }
  return (
    <div className="container-x py-10 sm:py-12">
      <SEO title="My account" noindex />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Hello</p><h1 className="h-section mt-2">{user.name}</h1></div>
        <div className="flex gap-3">{user.role === 'admin' && <Link to="/admin" className="btn-rose">Admin panel</Link>}<button onClick={() => { logout(); nav('/') }} className="btn-outline">Log out</button></div>
      </div>

      <div role="tablist" className="mt-8 flex flex-wrap gap-2">
        {TABS.map(([k, label, I]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setSp(k === 'profile' ? {} : { tab: k }, { replace: true })}
            className={`inline-flex min-h-[46px] items-center gap-2 rounded-full border px-4 text-sm sm:px-5 font-medium transition ${tab === k ? 'border-plum-700 bg-plum-700 text-white' : 'border-plum-200 bg-white text-plum-800 hover:border-rose-400'}`}>
            <I size={16} /> {label}{k === 'orders' && orders?.length ? <span className={`rounded-full px-2 text-xs ${tab === k ? 'bg-white/20' : 'bg-plum-50'}`}>{orders.length}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'profile' && <Profile user={user} setUser={setUser} />}
        {tab === 'orders' && (
          <div className="space-y-5">
            {orders === null ? <div className="skeleton h-40 rounded-3xl" /> : orders.length === 0
              ? <p className="rounded-3xl border border-dashed border-plum-200 p-10 text-center text-plum-700/70">No orders yet. <Link to="/shop" className="text-rose-500 underline">Start shopping</Link></p>
              : orders.map((o) => <OrderTracker key={o._id} order={o} onCancel={cancel} onReload={load} />)}
          </div>
        )}
        {tab === 'premium' && <Premium />}
      </div>
    </div>
  )
}
