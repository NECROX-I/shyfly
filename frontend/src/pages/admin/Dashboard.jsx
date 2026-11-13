import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { FiTrendingUp, FiShoppingBag, FiUsers, FiBox, FiAlertTriangle } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import { useAsync } from '../../lib/hooks'
import { inr, STATUS_LABEL } from '../../lib/format'
import ProductImage from '../../components/ProductImage'

export default function Dashboard() {
  const { loading, data: r, error } = useAsync(() => adminAPI.stats().then((x) => x.data), [])
  if (loading) return <div className="skeleton h-96 rounded-3xl" />
  if (error) return <p className="text-rose-500">Could not load stats.</p>
  const cards = [['Revenue', inr(r.totals.revenue), FiTrendingUp], ['Orders', r.totals.orders, FiShoppingBag], ['Customers', r.totals.customers, FiUsers], ['Products', r.totals.products, FiBox]]
  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl font-semibold text-plum-800">Dashboard</h1>
      {r.totals.openReturns > 0 && <Link to="/admin/returns" className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 text-amber-800"><span><b>{r.totals.openReturns}</b> return / exchange request{r.totals.openReturns > 1 ? 's' : ''} waiting for review</span><span className="underline">Review</span></Link>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map(([l, v, I]) => <div key={l} className="rounded-3xl bg-white p-5 shadow-soft"><span className="grid h-11 w-11 place-items-center rounded-full bg-blush text-rose-500"><I size={20} /></span><p className="mt-4 text-sm text-plum-700/60">{l}</p><p className="font-display text-4xl font-semibold text-plum-800">{v}</p></div>)}</div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-soft xl:col-span-2">
          <h2 className="font-display text-2xl font-semibold text-plum-800">Last 14 days</h2>
          <div className="mt-4 h-72"><ResponsiveContainer><AreaChart data={r.series.map((d) => ({ ...d, label: d.date.slice(5) }))}>
            <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4876" stopOpacity={0.5} /><stop offset="95%" stopColor="#ec4876" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3e0e8" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} width={50} />
            <Tooltip formatter={(v, n) => (n === 'revenue' ? inr(v) : v)} /><Area type="monotone" dataKey="revenue" stroke="#ec4876" fill="url(#rev)" strokeWidth={2.5} />
          </AreaChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl font-semibold text-plum-800">Orders by status</h2>
          <div className="mt-4 space-y-2">{Object.entries(r.byStatus).map(([s, n]) => <Link key={s} to={`/admin/orders?status=${s}`} className="flex items-center justify-between rounded-xl bg-blush px-4 py-2.5 text-sm hover:bg-plum-50"><span>{STATUS_LABEL[s] || s}</span><b>{n}</b></Link>)}{!Object.keys(r.byStatus).length && <p className="text-sm text-plum-700/60">No orders yet.</p>}</div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-semibold text-plum-800">Top sellers</h2>
          <div className="mt-4 divide-y divide-plum-50">{r.topProducts.map((p) => <div key={p._id} className="flex items-center gap-3 py-3"><div className="h-12 w-10 overflow-hidden rounded-lg bg-plum-50"><ProductImage product={{ name: p.name, images: p.image ? [{ url: p.image }] : [] }} w={100} className="h-full w-full object-cover" /></div><p className="flex-1 truncate text-sm font-medium">{p.name}</p><span className="text-sm text-plum-700/60">{p.qty} sold</span><b className="text-sm">{inr(p.revenue)}</b></div>)}{!r.topProducts.length && <p className="text-sm text-plum-700/60">Nothing sold yet.</p>}</div></div>
        <div className="rounded-3xl bg-white p-6 shadow-soft"><h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-plum-800"><FiAlertTriangle className="text-rose-500" /> Low stock</h2>
          <div className="mt-4 divide-y divide-plum-50">{r.lowStock.map((p) => <Link to="/admin/products" key={p._id} className="flex items-center justify-between py-3 text-sm hover:text-rose-500"><span className="truncate">{p.name}</span><b className={p.stockLeft === 0 ? 'text-rose-500' : ''}>{p.stockLeft} left</b></Link>)}{!r.lowStock.length && <p className="text-sm text-plum-700/60">All stocked up 🎉</p>}</div></div>
      </div>
    </div>
  )
}
