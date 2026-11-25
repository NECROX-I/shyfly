import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiTrash2 } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import { errMsg, fmtDate } from '../../lib/format'

const E = { code: '', description: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, expiresAt: '' }

export default function AdminCoupons() {
  const [list, setList] = useState([])
  const [f, setF] = useState(E)
  const load = () => adminAPI.coupons().then((r) => setList(r.data.coupons))
  useEffect(() => { load() }, [])
  const num = (k) => (e) => setF({ ...f, [k]: Number(e.target.value) })
  const save = async (e) => { e.preventDefault(); try { await adminAPI.createCoupon({ ...f, expiresAt: f.expiresAt || undefined }); toast.success('Coupon created'); setF(E); load() } catch (err) { toast.error(errMsg(err)) } }
  const toggle = async (c) => { await adminAPI.updateCoupon(c._id, { isActive: !c.isActive }); load() }
  const del = async (c) => { if (window.confirm(`Delete ${c.code}?`)) { await adminAPI.deleteCoupon(c._id); load() } }
  const offer = (c) => (c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}` : `₹${c.value}`)
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold leading-tight text-plum-800 sm:text-4xl lg:text-5xl">Coupons</h1>
      <form onSubmit={save} className="grid grid-cols-2 gap-3 rounded-3xl bg-white p-4 shadow-soft sm:p-5 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1"><label className="label">Code</label><input className="input uppercase" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
        <div><label className="label">Type</label><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">Percent %</option><option value="flat">Flat ₹</option></select></div>
        <div><label className="label">Value</label><input type="number" min="1" className="input" required value={f.value} onChange={num('value')} /></div>
        <div><label className="label">Min order ₹</label><input type="number" min="0" className="input" value={f.minOrder} onChange={num('minOrder')} /></div>
        <div><label className="label">Max discount ₹<span className="hidden sm:inline"> (0 = none)</span></label><input type="number" min="0" className="input" value={f.maxDiscount} onChange={num('maxDiscount')} /></div>
        <div><label className="label">Usage limit<span className="hidden sm:inline"> (0 = ∞)</span></label><input type="number" min="0" className="input" value={f.usageLimit} onChange={num('usageLimit')} /></div>
        <div><label className="label">Expires</label><input type="date" className="input" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
        <div className="col-span-2 lg:col-span-1"><label className="label">Description</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <button className="btn-plum col-span-2 lg:col-span-4">Create coupon</button>
      </form>
      <div className="space-y-3 md:hidden">{list.map((c) => (
        <div key={c._id} className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="break-all font-semibold tracking-wider">{c.code}</p><p className="mt-0.5 text-sm text-plum-800/80">{offer(c)}</p></div>
            <div className="-mr-2 -mt-1.5 flex shrink-0 items-center gap-1"><button onClick={() => toggle(c)} className={`rounded-full px-4 py-3 text-xs ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-plum-50 text-plum-700'}`}>{c.isActive ? 'On' : 'Off'}</button><button onClick={() => del(c)} className="grid h-11 w-11 place-items-center text-plum-300 hover:text-rose-500" aria-label="Delete coupon"><FiTrash2 /></button></div>
          </div>
          <p className="mt-2 text-xs text-plum-700/60">Min ₹{c.minOrder} · Used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''} · Expires {c.expiresAt ? fmtDate(c.expiresAt) : '—'}</p>
        </div>))}{!list.length && <p className="rounded-2xl bg-white p-8 text-center text-plum-700/60 shadow-soft">No coupons yet.</p>}</div>
      <div className="hidden overflow-x-auto rounded-3xl bg-white shadow-soft md:block"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-blush text-xs uppercase tracking-wider text-plum-700/70"><tr><th className="p-4">Code</th><th>Offer</th><th>Min</th><th>Used</th><th>Expires</th><th>Active</th><th /></tr></thead>
        <tbody>{list.map((c) => <tr key={c._id} className="border-t border-plum-50"><td className="p-4 font-semibold tracking-wider">{c.code}</td><td>{c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}` : `₹${c.value}`}</td><td>₹{c.minOrder}</td><td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td><td>{c.expiresAt ? fmtDate(c.expiresAt) : '—'}</td><td><button onClick={() => toggle(c)} className={`rounded-full px-4 py-2.5 text-xs ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-plum-50 text-plum-700'}`}>{c.isActive ? 'On' : 'Off'}</button></td><td className="pr-4 text-right"><button onClick={() => del(c)} className="p-3 text-plum-300 hover:text-rose-500" aria-label="Delete coupon"><FiTrash2 /></button></td></tr>)}</tbody></table></div>
    </div>
  )
}
