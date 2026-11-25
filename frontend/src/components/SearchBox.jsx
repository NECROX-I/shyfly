import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiSearch, FiX, FiClock, FiTrendingUp, FiArrowUpLeft } from 'react-icons/fi'
import { useDebounce } from '../lib/hooks'
import { shopAPI } from '../services/api'
import ProductImage from './ProductImage'
import { inr } from '../lib/format'

const TRENDING = ['Jhumka', 'Kurti', 'Block heels', 'Sunglasses', 'Tote bag', 'Saree', 'Pearl']
const KEY = 'shyfly-recent-searches'
const readRecent = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const writeRecent = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* private mode */ } }

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// bold the part of a suggestion the shopper has typed
function Hit({ text, q }) {
  const t = q.trim()
  if (!t) return text
  return text.split(new RegExp(`(${esc(t)})`, 'ig')).map((part, i) => (part.toLowerCase() === t.toLowerCase() ? <b key={i} className="font-semibold text-plum-900">{part}</b> : <span key={i}>{part}</span>))
}

/**
 * Amazon-style search: a real input in the header with a suggestion dropdown right under it
 * (recent + trending when empty, products / categories as you type). No full-screen takeover.
 */
export default function SearchBox({ className = '', id = 'search' }) {
  const nav = useNavigate()
  const loc = useLocation()
  // shorter placeholder on phones so it never gets cut mid-word
  const [short, setShort] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 479px)').matches)
  useEffect(() => {
    const m = window.matchMedia?.('(max-width: 479px)'); if (!m) return
    const h = () => setShort(m.matches); m.addEventListener?.('change', h); return () => m.removeEventListener?.('change', h)
  }, [])
  const wrap = useRef()
  const input = useRef()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [act, setAct] = useState(-1)
  const [res, setRes] = useState({ products: [], categories: [] })
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState(readRecent)
  const dq = useDebounce(q, 220)
  const term = q.trim()

  // keep the box in sync with the page: show the current query on /shop?q=…, clear elsewhere
  useEffect(() => {
    setOpen(false)
    setAct(-1)
    setQ(loc.pathname === '/shop' ? new URLSearchParams(loc.search).get('q') || '' : '')
  }, [loc.pathname, loc.search])

  useEffect(() => {
    if (dq.trim().length < 2) { setRes({ products: [], categories: [] }); setLoading(false); return }
    let live = true
    setLoading(true)
    shopAPI.suggest(dq.trim()).then((r) => live && setRes({ products: r.data.products || [], categories: r.data.categories || [] })).catch(() => {}).finally(() => live && setLoading(false))
    return () => { live = false }
  }, [dq])

  // click / tap outside closes the dropdown
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    document.addEventListener('touchstart', h, { passive: true })
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h) }
  }, [open])

  const remember = (t) => { const next = [t, ...readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6); writeRecent(next); setRecent(next) }
  const go = (t) => { const v = t.trim(); if (!v) return; remember(v); setOpen(false); input.current?.blur(); nav(`/shop?q=${encodeURIComponent(v)}`) }
  const open_ = (to) => { setOpen(false); input.current?.blur(); nav(to) }
  const clearRecent = () => { writeRecent([]); setRecent([]) }
  const removeRecent = (t) => { const next = recent.filter((x) => x !== t); writeRecent(next); setRecent(next) }

  // one flat list so the arrow keys can walk through everything
  const typing = term.length >= 2
  const rows = useMemo(() => {
    if (!typing) return [
      ...recent.map((t) => ({ k: `r-${t}`, kind: 'recent', text: t, run: () => go(t) })),
      ...TRENDING.filter((t) => !recent.some((r) => r.toLowerCase() === t.toLowerCase())).slice(0, 6 - Math.min(recent.length, 3)).map((t) => ({ k: `t-${t}`, kind: 'trend', text: t, run: () => go(t) })),
    ]
    return [
      ...res.categories.map((c) => ({ k: `c-${c._id}`, kind: 'cat', text: c.name, run: () => open_(`/shop/${c.slug}`) })),
      ...res.products.map((p) => ({ k: `p-${p._id}`, kind: 'product', p, run: () => { remember(term); open_(`/product/${p.slug}`) } })),
      { k: 'all', kind: 'all', text: term, run: () => go(term) },
    ]
  }, [typing, term, res, recent]) // eslint-disable-line

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setAct((a) => (a + 1) % Math.max(rows.length, 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAct((a) => (a <= 0 ? rows.length - 1 : a - 1)) }
    else if (e.key === 'Escape') { setOpen(false); setAct(-1); input.current?.blur() }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && act >= 0 && rows[act]) rows[act].run(); else go(q) }
  }
  useEffect(() => { setAct(-1) }, [rows.length, term])

  const showPanel = open && (rows.length > 0 || (typing && loading))
  const optId = (i) => `${id}-opt-${i}`

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(q) }} onClick={(e) => { if (!e.target.closest?.('button')) input.current?.focus() }}
        className={`flex h-11 cursor-text items-center rounded-full border bg-blush pl-4 pr-1 transition ${open ? 'border-plum-700 bg-white shadow-soft' : 'border-plum-100 hover:border-rose-300 hover:bg-white'}`}>
        <FiSearch size={17} className="shrink-0 text-plum-700/60" aria-hidden="true" />
        <input ref={input} data-search id={id} type="search" enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false}
          role="combobox" aria-expanded={showPanel} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={act >= 0 ? optId(act) : undefined}
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          placeholder={short ? 'Search Shyfly' : 'Search for necklaces, kurtis, heels, sunglasses…'}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] text-plum-900 placeholder-plum-700/50 focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden" />
        {q && <button type="button" onClick={() => { setQ(''); setOpen(true); input.current?.focus() }} aria-label="Clear search" className="grid h-8 w-8 shrink-0 place-items-center text-plum-700/60 hover:text-rose-500"><FiX size={17} /></button>}
        <button type="submit" aria-label="Search" className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-plum-700 text-white transition hover:bg-rose-500"><FiSearch size={16} /></button>
      </form>

      {showPanel && (
        <div id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-2xl border border-plum-100 bg-white py-2 shadow-lift">
          {!typing && recent.length > 0 && (
            <div className="flex items-center justify-between px-4 pb-1 pt-1.5"><p className="eyebrow !text-[11px]">Recent searches</p><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearRecent} className="text-xs text-rose-500 hover:underline">Clear</button></div>
          )}
          {rows.map((r, i) => {
            const on = act === i
            const base = `flex w-full items-center gap-3 px-4 text-left transition ${on ? 'bg-blush' : 'hover:bg-blush/70'}`
            const show = r.kind === 'trend' && (i === 0 || rows[i - 1].kind !== 'trend')
            return (
              <div key={r.k}>
                {show && <p className="eyebrow !text-[11px] px-4 pb-1 pt-3">Trending</p>}
                {r.kind === 'product' && (i === 0 || rows[i - 1].kind !== 'product') && <p className="eyebrow !text-[11px] px-4 pb-1 pt-3">Products</p>}
                <div id={optId(i)} role="option" aria-selected={on} className="relative">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setAct(i)} onClick={r.run} className={`${base} ${r.kind === 'product' ? 'py-2' : 'py-2.5'}`}>
                    {r.kind === 'recent' && <FiClock size={16} className="shrink-0 text-plum-700/50" />}
                    {r.kind === 'trend' && <FiTrendingUp size={16} className="shrink-0 text-rose-400" />}
                    {r.kind === 'cat' && <FiSearch size={16} className="shrink-0 text-plum-700/50" />}
                    {r.kind === 'all' && <FiSearch size={16} className="shrink-0 text-rose-500" />}
                    {r.kind === 'product' ? (
                      <>
                        <span className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-plum-50"><ProductImage product={r.p} w={120} className="h-full w-full object-cover" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] text-plum-800"><Hit text={r.p.name} q={term} /></span><span className="block text-[13px] font-medium text-plum-700/70">{inr(r.p.price)}</span></span>
                      </>
                    ) : r.kind === 'cat' ? (
                      <span className="min-w-0 flex-1 truncate text-[14.5px] text-plum-800"><Hit text={r.text} q={term} /> <span className="text-plum-700/50">in</span> <b className="font-semibold text-rose-500">Categories</b></span>
                    ) : r.kind === 'all' ? (
                      <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-rose-500">See all results for “{r.text}”</span>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-[14.5px] text-plum-800">{r.text}</span>
                    )}
                    {(r.kind === 'recent' || r.kind === 'trend') && <FiArrowUpLeft size={15} className="shrink-0 text-plum-300" />}
                  </button>
                  {r.kind === 'recent' && <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => removeRecent(r.text)} aria-label={`Remove ${r.text}`} className="absolute right-9 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-plum-300 hover:text-rose-500"><FiX size={14} /></button>}
                </div>
              </div>
            )
          })}
          {typing && loading && res.products.length === 0 && res.categories.length === 0 && <p className="px-4 py-3 text-sm text-plum-700/60">Searching…</p>}
          {typing && !loading && res.products.length === 0 && res.categories.length === 0 && <p className="px-4 pb-1 pt-3 text-sm text-plum-700/70">No quick matches for “{term}” — press Enter to search everything.</p>}
        </div>
      )}
    </div>
  )
}
