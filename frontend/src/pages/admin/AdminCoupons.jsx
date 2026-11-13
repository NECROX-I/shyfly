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
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl font-semibold text-plum-800">Coupons</h1>
      <form onSubmit={save} className="grid gap-3 rounded-3xl bg-white p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="label">Code</label><input className="input uppercase" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
        <div><label className="label">Type</label><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">Percent %</option><option value="flat">Flat ₹</option></select></div>
        <div><label className="label">Value</label><input type="number" min="1" className="input" required value={f.value} onChange={num('value')} /></div>
        <div><label className="label">Min order ₹</label><input type="number" min="0" className="input" value={f.minOrder} onChange={num('minOrder')} /></div>
        <div><label className="label">Max discount ₹ (0 = none)</label><input type="number" min="0" className="input" value={f.maxDiscount} onChange={num('maxDiscount')} /></div>
        <div><label className="label">Usage limit (0 = ∞)</label><input type="number" min="0" className="input" value={f.usageLimit} onChange={num('usageLimit')} /></div>
        <div><label className="label">Expires</label><input type="date" className="input" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
        <div><label className="label">Description</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <button className="btn-plum sm:col-span-2 lg:col-span-4">Create coupon</button>
      </form>
      <div className="overflow-x-auto rounded-3xl bg-white shadow-soft"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-blush text-xs uppercase tracking-wider text-plum-700/70"><tr><th className="p-4">Code</th><th>Offer</th><th>Min</th><th>Used</th><th>Expires</th><th>Active</th><th /></tr></thead>
        <tbody>{list.map((c) => <tr key={c._id} className="border-t border-plum-50"><td className="p-4 font-semibold tracking-wider">{c.code}</td><td>{c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}` : `₹${c.value}`}</td><td>₹{c.minOrder}</td><td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td><td>{c.expiresAt ? fmtDate(c.expiresAt) : '—'}</td><td><button onClick={() => toggle(c)} className={`rounded-full px-3 py-1 text-xs ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-plum-50 text-plum-700'}`}>{c.isActive ? 'On' : 'Off'}</button></td><td className="pr-4 text-right"><button onClick={() => del(c)} className="p-2 text-plum-300 hover:text-rose-500"><FiTrash2 /></button></td></tr>)}</tbody></table></div>
    </div>
  )
}
