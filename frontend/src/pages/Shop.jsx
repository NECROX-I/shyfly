import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiSliders, FiX, FiGrid, FiChevronRight, FiCheck } from 'react-icons/fi'
import SEO from '../components/SEO'
import ProductCard from '../components/ProductCard'
import { GridSkeleton } from '../components/Skeletons'
import { ProductArt, Butterfly } from '../lib/art'
import { shopAPI } from '../services/api'
import { useCategories, useDebounce, useLockBody } from '../lib/hooks'
import { inr } from '../lib/format'

const SORTS = [['newest', 'Newest'], ['popular', 'Most popular'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Top rated']]

const Section = ({ title, children }) => <div className="border-b border-plum-50 py-6"><h4 className="mb-4 font-body text-[12px] font-medium uppercase tracking-[.2em] text-plum-800">{title}</h4>{children}</div>

function FilterPanel({ facets, params, set, cats, category, clear }) {
  const min = facets?.minPrice ?? 0, max = facets?.maxPrice ?? 5000
  const [lo, setLo] = useState(Number(params.get('minPrice')) || min)
  const [hi, setHi] = useState(Number(params.get('maxPrice')) || max)
  useEffect(() => { setLo(Number(params.get('minPrice')) || min); setHi(Number(params.get('maxPrice')) || max) }, [min, max, params.get('minPrice'), params.get('maxPrice')]) // eslint-disable-line
  const dLo = useDebounce(lo, 450), dHi = useDebounce(hi, 450)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    set({ minPrice: dLo > min ? dLo : null, maxPrice: dHi < max ? dHi : null })
  }, [dLo, dHi]) // eslint-disable-line

  const list = (k) => (params.get(k) ? params.get(k).split(',') : [])
  const toggleList = (k, v) => { const cur = list(k); set({ [k]: (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(',') || null }) }
  const pct = (v) => ((v - min) / Math.max(1, max - min)) * 100
  const toggle = (k, label) => (
    <button onClick={() => set({ [k]: params.get(k) === 'true' ? null : 'true' })} className="flex w-full items-center justify-between py-1.5 text-[15px]">
      {label}<span className={`grid h-5 w-9 items-center rounded-full p-0.5 transition ${params.get(k) === 'true' ? 'bg-rose-500' : 'bg-plum-100'}`}><span className={`h-4 w-4 rounded-full bg-white shadow transition ${params.get(k) === 'true' ? 'translate-x-4' : ''}`} /></span>
    </button>
  )

  return (
    <div>
      {category?.children?.length > 0 && (
        <Section title="Category">
          <div className="flex flex-col gap-1">
            {category.children.map((s) => <Link key={s._id} to={`/shop/${category.slug}/${s.slug}`} className="py-1.5 text-[15px] text-plum-900/80 hover:text-rose-500">{s.name}</Link>)}
          </div>
        </Section>
      )}
      {!category && <Section title="Category"><div className="flex flex-col gap-1">{cats.map((c) => <Link key={c._id} to={`/shop/${c.slug}`} className="py-1.5 text-[15px] text-plum-900/80 hover:text-rose-500">{c.name}</Link>)}</div></Section>}

      <Section title="Price">
        <div className="relative mx-2 mb-7 mt-2 h-6">
          <div className="absolute top-[10px] h-1 w-full rounded-full bg-plum-100" />
          <div className="absolute top-[10px] h-1 rounded-full bg-rose-500" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
          <input type="range" className="dual" min={min} max={max} step="50" value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi - 50))} aria-label="Minimum price" />
          <input type="range" className="dual" min={min} max={max} step="50" value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo + 50))} aria-label="Maximum price" />
        </div>
        <div className="flex items-center justify-between text-sm"><span className="rounded-full bg-blush px-4 py-1.5 font-medium">{inr(lo)}</span><span className="text-plum-300">—</span><span className="rounded-full bg-blush px-4 py-1.5 font-medium">{inr(hi)}</span></div>
      </Section>

      {facets?.sizes?.length > 0 && (
        <Section title="Size"><div className="flex flex-wrap gap-2">{facets.sizes.map((s) => <button key={s} onClick={() => toggleList('sizes', s)} className={`chip !px-3.5 !py-1.5 ${list('sizes').includes(s) ? 'chip-on' : ''}`}>{s}</button>)}</div></Section>
      )}
      {facets?.colors?.length > 0 && (
        <Section title="Colour">
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const on = list('colors').map((x) => x.toLowerCase()).includes(c.name.toLowerCase())
              return <button key={c.name} onClick={() => toggleList('colors', c.name)} title={c.name} aria-label={c.name} className={`relative grid h-9 w-9 place-items-center rounded-full ring-offset-2 transition ${on ? 'ring-2 ring-plum-700' : 'ring-1 ring-plum-100 hover:ring-plum-400'}`}><span className="h-full w-full rounded-full border border-white" style={{ background: c.hex || '#ccc' }} />{on && <FiCheck className={`absolute ${['#FAFAFA', '#F6F0E4', '#F4EDE4'].includes(c.hex) ? 'text-plum-800' : 'text-white'}`} size={14} />}</button>
            })}
          </div>
        </Section>
      )}
      <Section title="Availability & offers">{toggle('sale', 'On sale')}{toggle('isNew', 'New arrivals')}{toggle('inStock', 'In stock only')}</Section>
      <button onClick={clear} className="mt-6 w-full text-center text-sm text-plum-700 underline underline-offset-4 hover:text-rose-500">Clear all filters</button>
    </div>
  )
}

export default function Shop() {
  const { category: catSlug, sub: subSlug } = useParams()
  const [params, setParams] = useSearchParams()
  const cats = useCategories()
  const [products, setProducts] = useState([])
  const [facets, setFacets] = useState(null)
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [cols, setCols] = useState(() => Number(localStorage.getItem('shyfly-cols')) || 3)
  useLockBody(sheet)

  const top = cats.find((c) => c.slug === catSlug) || cats.find((c) => c.children.some((s) => s.slug === catSlug))
  const subCat = top?.children.find((s) => s.slug === (subSlug || catSlug) && s.slug !== top.slug)
  const q = params.get('q') || ''

  const set = useCallback((patch) => {
    setParams((prev) => { const n = new URLSearchParams(prev); Object.entries(patch).forEach(([k, v]) => (v === null || v === '' || v === undefined ? n.delete(k) : n.set(k, v))); return n }, { replace: true })
  }, [setParams])

  const queryKey = params.toString() + '|' + catSlug + '|' + subSlug
  const build = useMemo(() => {
    const p = { limit: 12 }
    if (subSlug) { p.category = catSlug; p.sub = subSlug } else if (catSlug) p.category = catSlug
    for (const k of ['q', 'sort', 'minPrice', 'maxPrice', 'sizes', 'colors', 'sale', 'isNew', 'inStock']) if (params.get(k)) p[k] = params.get(k)
    return p
  }, [queryKey]) // eslint-disable-line

  useEffect(() => {
    let live = true
    setLoading(true)
    shopAPI.products({ ...build, page: 1 }).then((r) => {
      if (!live) return
      setProducts(r.data.products); setMeta({ total: r.data.total, page: 1, pages: r.data.pages })
      if (r.data.facets) setFacets(r.data.facets)
    }).catch(() => live && setProducts([])).finally(() => live && setLoading(false))
    return () => { live = false }
  }, [build])

  // facets depend on category scope only → reset when scope changes
  useEffect(() => { setFacets(null) }, [catSlug, subSlug, q])

  const loadMore = async () => {
    setMore(true)
    try { const r = await shopAPI.products({ ...build, page: meta.page + 1 }); setProducts((p) => [...p, ...r.data.products]); setMeta((m) => ({ ...m, page: m.page + 1 })) } finally { setMore(false) }
  }

  const activeChips = [
    ...(params.get('sizes') ? params.get('sizes').split(',').map((v) => ({ k: 'sizes', v, label: `Size ${v}` })) : []),
    ...(params.get('colors') ? params.get('colors').split(',').map((v) => ({ k: 'colors', v, label: v })) : []),
    ...(params.get('minPrice') || params.get('maxPrice') ? [{ k: 'price', label: `${inr(params.get('minPrice') || facets?.minPrice || 0)} – ${inr(params.get('maxPrice') || facets?.maxPrice || 0)}` }] : []),
    ...['sale', 'isNew', 'inStock'].filter((k) => params.get(k)).map((k) => ({ k, label: { sale: 'On sale', isNew: 'New arrivals', inStock: 'In stock' }[k] })),
  ]
  const removeChip = (c) => {
    if (c.k === 'price') set({ minPrice: null, maxPrice: null })
    else if (c.v) set({ [c.k]: params.get(c.k).split(',').filter((x) => x !== c.v).join(',') || null })
    else set({ [c.k]: null })
  }
  const clear = () => setParams(q ? { q } : {}, { replace: true })

  const title = q ? `Results for “${q}”` : subCat?.name || top?.name || (params.get('sale') ? 'Sale' : params.get('isNew') ? 'New arrivals' : 'All products')
  const gridCls = { 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' }[cols]
  const heroKind = top?.slug || 'ornaments'

  return (
    <>
      <SEO title={title} description={top?.tagline} />

      {/* banner */}
      <section className="relative overflow-hidden bg-blush">
        <div className="absolute inset-0 bg-petal" />
        <Butterfly className="absolute right-6 top-6 hidden w-20 animate-float opacity-80 sm:block" />
        <div className="container-x relative py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-plum-700/60">
            <Link to="/" className="hover:text-rose-500">Home</Link><FiChevronRight size={12} />
            <Link to="/shop" className="hover:text-rose-500">Shop</Link>
            {top && <><FiChevronRight size={12} /><Link to={`/shop/${top.slug}`} className={subCat ? 'hover:text-rose-500' : 'text-plum-900'}>{top.name}</Link></>}
            {subCat && <><FiChevronRight size={12} /><span className="text-plum-900">{subCat.name}</span></>}
          </nav>
          <div className="mt-4 flex items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-5xl font-semibold text-plum-800 sm:text-6xl">{title}</h1>
              {top && !q && <p className="mt-2 max-w-md text-plum-800/70">{subCat ? `Explore our ${subCat.name.toLowerCase()} collection.` : top.tagline}</p>}
            </div>
            <div className="hidden h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-soft sm:block"><ProductArt kind={heroKind} seed={title} className="h-full w-full" /></div>
          </div>
          {top && !subCat && top.children.length > 0 && (
            <div className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto">
              {top.children.map((s) => <Link key={s._id} to={`/shop/${top.slug}/${s.slug}`} className="chip shrink-0">{s.name}</Link>)}
            </div>
          )}
          {subCat && <div className="no-scrollbar mt-6 flex gap-2.5 overflow-x-auto">{top.children.map((s) => <Link key={s._id} to={`/shop/${top.slug}/${s.slug}`} className={`chip shrink-0 ${s._id === subCat._id ? 'chip-on' : ''}`}>{s.name}</Link>)}</div>}
        </div>
      </section>

      <div className="container-x grid gap-10 py-8 lg:grid-cols-[260px_1fr] lg:py-10">
        <aside className="hidden lg:block"><div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-3 no-scrollbar"><FilterPanel facets={facets} params={params} set={set} cats={cats} category={subCat ? top : top} clear={clear} /></div></aside>

        <div>
          <div className="sticky top-[62px] z-20 -mx-4 flex items-center justify-between gap-3 border-b border-plum-50 bg-white/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0 lg:top-[118px]">
            <button onClick={() => setSheet(true)} className="chip lg:hidden"><FiSliders size={15} /> Filters{activeChips.length > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] text-white">{activeChips.length}</span>}</button>
            <p className="hidden text-sm text-plum-700/70 lg:block">{loading ? 'Loading…' : <><b className="text-plum-900">{meta.total}</b> {meta.total === 1 ? 'product' : 'products'}</>}</p>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-1 sm:flex">
                {[2, 3, 4].map((n) => <button key={n} onClick={() => { setCols(n); localStorage.setItem('shyfly-cols', n) }} aria-label={`${n} columns`} className={`grid h-9 w-9 place-items-center rounded-full transition ${cols === n ? 'bg-plum-700 text-white' : 'text-plum-700 hover:bg-plum-50'}`}><FiGrid size={15} /></button>)}
              </div>
              <select value={params.get('sort') || 'newest'} onChange={(e) => set({ sort: e.target.value === 'newest' ? null : e.target.value })} className="rounded-full border border-plum-100 bg-white px-4 py-2.5 text-sm focus:border-rose-400 focus:outline-none" aria-label="Sort">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeChips.map((c) => <button key={c.k + (c.v || '')} onClick={() => removeChip(c)} className="chip chip-on !py-1.5">{c.label}<FiX size={14} /></button>)}
              <button onClick={clear} className="px-2 text-sm text-plum-700 underline">Clear all</button>
            </div>
          )}

          <div className="mt-8">
            {loading ? <GridSkeleton n={9} cols={gridCls} /> : products.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto mb-5 w-24"><Butterfly /></div>
                <p className="font-display text-4xl font-semibold text-plum-800">Nothing here yet</p>
                <p className="mt-2 text-plum-700/70">Try removing a filter or browsing another category.</p>
                <button onClick={clear} className="btn-plum mt-6">Clear filters</button>
              </div>
            ) : (
              <>
                <motion.div layout className={`grid gap-x-3 gap-y-9 sm:gap-x-5 ${gridCls}`}>{products.map((p) => <ProductCard key={p._id} product={p} />)}</motion.div>
                <div className="mt-14 text-center">
                  <p className="text-sm text-plum-700/60">Showing {products.length} of {meta.total}</p>
                  <div className="mx-auto mt-3 h-1 w-48 overflow-hidden rounded-full bg-plum-100"><div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${(products.length / Math.max(1, meta.total)) * 100}%` }} /></div>
                  {meta.page < meta.pages && <button onClick={loadMore} disabled={more} className="btn-outline mt-6">{more ? 'Loading…' : 'Load more'}</button>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter sheet */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div className="fixed inset-0 z-[55] bg-plum-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div className="fixed inset-x-0 bottom-0 z-[56] flex max-h-[88vh] flex-col rounded-t-3xl bg-white" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="flex items-center justify-between border-b border-plum-50 px-5 py-4"><h3 className="font-display text-3xl font-semibold text-plum-800">Filters</h3><button onClick={() => setSheet(false)} aria-label="Close"><FiX size={24} /></button></div>
              <div className="flex-1 overflow-y-auto px-5"><FilterPanel facets={facets} params={params} set={set} cats={cats} category={top} clear={clear} /></div>
              <div className="safe-b border-t border-plum-50 p-4"><button onClick={() => setSheet(false)} className="btn-plum w-full">Show {meta.total} products</button></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
