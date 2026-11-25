import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiEdit2, FiTrash2, FiUploadCloud, FiX, FiImage } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import { errMsg, img } from '../../lib/format'

const E = { name: '', parent: '', tagline: '', image: '', imagePublicId: '', sortOrder: 0, isActive: true }

const Thumb = ({ src, name, className = 'h-10 w-10' }) => (
  <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-plum-50 text-plum-300 ${className}`}>
    {src ? <img src={img(src, 120)} alt={name} className="h-full w-full object-cover" /> : <FiImage size={16} />}
  </span>
)

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [f, setF] = useState(E)
  const [id, setId] = useState(null)
  const [busy, setBusy] = useState(false)
  const file = useRef()
  const load = () => adminAPI.categories().then((r) => setCats(r.data.categories))
  useEffect(() => { load() }, [])
  const tops = cats.filter((c) => !c.parent)

  const pick = async (files) => {
    const x = files?.[0]
    if (!x) return
    if (!x.type.startsWith('image/')) return toast.error('Please choose an image file')
    if (x.size > 6 * 1024 * 1024) return toast.error('Image too large (max 6 MB)')
    setBusy(true)
    try {
      const r = await adminAPI.uploadCategoryImage(x)
      setF((p) => ({ ...p, image: r.data.image.url, imagePublicId: r.data.image.publicId }))
      toast.success('Image uploaded — press Save to apply')
    } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }

  const save = async (e) => {
    e.preventDefault()
    try { id ? await adminAPI.updateCategory(id, f) : await adminAPI.createCategory(f); toast.success('Saved'); setF(E); setId(null); load() } catch (err) { toast.error(errMsg(err)) }
  }
  const del = async (c) => { if (!window.confirm(`Delete ${c.name}?`)) return; try { await adminAPI.deleteCategory(c._id); load() } catch (e) { toast.error(errMsg(e)) } }
  const edit = (c) => { setId(c._id); setF({ name: c.name, parent: c.parent || '', tagline: c.tagline || '', image: c.image || '', imagePublicId: c.imagePublicId || '', sortOrder: c.sortOrder || 0, isActive: c.isActive }); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold leading-tight text-plum-800 sm:text-4xl lg:text-5xl">Categories</h1>
      <form onSubmit={save} className="grid gap-4 rounded-3xl bg-white p-4 shadow-soft sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <div><label className="label">Name</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">Parent (blank = main section)</label><select className="input" value={f.parent} onChange={(e) => setF({ ...f, parent: e.target.value })}><option value="">— Main section —</option>{tops.filter((t) => t._id !== id).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
        <div><label className="label">Tagline (home page heading)</label><input className="input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></div>
        <div><label className="label">Sort order</label><input type="number" className="input" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></div>

        {/* picture */}
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Category picture</label>
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-plum-200 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
            <Thumb src={f.image} name={f.name} className="h-20 w-20 sm:h-24 sm:w-24" />
            <div className="w-full min-w-0 space-y-2 sm:flex-1">
              <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => file.current.click()} className="btn-outline !px-4 !py-2.5"><FiUploadCloud /> {busy ? 'Uploading…' : f.image ? 'Replace picture' : 'Upload picture'}</button>
                {f.image && <button type="button" onClick={() => setF({ ...f, image: '', imagePublicId: '' })} className="btn !px-4 !py-2.5 text-rose-500 hover:bg-rose-50"><FiX /> Remove</button>}
              </div>
              <p className="text-xs text-plum-700/60">Square photo works best (auto-cropped to a square). JPG / PNG / WebP, max 6 MB. Shown in the home page circles, the menu and the shop page header. Without a picture, the default artwork is shown.</p>
              <input className="input !py-2 text-sm" placeholder="…or paste an image link (optional)" value={f.imagePublicId ? '' : f.image} onChange={(e) => setF({ ...f, image: e.target.value, imagePublicId: '' })} />
            </div>
          </div>
        </div>

        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" className="accent-plum-700" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />Visible</label>
        <div className="flex items-end gap-2 lg:col-span-3"><button className="btn-plum" disabled={busy}>{id ? 'Update' : 'Add category'}</button>{id && <button type="button" onClick={() => { setId(null); setF(E) }} className="btn-outline">Cancel</button>}</div>
      </form>

      <div className="grid gap-5 md:grid-cols-2">
        {tops.map((t) => (
          <div key={t._id} className="rounded-3xl bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3"><Thumb src={t.image} name={t.name} className="h-12 w-12" /><h3 className="line-clamp-2 font-display text-2xl font-semibold leading-tight text-plum-800 sm:text-3xl">{t.name} <span className="text-sm text-plum-700/50">({t.productCount})</span></h3></div>
              <div className="shrink-0"><button onClick={() => edit(t)} className="p-3 hover:text-rose-500" aria-label="Edit"><FiEdit2 /></button><button onClick={() => del(t)} className="p-3 text-plum-300 hover:text-rose-500" aria-label="Delete"><FiTrash2 /></button></div>
            </div>
            <div className="mt-3 divide-y divide-plum-50">{cats.filter((c) => String(c.parent) === String(t._id)).map((s) => (
              <div key={s._id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className={`flex min-w-0 items-center gap-2.5 ${s.isActive ? '' : 'opacity-40'}`}><Thumb src={s.image} name={s.name} className="h-8 w-8" />{s.name} <span className="text-plum-700/50">({s.productCount})</span></span>
                <div className="shrink-0"><button onClick={() => edit(s)} className="p-3 hover:text-rose-500" aria-label="Edit"><FiEdit2 size={14} /></button><button onClick={() => del(s)} className="p-3 text-plum-300 hover:text-rose-500" aria-label="Delete"><FiTrash2 size={14} /></button></div>
              </div>
            ))}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
