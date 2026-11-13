import { Link } from 'react-router-dom'
import { FiX } from 'react-icons/fi'
import SEO from '../components/SEO'
import ProductImage from '../components/ProductImage'
import Stars from '../components/Stars'
import { useCompare } from '../store'
import { inr, discountPct } from '../lib/format'

export default function Compare() {
  const { items, remove, clear } = useCompare()
  const rows = [
    ['Price', (p) => <b className="text-plum-800">{inr(p.price)}</b>],
    ['Discount', (p) => (discountPct(p) ? `${discountPct(p)}% off` : '—')],
    ['Rating', (p) => (p.rating?.count ? <Stars value={p.rating.avg} count={p.rating.count} /> : '—')],
    ['Category', (p) => p.subCategory?.name || p.category?.name],
    ['Material', (p) => p.material || '—'],
    ['Colours', (p) => [...new Set(p.variants.map((v) => v.color).filter(Boolean))].join(', ') || '—'],
    ['Sizes', (p) => [...new Set(p.variants.map((v) => v.size).filter(Boolean))].join(', ') || 'Free size'],
    ['Availability', (p) => (p.variants.some((v) => v.stock > 0) ? <span className="text-green-700">In stock</span> : <span className="text-rose-500">Sold out</span>)],
  ]
  return (
    <div className="container-x py-12">
      <SEO title="Compare products" />
      <div className="flex items-end justify-between"><div><p className="eyebrow">Side by side</p><h1 className="h-section mt-2">Compare</h1></div>{items.length > 0 && <button onClick={clear} className="text-sm underline">Clear all</button>}</div>
      {items.length < 2 ? (
        <div className="py-16 text-center"><p className="font-display text-4xl font-semibold text-plum-800">Pick at least two products</p><p className="mt-2 text-plum-700/70">Use the compare icon on any product card.</p><Link to="/shop" className="btn-plum mt-6">Browse</Link></div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-x-4 text-left text-[15px]">
            <thead><tr><th className="w-32" />{items.map((p) => (
              <th key={p._id} className="relative align-top font-normal">
                <button onClick={() => remove(p._id)} className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 shadow" aria-label="Remove"><FiX size={14} /></button>
                <Link to={`/product/${p.slug}`}><div className="aspect-[4/5] overflow-hidden rounded-2xl bg-plum-50"><ProductImage product={p} w={500} className="h-full w-full object-cover" /></div><p className="mt-3 font-medium">{p.name}</p></Link>
              </th>))}</tr></thead>
            <tbody>{rows.map(([label, fn]) => <tr key={label} className="border-t"><td className="border-t border-plum-100 py-4 text-xs font-medium uppercase tracking-wider text-plum-700/60">{label}</td>{items.map((p) => <td key={p._id} className="border-t border-plum-100 py-4">{fn(p)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
