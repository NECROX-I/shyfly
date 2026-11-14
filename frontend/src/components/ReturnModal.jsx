import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiX } from 'react-icons/fi'
import { orderAPI } from '../services/api'
import { errMsg, inr } from '../lib/format'

const REASONS = ['Size / fit issue', 'Damaged or defective', 'Wrong item received', 'Not as described', 'Changed my mind', 'Other']

export default function ReturnModal({ order, onClose, onDone }) {
  const [sel, setSel] = useState({})
  const [type, setType] = useState('return')
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const chosen = order.items.filter((i) => sel[i.variantId])
  const toggle = (i) => setSel((s) => ({ ...s, [i.variantId]: s[i.variantId] ? 0 : 1 }))

  const submit = async (e) => {
    e.preventDefault()
    if (!chosen.length) return toast.error('Select at least one item')
    if (!reason) return toast.error('Please choose a reason')
    setBusy(true)
    try {
      await orderAPI.requestReturn({ orderNumber: order.orderNumber, phone: order.customer.phone, type, reason, comment, items: chosen.map((i) => ({ variantId: i.variantId, qty: sel[i.variantId] })) })
      toast.success('Request sent — we’ll update you soon'); onDone()
    } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-plum-950/55 p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.form onSubmit={submit} onClick={(e) => e.stopPropagation()} initial={{ y: 60 }} animate={{ y: 0 }} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
          <div className="flex items-start justify-between"><div><h2 className="font-display text-4xl font-semibold text-plum-800">Return or exchange</h2><p className="text-sm text-plum-700/60">Order {order.orderNumber}</p></div><button type="button" onClick={onClose} aria-label="Close"><FiX size={24} /></button></div>

          <p className="label mt-5">What would you like?</p>
          <div className="flex gap-2">{[['return', 'Return & refund'], ['exchange', 'Exchange']].map(([v, l]) => <button type="button" key={v} onClick={() => setType(v)} className={`chip flex-1 justify-center ${type === v ? 'chip-on' : ''}`}>{l}</button>)}</div>

          <p className="label mt-5">Select items</p>
          <div className="space-y-2">
            {order.items.map((i) => (
              <div key={i.variantId} className={`flex items-center gap-3 rounded-2xl border p-3 ${sel[i.variantId] ? 'border-plum-700 bg-blush' : 'border-plum-100'}`}>
                <input type="checkbox" className="h-4 w-4 accent-plum-700" checked={!!sel[i.variantId]} onChange={() => toggle(i)} />
                <div className="min-w-0 flex-1 text-sm"><p className="truncate font-medium">{i.name}</p><p className="text-plum-700/60">{[i.color, i.size].filter(Boolean).join(' · ')} · {inr(i.price)}</p></div>
                {sel[i.variantId] > 0 && i.qty > 1 && <select className="input !w-16 !py-1.5" value={sel[i.variantId]} onChange={(e) => setSel({ ...sel, [i.variantId]: Number(e.target.value) })}>{Array.from({ length: i.qty }, (_, k) => k + 1).map((n) => <option key={n}>{n}</option>)}</select>}
              </div>
            ))}
          </div>

          <div className="mt-5"><label className="label">Reason</label><select className="input" value={reason} onChange={(e) => setReason(e.target.value)}><option value="">Select a reason</option>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="mt-4"><label className="label">Details (optional)</label><textarea rows={3} className="input" maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={type === 'exchange' ? 'Which size / colour would you like instead?' : 'Tell us what went wrong'} /></div>
          <button disabled={busy} className="btn-plum mt-6 w-full">{busy ? 'Sending…' : 'Submit request'}</button>
          <p className="mt-3 text-center text-xs text-plum-700/60">Keep the item unused with its tags and packaging until we confirm.</p>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  )
}
