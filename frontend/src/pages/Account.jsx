import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import OrderTracker from '../components/OrderTracker'
import { authAPI, orderAPI } from '../services/api'
import { useAuth } from '../store'
import { errMsg } from '../lib/format'

export default function Account() {
  const { user, setUser, logout } = useAuth()
  const nav = useNavigate()
  const [orders, setOrders] = useState(null)
  const [f, setF] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (user) orderAPI.mine().then((r) => setOrders(r.data.orders)).catch(() => setOrders([])) }, [user?._id]) // eslint-disable-line
  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />

  const save = async (e) => { e.preventDefault(); setBusy(true); try { const r = await authAPI.update(f); setUser(r.data.user); toast.success('Profile updated') } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) } }
  const cancel = async (o) => {
    if (!window.confirm('Cancel this order?')) return
    try { const r = await orderAPI.cancel({ orderNumber: o.orderNumber, phone: user.phone || '' }); setOrders((x) => x.map((y) => (y._id === o._id ? r.data.order : y))); toast.success('Order cancelled') }
    catch (err) { toast.error(errMsg(err)) }
  }
  return (
    <div className="container-x py-12">
      <SEO title="My account" noindex />
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Hello</p><h1 className="h-section mt-2">{user.name}</h1></div>
        <div className="flex gap-3">{user.role === 'admin' && <Link to="/admin" className="btn-rose">Admin panel</Link>}<button onClick={() => { logout(); nav('/') }} className="btn-outline">Log out</button></div></div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[320px_1fr]">
        <form onSubmit={save} className="h-fit space-y-4 rounded-3xl bg-blush p-6">
          <h2 className="font-display text-3xl font-semibold text-plum-800">Profile</h2>
          <div><label className="label">Name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="label">Mobile</label><input className="input" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
          <div><label className="label">Email</label><input className="input opacity-60" value={user.email} disabled /></div>
          <button disabled={busy} className="btn-plum w-full">Save</button>
        </form>
        <div>
          <h2 className="font-display text-3xl font-semibold text-plum-800">My orders</h2>
          <div className="mt-5 space-y-5">
            {orders === null ? <div className="skeleton h-40 rounded-3xl" /> : orders.length === 0 ? <p className="rounded-3xl border border-dashed border-plum-200 p-10 text-center text-plum-700/70">No orders yet. <Link to="/shop" className="text-rose-500 underline">Start shopping</Link></p> : orders.map((o) => <OrderTracker key={o._id} order={o} onCancel={user.phone ? cancel : undefined} onReload={() => orderAPI.mine().then((r) => setOrders(r.data.orders))} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
