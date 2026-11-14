import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiLink } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import ProductImage from '../../components/ProductImage'
import { inr, errMsg, totalStock } from '../../lib/format'
import { useDebounce } from '../../lib/hooks'

const EMPTY = { name: '', category: '', subCategory: '', price: '', mrp: '', description: '', material: '', careNote: '', brand: 'Shyfly', tags: '', featured: false, isNewArrival: true, isActive: true, returnable: true, images: [], variants: [{ size: '', color: '', colorHex: '#999999', stock: 10 }], details: [] }

function Form({ product, cats, onClose, onSaved }) {
  const [f, setF] = useState(() => product ? { ...EMPTY, ...product, category: product.category?._id || product.category, subCategory: product.subCategory?._id || product.subCategory || '', tags: (product.tags || []).join(', ') } : EMPTY)
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')
  const [gen, setGen] = useState({ colors: '', sizes: '', stock: 10 })
  const file = useRef()
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const tops = cats.filter((c) => !c.parent)
  const subs = cats.filter((c) => String(c.parent) === String(f.category))

  const upload = async (files) => {
    if (!files.length) return
    try { const r = await adminAPI.upload(files); set('images', [...f.images, ...r.data.images]); toast.success('Uploaded') } catch (e) { toast.error(errMsg(e)) }
  }
  const generate = () => {
    const colors = gen.colors.split(',').map((s) => s.trim()).filter(Boolean)
    const sizes = gen.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    const cs = colors.length ? colors : ['']; const ss = sizes.length ? sizes : ['']
    set('variants', cs.flatMap((c) => ss.map((s) => ({ color: c, colorHex: f.variants.find((v) => v.color === c)?.colorHex || '#999999', size: s, stock: Number(gen.stock) || 0 }))))
  }
  const setV = (i, k, v) => set('variants', f.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)))

  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    const body = { ...f, price: Number(f.price), mrp: Number(f.mrp) || Number(f.price), tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean), details: f.details.filter((d) => d.label && d.value) }
    try { product ? await adminAPI.updateProduct(product._id, body) : await adminAPI.createProduct(body); toast.success('Saved'); onSaved() } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-plum-950/50 p-3 sm:p-8">
      <form onSubmit={submit} className="w-full max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-4xl font-semibold text-plum-800">{product ? 'Edit product' : 'New product'}</h2><button type="button" onClick={onClose}><FiX size={24} /></button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Name</label><input className="input" required value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label className="label">Category</label><select className="input" required value={f.category} onChange={(e) => { set('category', e.target.value); set('subCategory', '') }}><option value="">Select</option>{tops.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="label">Sub-category</label><select className="input" value={f.subCategory} onChange={(e) => set('subCategory', e.target.value)}><option value="">None</option>{subs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="label">Selling price (₹)</label><input type="number" min="0" className="input" required value={f.price} onChange={(e) => set('price', e.target.value)} /></div>
          <div><label className="label">MRP (₹) — for discount</label><input type="number" min="0" className="input" value={f.mrp} onChange={(e) => set('mrp', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={3} className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div><label className="label">Material</label><input className="input" value={f.material} onChange={(e) => set('material', e.target.value)} /></div>
          <div><label className="label">Tags (comma separated: wedding, festive, gift…)</label><input className="input" value={f.tags} onChange={(e) => set('tags', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Care note</label><input className="input" value={f.careNote} onChange={(e) => set('careNote', e.target.value)} /></div>
        </div>

        <div className="mt-6 flex flex-wrap gap-5 text-sm">{[['isActive', 'Visible in store'], ['featured', 'Featured'], ['isNewArrival', 'New arrival'], ['returnable', 'Returnable']].map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-plum-700" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>)}</div>

        <h3 className="mt-8 font-display text-2xl font-semibold text-plum-800">Images</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {f.images.map((im, i) => (
            <div key={i} className="group relative h-28 w-24 overflow-hidden rounded-xl bg-plum-50"><img src={im.url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => set('images', f.images.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"><FiX size={12} /></button>
              {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-plum-700 py-0.5 text-center text-[10px] text-white">Main</span>}</div>
          ))}
          <button type="button" onClick={() => file.current.click()} className="grid h-28 w-24 place-items-center rounded-xl border-2 border-dashed border-plum-200 text-plum-700 hover:bg-blush"><span className="text-center text-xs"><FiUpload className="mx-auto mb-1" size={20} />Upload</span></button>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
        </div>
        <div className="mt-3 flex gap-2"><div className="relative flex-1"><FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-300" /><input className="input !pl-11" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} /></div><button type="button" className="btn-outline !py-2.5" onClick={() => { if (url.trim()) { set('images', [...f.images, { url: url.trim() }]); setUrl('') } }}>Add</button></div>

        <h3 className="mt-8 font-display text-2xl font-semibold text-plum-800">Variants & stock</h3>
        <div className="mt-3 grid gap-2 rounded-2xl bg-blush p-4 sm:grid-cols-[1fr_1fr_90px_auto]">
          <input className="input" placeholder="Colours: Gold, Silver" value={gen.colors} onChange={(e) => setGen({ ...gen, colors: e.target.value })} />
          <input className="input" placeholder="Sizes: S, M, L (or blank)" value={gen.sizes} onChange={(e) => setGen({ ...gen, sizes: e.target.value })} />
          <input className="input" type="number" min="0" value={gen.stock} onChange={(e) => setGen({ ...gen, stock: e.target.value })} title="Stock each" />
          <button type="button" onClick={generate} className="btn-plum !py-2.5">Generate</button>
        </div>
        <div className="mt-3 space-y-2">
          {f.variants.map((v, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input className="input !py-2 min-w-[120px] flex-1" placeholder="Colour" value={v.color} onChange={(e) => setV(i, 'color', e.target.value)} />
              <input type="color" className="h-10 w-11 cursor-pointer rounded-lg border border-plum-100 bg-white p-1" value={v.colorHex || '#999999'} onChange={(e) => setV(i, 'colorHex', e.target.value)} />
              <input className="input !py-2 min-w-[100px] flex-1" placeholder="Size" value={v.size} onChange={(e) => setV(i, 'size', e.target.value)} />
              <input className="input !py-2 w-24" type="number" min="0" value={v.stock} onChange={(e) => setV(i, 'stock', e.target.value)} />
              <button type="button" onClick={() => set('variants', f.variants.filter((_, j) => j !== i))} disabled={f.variants.length === 1} className="text-plum-300 hover:text-rose-500 disabled:opacity-30"><FiTrash2 /></button>
            </div>
          ))}
          <button type="button" onClick={() => set('variants', [...f.variants, { size: '', color: '', colorHex: '#999999', stock: 0 }])} className="text-sm text-rose-500 underline">+ Add variant row</button>
        </div>

        <h3 className="mt-8 font-display text-2xl font-semibold text-plum-800">Extra details (optional)</h3>
        <div className="mt-3 space-y-2">{f.details.map((d, i) => <div key={i} className="grid grid-cols-[1fr_2fr_32px] gap-2"><input className="input !py-2" placeholder="Label" value={d.label} onChange={(e) => set('details', f.details.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /><input className="input !py-2" placeholder="Value" value={d.value} onChange={(e) => set('details', f.details.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} /><button type="button" onClick={() => set('details', f.details.filter((_, j) => j !== i))}><FiTrash2 className="text-plum-300" /></button></div>)}
          <button type="button" onClick={() => set('details', [...f.details, { label: '', value: '' }])} className="text-sm text-rose-500 underline">+ Add detail</button></div>

        <div className="mt-8 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-outline">Cancel</button><button disabled={busy} className="btn-plum">{busy ? 'Saving…' : 'Save product'}</button></div>
      </form>
    </div>
  )
}

export default function AdminProducts() {
  const [q, setQ] = useState('')
  const dq = useDebounce(q, 350)
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ products: [], pages: 1, total: 0 })
  const [cats, setCats] = useState([])
  const [edit, setEdit] = useState(null)
  const [loading, setLoading] = useState(true)
  const load = () => { setLoading(true); adminAPI.products({ q: dq, page }).then((r) => setData(r.data)).finally(() => setLoading(false)) }
  useEffect(() => { adminAPI.categories().then((r) => setCats(r.data.categories)) }, [])
  useEffect(() => { setPage(1) }, [dq])
  useEffect(load, [dq, page]) // eslint-disable-line

  const open = async (p) => { if (!p) return setEdit({}); const r = await adminAPI.product(p._id); setEdit(r.data.product) }
  const del = async (p) => { if (!window.confirm(`Delete "${p.name}" permanently?`)) return; try { await adminAPI.deleteProduct(p._id); toast.success('Deleted'); load() } catch (e) { toast.error(errMsg(e)) } }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-5xl font-semibold text-plum-800">Products <span className="text-2xl text-plum-700/40">{data.total}</span></h1><button onClick={() => open(null)} className="btn-plum"><FiPlus /> Add product</button></div>
      <input className="input max-w-sm" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
        {loading ? <div className="skeleton h-64" /> : (
          <table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-blush text-xs uppercase tracking-wider text-plum-700/70"><tr><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Status</th><th /></tr></thead>
            <tbody>{data.products.map((p) => (
              <tr key={p._id} className="border-t border-plum-50 hover:bg-blush/40">
                <td className="p-3"><div className="flex items-center gap-3"><div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-plum-50"><ProductImage product={p} w={100} className="h-full w-full object-cover" /></div><span className="max-w-[240px] font-medium">{p.name}</span></div></td>
                <td>{p.category?.name}<span className="block text-xs text-plum-700/50">{p.subCategory?.name}</span></td>
                <td>{inr(p.price)}{p.mrp > p.price && <span className="block text-xs text-plum-700/50 line-through">{inr(p.mrp)}</span>}</td>
                <td className={totalStock(p) <= 5 ? 'font-semibold text-rose-500' : ''}>{totalStock(p)}</td><td>{p.soldCount}</td>
                <td><span className={`rounded-full px-3 py-1 text-xs ${p.isActive ? 'bg-green-50 text-green-700' : 'bg-plum-50 text-plum-700'}`}>{p.isActive ? 'Live' : 'Hidden'}</span></td>
                <td className="pr-4 text-right"><button onClick={() => open(p)} className="p-2 text-plum-700 hover:text-rose-500" aria-label="Edit"><FiEdit2 /></button><button onClick={() => del(p)} className="p-2 text-plum-300 hover:text-rose-500" aria-label="Delete"><FiTrash2 /></button></td>
              </tr>))}</tbody></table>
        )}
      </div>
      {data.pages > 1 && <div className="flex justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline !py-2.5">Prev</button><span className="self-center text-sm">Page {page} / {data.pages}</span><button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn-outline !py-2.5">Next</button></div>}
      {edit && <Form product={edit._id ? edit : null} cats={cats} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </div>
  )
}
