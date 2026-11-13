import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiSearch, FiX, FiArrowUpRight } from 'react-icons/fi'
import { useUI } from '../store'
import { useDebounce, useLockBody, useCategories } from '../lib/hooks'
import { shopAPI } from '../services/api'
import ProductImage from './ProductImage'
import { inr } from '../lib/format'

const TRENDING = ['Jhumka', 'Kurti', 'Block heels', 'Sunglasses', 'Tote bag', 'Saree', 'Pearl']

export default function SearchOverlay() {
  const { searchOpen, setSearch } = useUI()
  const nav = useNavigate()
  const cats = useCategories()
  const [q, setQ] = useState('')
  const [res, setRes] = useState({ products: [], categories: [] })
  const [loading, setLoading] = useState(false)
  const dq = useDebounce(q, 250)
  const ref = useRef()
  useLockBody(searchOpen)

  useEffect(() => { if (searchOpen) setTimeout(() => ref.current?.focus(), 150); else { setQ(''); setRes({ products: [], categories: [] }) } }, [searchOpen])
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setSearch(false); if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearch(true) } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [])
  useEffect(() => {
    if (dq.trim().length < 2) { setRes({ products: [], categories: [] }); return }
    let live = true; setLoading(true)
    shopAPI.suggest(dq.trim()).then((r) => live && setRes(r.data)).catch(() => {}).finally(() => live && setLoading(false))
    return () => { live = false }
  }, [dq])

  const go = (term) => { setSearch(false); nav(`/shop?q=${encodeURIComponent(term)}`) }

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[60] overflow-y-auto bg-white/95 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="container-x max-w-4xl pb-16 pt-6 sm:pt-12">
            <div className="flex justify-end"><button onClick={() => setSearch(false)} className="rounded-full p-2 hover:bg-plum-50" aria-label="Close search"><FiX size={26} /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q.trim()) }} className="mt-2 flex items-center gap-4 border-b-2 border-plum-700 pb-3">
              <FiSearch size={28} className="text-plum-700" />
              <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="What are you looking for?" className="w-full bg-transparent font-display text-3xl text-plum-900 placeholder-plum-200 focus:outline-none sm:text-5xl" />
            </form>

            {q.trim().length < 2 ? (
              <div className="mt-10">
                <p className="eyebrow">Trending searches</p>
                <div className="mt-4 flex flex-wrap gap-2">{TRENDING.map((t) => <button key={t} onClick={() => go(t)} className="chip">{t}<FiArrowUpRight size={14} /></button>)}</div>
                <p className="eyebrow mt-10">Browse</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {cats.map((c) => <Link key={c._id} onClick={() => setSearch(false)} to={`/shop/${c.slug}`} className="rounded-2xl bg-blush px-5 py-4 font-display text-xl font-semibold text-plum-800 transition hover:bg-plum-700 hover:text-white">{c.name}</Link>)}
                </div>
              </div>
            ) : (
              <div className="mt-8">
                {res.categories.length > 0 && <div className="mb-6 flex flex-wrap gap-2">{res.categories.map((c) => <Link key={c._id} onClick={() => setSearch(false)} to={`/shop/${c.slug}`} className="chip">in {c.name}</Link>)}</div>}
                {loading && res.products.length === 0 && <p className="text-plum-700/60">Searching…</p>}
                {!loading && res.products.length === 0 && <p className="text-plum-700/70">Nothing found for “{q}”. Try a simpler word like <button className="underline" onClick={() => go('pearl')}>pearl</button>.</p>}
                <div className="divide-y divide-plum-50">
                  {res.products.map((p) => (
                    <Link key={p._id} to={`/product/${p.slug}`} onClick={() => setSearch(false)} className="flex items-center gap-4 py-3 transition hover:bg-blush/60">
                      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg"><ProductImage product={p} w={160} className="h-full w-full object-cover" /></div>
                      <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.name}</p><p className="text-sm text-plum-700/60">{inr(p.price)}</p></div>
                      <FiArrowUpRight className="text-plum-300" />
                    </Link>
                  ))}
                </div>
                {res.products.length > 0 && <button onClick={() => go(q.trim())} className="btn-plum mt-6">See all results</button>}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
