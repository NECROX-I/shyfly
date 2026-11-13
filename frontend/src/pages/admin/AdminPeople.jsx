import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { fmtDate, inr } from '../../lib/format'

export default function AdminPeople() {
  const [cust, setCust] = useState([])
  const [msgs, setMsgs] = useState([])
  const load = () => { adminAPI.customers().then((r) => setCust(r.data.customers)); adminAPI.messages().then((r) => setMsgs(r.data.messages)) }
  useEffect(load, [])
  const read = async (m) => { await adminAPI.readMessage(m._id); load() }
  return (
    <div className="space-y-10">
      <section><h1 className="font-display text-5xl font-semibold text-plum-800">Customers</h1>
        <div className="mt-5 overflow-x-auto rounded-3xl bg-white shadow-soft"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-blush text-xs uppercase tracking-wider text-plum-700/70"><tr><th className="p-4">Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Joined</th></tr></thead>
          <tbody>{cust.map((c) => <tr key={c._id} className="border-t border-plum-50"><td className="p-4 font-medium">{c.name}</td><td>{c.email}</td><td>{c.phone || '—'}</td><td>{c.orders}</td><td>{inr(c.spent)}</td><td>{fmtDate(c.createdAt)}</td></tr>)}{!cust.length && <tr><td colSpan="6" className="p-8 text-center text-plum-700/60">No customers yet.</td></tr>}</tbody></table></div></section>
      <section><h2 className="font-display text-4xl font-semibold text-plum-800">Messages & subscribers</h2>
        <div className="mt-5 space-y-3">{msgs.map((m) => <div key={m._id} className={`rounded-2xl bg-white p-5 shadow-soft ${m.isRead ? 'opacity-60' : ''}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm"><b>{m.name || 'Subscriber'}</b> · {m.email} {m.phone && `· ${m.phone}`} <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-[11px] uppercase">{m.type}</span></p><div className="flex items-center gap-3 text-xs text-plum-700/60">{fmtDate(m.createdAt)}{!m.isRead && <button onClick={() => read(m)} className="text-rose-500 underline">Mark read</button>}</div></div>{m.message && <p className="mt-2 text-[15px]">{m.message}</p>}</div>)}{!msgs.length && <p className="text-plum-700/60">Nothing yet.</p>}</div></section>
    </div>
  )
}
