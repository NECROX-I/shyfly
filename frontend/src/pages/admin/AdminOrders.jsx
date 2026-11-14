import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminAPI } from '../../services/api'
import { inr, fmtDate, errMsg, STATUS_LABEL } from '../../lib/format'
import { useDebounce } from '../../lib/hooks'

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
const tone = { placed: 'bg-blue-50 text-blue-700', confirmed: 'bg-indigo-50 text-indigo-700', packed: 'bg-amber-50 text-amber-700', shipped: 'bg-purple-50 text-purple-700', out_for_delivery: 'bg-purple-50 text-purple-700', delivered: 'bg-green-50 text-green-700', cancelled: 'bg-rose-50 text-rose-700', returned: 'bg-rose-50 text-rose-700' }

function Detail({ o, onSaved }) {
  const [f, setF] = useState({ status: o.status, courier: o.courier || '', trackingId: o.trackingId || '', note: '', paymentStatus: o.payment.status, adminNotes: o.adminNotes || '' })
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try { const r = await adminAPI.updateOrder(o._id, f); toast.success('Order updated'); onSaved(r.data.order) } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }
  // one-click WhatsApp: opens WhatsApp (app/web) with the customer's number and a ready message — free, no API needed
  const wa = async (kind) => {
    try {
      const { data } = await adminAPI.invoiceLink(o._id)
      const first = o.customer.name.split(' ')[0]
      const text = kind === 'invoice'
        ? `Hi ${first}, thank you for shopping with Shyfly! 💗\nOrder ${o.orderNumber} · ${inr(o.total)}\nDownload your invoice: ${data.pdf}`
        : `Hi ${first}, update on your Shyfly order ${o.orderNumber}: ${STATUS_LABEL[o.status] || o.status}.${o.trackingId ? `\nCourier: ${o.courier || ''} · Tracking ID: ${o.trackingId}` : ''}\nTrack here: ${data.track}`
      window.open(`https://wa.me/${data.phone}?text=${encodeURIComponent(text)}`, '_blank')
    } catch (e) { toast.error(errMsg(e)) }
  }
  const emailInvoice = async () => { try { await adminAPI.sendInvoice(o._id); toast.success(`Invoice emailed to ${o.customer.email}`) } catch (e) { toast.error(errMsg(e)) } }
  const refund = async () => {
    if (!window.confirm(`Refund ${inr(o.total)} to the customer's original payment method? This cannot be undone.`)) return
    try { const r = await adminAPI.refund(o._id, {}); toast.success('Refund initiated'); onSaved(r.data.order) } catch (e) { toast.error(errMsg(e)) }
  }
  return (
    <div className="grid gap-6 border-t border-plum-100 bg-blush/60 p-5 lg:grid-cols-2">
      <div className="space-y-2 text-sm">
        <p><b>{o.customer.name}</b> · {o.customer.phone} {o.customer.email && `· ${o.customer.email}`}</p>
        <p className="text-plum-800/80">{[o.address.line1, o.address.line2, o.address.landmark, o.address.city, o.address.state, o.address.pincode].filter(Boolean).join(', ')}</p>
        {o.notes && <p className="rounded-xl bg-white p-3">📝 {o.notes}</p>}
        <div className="divide-y divide-plum-100 rounded-xl bg-white px-3">{o.items.map((i, k) => <div key={k} className="flex justify-between py-2"><span>{i.name} <span className="text-plum-700/60">{[i.color, i.size].filter(Boolean).join('/')} × {i.qty}</span></span><b>{inr(i.price * i.qty)}</b></div>)}</div>
        <p className="text-plum-700/70">Subtotal {inr(o.subtotal)}{o.discount ? ` · Coupon ${o.couponCode} −${inr(o.discount)}` : ''} · Ship {inr(o.shipping)}{o.codFee ? ` · COD ${inr(o.codFee)}` : ''}</p>
        {o.payment.razorpayPaymentId && <p className="text-xs text-plum-700/60">Razorpay: {o.payment.razorpayPaymentId}</p>}
        <div className="pt-1 text-xs text-plum-700/60">{o.timeline.map((t, k) => <div key={k}>• {STATUS_LABEL[t.status] || t.status} — {fmtDate(t.at)} {t.note && `(${t.note})`}</div>)}</div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Status</label><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
          <div><label className="label">Payment</label><select className="input" value={f.paymentStatus} onChange={(e) => setF({ ...f, paymentStatus: e.target.value })}>{['pending', 'paid', 'failed', 'refund_pending', 'refunded'].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Courier</label><input className="input" value={f.courier} onChange={(e) => setF({ ...f, courier: e.target.value })} placeholder="Delhivery, India Post…" /></div>
          <div><label className="label">Tracking ID</label><input className="input" value={f.trackingId} onChange={(e) => setF({ ...f, trackingId: e.target.value })} /></div>
        </div>
        <div><label className="label">Note on status change (shown in timeline)</label><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
        <div><label className="label">Internal note</label><input className="input" value={f.adminNotes} onChange={(e) => setF({ ...f, adminNotes: e.target.value })} /></div>
        <button onClick={save} disabled={busy} className="btn-plum w-full">{busy ? 'Saving…' : 'Save changes'}</button>
        <div className="flex flex-wrap gap-3">
          <a href={`/invoice?order=${o.orderNumber}&phone=${o.customer.phone}`} target="_blank" rel="noreferrer" className="btn-outline !py-2.5 !text-[11px]">Invoice (PDF)</a>
          <button onClick={() => wa('invoice')} className="btn-outline !border-green-600 !py-2.5 !text-[11px] !text-green-700 hover:!bg-green-600 hover:!text-white">WhatsApp invoice</button>
          <button onClick={() => wa('update')} className="btn-outline !border-green-600 !py-2.5 !text-[11px] !text-green-700 hover:!bg-green-600 hover:!text-white">WhatsApp update</button>
          {o.customer.email && <button onClick={emailInvoice} className="btn-outline !py-2.5 !text-[11px]">Email invoice</button>}
          {o.payment.method === 'razorpay' && ['paid', 'refund_pending'].includes(o.payment.status) && <button onClick={refund} className="btn-outline !border-rose-500 !py-2.5 !text-[11px] !text-rose-600 hover:!bg-rose-500 hover:!text-white">Refund {inr(o.total)} via Razorpay</button>}
        </div>
        <p className="text-xs text-plum-700/60">Cancelling restocks items automatically and emails the customer (if email is set up).</p>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const dq = useDebounce(q, 350)
  const [data, setData] = useState({ orders: [], total: 0, pages: 1, page: 1 })
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)
  const [loading, setLoading] = useState(true)
  const status = sp.get('status') || ''
  useEffect(() => { setPage(1) }, [status, dq])
  useEffect(() => { setLoading(true); adminAPI.orders({ status, q: dq, page }).then((r) => setData(r.data)).finally(() => setLoading(false)) }, [status, dq, page])
  const replace = (o) => setData((d) => ({ ...d, orders: d.orders.map((x) => (x._id === o._id ? o : x)) }))
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl font-semibold text-plum-800">Orders <span className="text-2xl text-plum-700/40">{data.total}</span></h1>
      <div className="flex flex-wrap gap-3"><input className="input max-w-xs" placeholder="Search order no., name, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">{['', ...STATUSES].map((s) => <button key={s} onClick={() => setSp(s ? { status: s } : {})} className={`chip shrink-0 ${status === s ? 'chip-on' : ''}`}>{s ? STATUS_LABEL[s] : 'All'}</button>)}</div></div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        {loading ? <div className="skeleton h-64" /> : data.orders.length === 0 ? <p className="p-10 text-center text-plum-700/60">No orders found.</p> : data.orders.map((o) => (
          <div key={o._id} className="border-b border-plum-50 last:border-0">
            <button onClick={() => setOpen(open === o._id ? null : o._id)} className="grid w-full grid-cols-2 items-center gap-2 px-5 py-4 text-left text-sm hover:bg-blush/50 sm:grid-cols-[1.3fr_1.2fr_.8fr_.9fr_.9fr]">
              <span className="font-semibold tracking-wide text-plum-800">{o.orderNumber}</span>
              <span>{o.customer.name}<span className="block text-xs text-plum-700/60">{o.customer.phone}</span></span>
              <span className="hidden sm:block">{fmtDate(o.createdAt)}</span>
              <span className="font-semibold">{inr(o.total)}<span className="block text-xs font-normal text-plum-700/60">{o.payment.method === 'cod' ? 'COD' : 'Online'} · {o.payment.status.replace('_', ' ')}</span></span>
              <span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone[o.status]}`}>{STATUS_LABEL[o.status]}</span></span>
            </button>
            {open === o._id && <Detail o={o} onSaved={replace} />}
          </div>
        ))}
      </div>
      {data.pages > 1 && <div className="flex justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline !py-2.5">Prev</button><span className="self-center text-sm">Page {page} / {data.pages}</span><button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn-outline !py-2.5">Next</button></div>}
    </div>
  )
}
