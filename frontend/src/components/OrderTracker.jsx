import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReturnModal from './ReturnModal'
import { motion } from 'framer-motion'
import { FiCheck, FiX } from 'react-icons/fi'
import { STEPS, STATUS_LABEL, fmtDate, inr } from '../lib/format'
import ProductImage from './ProductImage'

const RSTATUS = { requested: ['Under review', 'bg-amber-50 text-amber-700'], approved: ['Approved — awaiting item', 'bg-blue-50 text-blue-700'], received: ['Item received', 'bg-indigo-50 text-indigo-700'], refunded: ['Refunded', 'bg-green-50 text-green-700'], exchanged: ['Exchange completed', 'bg-green-50 text-green-700'], rejected: ['Not approved', 'bg-rose-50 text-rose-700'], closed: ['Closed', 'bg-plum-50 text-plum-700'] }

export default function OrderTracker({ order, onCancel, phone, onReload }) {
  const [returning, setReturning] = useState(false)
  const cancelled = ['cancelled', 'returned'].includes(order.status)
  const idx = STEPS.indexOf(order.status)
  const when = (s) => order.timeline?.find((t) => t.status === s)?.at
  return (
    <div className="rounded-3xl border border-plum-100 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="eyebrow">Order</p><p className="font-display text-3xl font-semibold tracking-wide text-plum-800">{order.orderNumber}</p><p className="text-sm text-plum-700/60">Placed {fmtDate(order.createdAt)}</p></div>
        <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${cancelled ? 'bg-rose-50 text-rose-600' : order.status === 'delivered' ? 'bg-green-50 text-green-700' : 'bg-plum-50 text-plum-700'}`}>{STATUS_LABEL[order.status]}</span>
      </div>

      {cancelled ? (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-rose-700"><FiX /> This order was {order.status}. {order.payment.status === 'refund_pending' && 'Your refund is being processed.'}</p>
      ) : (
        <>
        <ol className="mt-6 sm:hidden">
          {STEPS.map((s, i) => {
            const done = i <= idx
            return (
              <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
                {i < STEPS.length - 1 && <span className={`absolute left-[15px] top-8 h-full w-0.5 ${i < idx ? 'bg-rose-500' : 'bg-plum-100'}`} />}
                <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs ${done ? 'border-rose-500 bg-rose-500 text-white' : 'border-plum-100 bg-white text-plum-300'}`}>{done ? <FiCheck size={15} /> : i + 1}</span>
                <div className="pt-1"><p className={`text-sm font-medium ${done ? 'text-plum-800' : 'text-plum-700/40'}`}>{STATUS_LABEL[s]}</p>{when(s) && <p className="text-xs text-plum-700/50">{fmtDate(when(s))}</p>}</div>
              </li>
            )
          })}
        </ol>
        <div className="mt-8 hidden overflow-x-auto pb-2 sm:block"><ol className="flex min-w-[560px] justify-between">
          {STEPS.map((s, i) => {
            const done = i <= idx
            return (
              <li key={s} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 && <span className="absolute right-1/2 top-4 h-0.5 w-full bg-plum-100"><motion.span className="block h-full bg-rose-500" initial={{ width: 0 }} animate={{ width: i <= idx ? '100%' : 0 }} transition={{ delay: i * 0.15, duration: 0.5 }} /></span>}
                <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: i * 0.15 }} className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 text-xs ${done ? 'border-rose-500 bg-rose-500 text-white' : 'border-plum-100 bg-white text-plum-300'}`}>{done ? <FiCheck size={15} /> : i + 1}</motion.span>
                <span className={`mt-2 text-xs font-medium ${done ? 'text-plum-800' : 'text-plum-700/40'}`}>{STATUS_LABEL[s]}</span>
                {when(s) && <span className="text-[10px] text-plum-700/50">{fmtDate(when(s))}</span>}
              </li>
            )
          })}
        </ol></div>
        </>
      )}

      {order.eta?.from && !cancelled && order.status !== 'delivered' && <p className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">🚚 Expected delivery <b>{new Date(order.eta.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(order.eta.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</b></p>}
      {order.trackingId && <p className="mt-5 rounded-2xl bg-blush p-4 text-sm">Shipped via <b>{order.courier || 'courier'}</b> · Tracking ID <b className="select-all">{order.trackingId}</b></p>}

      <div className="mt-6 divide-y divide-plum-50 border-t border-plum-50">
        {order.items.map((i, k) => (
          <div key={k} className="flex items-center gap-4 py-3">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-plum-50"><ProductImage product={{ name: i.name, images: i.image ? [{ url: i.image }] : [] }} w={120} className="h-full w-full object-cover" /></div>
            <div className="flex-1 text-sm"><p className="font-medium">{i.name}</p><p className="text-plum-700/60">{[i.color, i.size].filter(Boolean).join(' · ')} · Qty {i.qty}</p></div>
            <b className="text-sm">{inr(i.price * i.qty)}</b>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-plum-50 pt-4">
        <p className="text-sm text-plum-700/70">{order.payment.method === 'cod' ? 'Cash on Delivery' : 'Online payment'} · {order.payment.status.replace('_', ' ')} · Deliver to {order.address.city} {order.address.pincode}</p>
        <b className="text-xl text-plum-800">{inr(order.total)}</b>
      </div>
      {order.returns?.map((r) => (
        <div key={r._id} className="mt-5 rounded-2xl border border-plum-100 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><b className="capitalize">{r.type} request</b><span className={`rounded-full px-3 py-1 text-xs font-semibold ${RSTATUS[r.status]?.[1]}`}>{RSTATUS[r.status]?.[0] || r.status}</span></div>
          <p className="mt-1 text-plum-700/70">{r.items.map((i) => `${i.name} × ${i.qty}`).join(', ')} · {r.reason}</p>
          {r.adminNote && <p className="mt-2 rounded-xl bg-blush p-3">💬 {r.adminNote}</p>}
          {r.refundAmount > 0 && <p className="mt-2 font-medium text-green-700">Refund of {inr(r.refundAmount)} initiated</p>}
        </div>
      ))}
      {order.returnInfo?.eligible && <button onClick={() => setReturning(true)} className="btn-outline mt-5 !py-2.5">Return or exchange</button>}
      {order.returnInfo?.eligible && order.returnInfo.until && <span className="ml-3 text-xs text-plum-700/60">Eligible until {fmtDate(order.returnInfo.until)}</span>}
      {!order.returnInfo?.eligible && order.returnInfo?.reason && !order.returns?.length && <p className="mt-4 text-xs text-plum-700/60">{order.returnInfo.reason}</p>}
      {returning && <ReturnModal order={order} onClose={() => setReturning(false)} onDone={() => { setReturning(false); onReload?.() }} />}
      {(phone || order.customer?.phone) && <Link to={`/invoice?order=${order.orderNumber}&phone=${phone || order.customer.phone}`} target="_blank" className="mt-4 mr-5 inline-block text-sm text-plum-700 underline underline-offset-4 hover:text-rose-500">View / print invoice</Link>}
      {onCancel && ['placed', 'confirmed'].includes(order.status) && <button onClick={() => onCancel(order)} className="mt-4 text-sm text-rose-500 underline underline-offset-4">Cancel this order</button>}
    </div>
  )
}
