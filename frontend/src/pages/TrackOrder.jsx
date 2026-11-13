import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import OrderTracker from '../components/OrderTracker'
import { orderAPI } from '../services/api'
import { errMsg } from '../lib/format'
import { Butterfly } from '../lib/art'

export default function TrackOrder() {
  const [sp] = useSearchParams()
  const [orderNumber, setN] = useState(sp.get('order') || '')
  const [phone, setP] = useState('')
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)

  const lookup = async (e) => {
    e?.preventDefault(); setBusy(true)
    try { const r = await orderAPI.track({ orderNumber: orderNumber.trim(), phone }); setOrder(r.data.order) }
    catch (err) { setOrder(null); toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  const cancel = async (o) => {
    if (!window.confirm('Cancel this order?')) return
    try { const r = await orderAPI.cancel({ orderNumber: o.orderNumber, phone }); setOrder(r.data.order); toast.success('Order cancelled') } catch (err) { toast.error(errMsg(err)) }
  }
  useEffect(() => { document.getElementById('track-phone')?.focus() }, [])

  return (
    <div className="container-x max-w-3xl py-14">
      <SEO title="Track your order" />
      <div className="text-center"><div className="mx-auto w-16"><Butterfly /></div><h1 className="h-section mt-2">Track your order</h1><p className="mt-2 text-plum-700/70">Enter your order number and the mobile number used at checkout.</p></div>
      <form onSubmit={lookup} className="mt-8 grid gap-3 rounded-3xl bg-blush p-5 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input uppercase" placeholder="Order no. e.g. SHY-261112-AB12" value={orderNumber} onChange={(e) => setN(e.target.value)} required />
        <input id="track-phone" className="input" placeholder="Mobile number" inputMode="numeric" value={phone} onChange={(e) => setP(e.target.value.replace(/\D/g, '').slice(0, 10))} required />
        <button disabled={busy} className="btn-plum">{busy ? 'Finding…' : 'Track'}</button>
      </form>
      {order && <div className="mt-8"><OrderTracker order={order} onCancel={cancel} onReload={() => lookup()} /></div>}
    </div>
  )
}
