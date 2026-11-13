import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../services/api'
import { errMsg, fmtDate, inr } from '../../lib/format'

const STATUSES = ['requested', 'approved', 'received', 'refunded', 'exchanged', 'rejected', 'closed']
const TONE = { requested: 'bg-amber-50 text-amber-700', approved: 'bg-blue-50 text-blue-700', received: 'bg-indigo-50 text-indigo-700', refunded: 'bg-green-50 text-green-700', exchanged: 'bg-green-50 text-green-700', rejected: 'bg-rose-50 text-rose-700', closed: 'bg-plum-50 text-plum-700' }

function Detail({ r, onSaved }) {
  const value = r.items.reduce((s, i) => s + i.price * i.qty, 0)
  const [status, setStatus] = useState(r.status)
  const [note, setNote] = useState(r.adminNote || '')
  const [amount, setAmount] = useState(value)
  const [restock, setRestock] = useState(!r.restocked)
  const [busy, setBusy] = useState(false)
  const online = r.order?.payment?.method === 'razorpay' && r.order?.payment?.status !== 'pending'

  const run = async (body, msg) => {
    setBusy(true)
    try { const res = await adminAPI.updateReturn(r._id, body); toast.success(msg); onSaved(res.data.returnRequest) } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }
  return (
    <div className="grid gap-6 border-t border-plum-100 bg-blush/60 p-5 lg:grid-cols-2">
      <div className="space-y-2 text-sm">
        <p><b>{r.customer.name}</b> · {r.customer.phone} {r.customer.email && `· ${r.customer.email}`}</p>
        <p><b className="capitalize">{r.type}</b> — {r.reason}</p>
        {r.comment && <p className="rounded-xl bg-white p-3">“{r.comment}”</p>}
        <div className="divide-y divide-plum-100 rounded-xl bg-white px-3">{r.items.map((i, k) => <div key={k} className="flex justify-between py-2"><span>{i.name} <span className="text-plum-700/60">{[i.color, i.size].filter(Boolean).join('/')} × {i.qty}</span></span><b>{inr(i.price * i.qty)}</b></div>)}</div>
        <p className="text-plum-700/70">Order total {inr(r.order?.total)} · paid via {r.order?.payment?.method === 'cod' ? 'COD' : 'Razorpay'}{r.refundAmount > 0 && ` · refunded ${inr(r.refundAmount)} so far`}</p>
        <div className="pt-1 text-xs text-plum-700/60">{r.history.map((h, k) => <div key={k}>• {h.status} — {fmtDate(h.at)} {h.note && `(${h.note})`}</div>)}</div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {r.status === 'requested' && <><button disabled={busy} onClick={() => run({ status: 'approved', adminNote: note }, 'Approved')} className="btn-plum !py-2.5 !text-[11px]">Approve</button><button disabled={busy} onClick={() => run({ status: 'rejected', adminNote: note }, 'Rejected')} className="btn-outline !border-rose-500 !py-2.5 !text-[11px] !text-rose-600 hover:!bg-rose-500 hover:!text-white">Reject</button></>}
          {r.status === 'approved' && <button disabled={busy} onClick={() => run({ status: 'received', adminNote: note, restock }, 'Marked received')} className="btn-plum !py-2.5 !text-[11px]">Item received</button>}
        </div>
        <div><label className="label">Message to customer (shown on Track Order)</label><textarea rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please courier the item to … / Reason for rejection" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-plum-700" checked={restock} onChange={(e) => setRestock(e.target.checked)} disabled={r.restocked} /> {r.restocked ? 'Already added back to stock' : 'Add items back to stock when I save / refund'}</label>
        {r.type === 'return' && !['rejected', 'closed'].includes(r.status) && (
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-medium">Refund</p>
            <div className="mt-2 flex gap-2"><div className="relative flex-1"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-300">₹</span><input type="number" min="1" className="input !pl-8" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <button disabled={busy} onClick={() => window.confirm(online ? `Refund ${inr(amount)} to the customer's original payment method via Razorpay? This cannot be undone.` : `Record ${inr(amount)} as refunded manually?`) && run({ refund: true, refundAmount: Number(amount), restock, adminNote: note }, 'Refund recorded')} className="btn-plum !py-2.5 !text-[11px]">{online ? 'Refund via Razorpay' : 'Mark refunded'}</button></div>
            {!online && <p className="mt-2 text-xs text-plum-700/60">Cash on Delivery order: send the money yourself (UPI/bank), then record it here.</p>}
          </div>
        )}
        <div className="flex gap-2"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select><button disabled={busy} onClick={() => run({ status, adminNote: note, restock: restock && ['received', 'exchanged', 'closed'].includes(status) }, 'Updated')} className="btn-outline !py-2.5 !text-[11px]">Save</button></div>
      </div>
    </div>
  )
}

export default function AdminReturns() {
  const [status, setStatus] = useState('')
  const [list, setList] = useState(null)
  const [open, setOpen] = useState(null)
  const load = () => adminAPI.returns({ status }).then((r) => setList(r.data.returns))
  useEffect(() => { setList(null); load() }, [status]) // eslint-disable-line
  const replace = (rr) => setList((l) => l.map((x) => (x._id === rr._id ? { ...x, ...rr, order: x.order } : x)))
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl font-semibold text-plum-800">Returns & exchanges</h1>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">{['', ...STATUSES].map((s) => <button key={s} onClick={() => setStatus(s)} className={`chip shrink-0 capitalize ${status === s ? 'chip-on' : ''}`}>{s || 'All'}</button>)}</div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        {list === null ? <div className="skeleton h-48" /> : list.length === 0 ? <p className="p-10 text-center text-plum-700/60">No requests.</p> : list.map((r) => (
          <div key={r._id} className="border-b border-plum-50 last:border-0">
            <button onClick={() => setOpen(open === r._id ? null : r._id)} className="grid w-full grid-cols-2 items-center gap-2 px-5 py-4 text-left text-sm hover:bg-blush/50 sm:grid-cols-[1.2fr_1.2fr_1.6fr_.8fr_1fr]">
              <span className="font-semibold tracking-wide text-plum-800">{r.orderNumber}</span>
              <span>{r.customer.name}<span className="block text-xs text-plum-700/60">{r.customer.phone}</span></span>
              <span className="hidden truncate sm:block">{r.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</span>
              <span className="hidden capitalize sm:block">{r.type}<span className="block text-xs text-plum-700/60">{fmtDate(r.createdAt)}</span></span>
              <span><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${TONE[r.status]}`}>{r.status}</span></span>
            </button>
            {open === r._id && <Detail r={r} onSaved={replace} />}
          </div>
        ))}
      </div>
    </div>
  )
}
