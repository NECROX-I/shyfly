import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import { errMsg } from '../../lib/format'

const E = { name: '', parent: '', tagline: '', image: '', sortOrder: 0, isActive: true }

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [f, setF] = useState(E)
  const [id, setId] = useState(null)
  const load = () => adminAPI.categories().then((r) => setCats(r.data.categories))
  useEffect(() => { load() }, [])
  const tops = cats.filter((c) => !c.parent)
  const save = async (e) => {
    e.preventDefault()
    try { id ? await adminAPI.updateCategory(id, f) : await adminAPI.createCategory(f); toast.success('Saved'); setF(E); setId(null); load() } catch (err) { toast.error(errMsg(err)) }
  }
  const del = async (c) => { if (!window.confirm(`Delete ${c.name}?`)) return; try { await adminAPI.deleteCategory(c._id); load() } catch (e) { toast.error(errMsg(e)) } }
  const edit = (c) => { setId(c._id); setF({ name: c.name, parent: c.parent || '', tagline: c.tagline || '', image: c.image || '', sortOrder: c.sortOrder || 0, isActive: c.isActive }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl font-semibold text-plum-800">Categories</h1>
      <form onSubmit={save} className="grid gap-3 rounded-3xl bg-white p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="label">Name</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">Parent (blank = main section)</label><select className="input" value={f.parent} onChange={(e) => setF({ ...f, parent: e.target.value })}><option value="">— Main section —</option>{tops.filter((t) => t._id !== id).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
        <div><label className="label">Tagline (home page heading)</label><input className="input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></div>
        <div><label className="label">Image URL (optional)</label><input className="input" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} /></div>
        <div><label className="label">Sort order</label><input type="number" className="input" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" className="accent-plum-700" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />Visible</label>
        <div className="flex items-end gap-2 lg:col-span-2"><button className="btn-plum">{id ? 'Update' : 'Add category'}</button>{id && <button type="button" onClick={() => { setId(null); setF(E) }} className="btn-outline">Cancel</button>}</div>
      </form>
      <div className="grid gap-5 md:grid-cols-2">
        {tops.map((t) => (
          <div key={t._id} className="rounded-3xl bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between"><h3 className="font-display text-3xl font-semibold text-plum-800">{t.name} <span className="text-sm text-plum-700/50">({t.productCount})</span></h3><div><button onClick={() => edit(t)} className="p-2 hover:text-rose-500"><FiEdit2 /></button><button onClick={() => del(t)} className="p-2 text-plum-300 hover:text-rose-500"><FiTrash2 /></button></div></div>
            <div className="mt-3 divide-y divide-plum-50">{cats.filter((c) => String(c.parent) === String(t._id)).map((s) => <div key={s._id} className="flex items-center justify-between py-2 text-sm"><span className={s.isActive ? '' : 'opacity-40'}>{s.name} <span className="text-plum-700/50">({s.productCount})</span></span><div><button onClick={() => edit(s)} className="p-1.5 hover:text-rose-500"><FiEdit2 size={14} /></button><button onClick={() => del(s)} className="p-1.5 text-plum-300 hover:text-rose-500"><FiTrash2 size={14} /></button></div></div>)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
