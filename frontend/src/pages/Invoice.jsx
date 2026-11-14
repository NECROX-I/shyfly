import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { orderAPI } from '../services/api'
import { useConfig } from '../lib/hooks'
import { inr, fmtDate, errMsg, API_BASE } from '../lib/format'

export default function Invoice() {
  const [sp] = useSearchParams()
  const cfg = useConfig()
  const [o, setO] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { orderAPI.invoice({ order: sp.get('order'), phone: sp.get('phone'), t: sp.get('t') }).then((r) => setO(r.data.order)).catch((e) => setErr(errMsg(e, 'Invoice not found'))) }, []) // eslint-disable-line
  if (err) return <p className="p-10 text-center text-rose-600">{err}</p>
  if (!o) return <p className="p-10 text-center">Loading invoice…</p>
  const st = cfg.store || {}
  const addr = [o.address.line1, o.address.line2, o.address.landmark, `${o.address.city}, ${o.address.state} - ${o.address.pincode}`].filter(Boolean).join(', ')
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-[14px] text-plum-950 print:p-0 sm:p-10">
      <div className="mb-6 flex flex-wrap justify-end gap-3 print:hidden"><a href={`${API_BASE}/orders/invoice.pdf?order=${sp.get('order')}&${sp.get('t') ? `t=${sp.get('t')}` : `phone=${sp.get('phone') || ''}`}`} className="btn-plum !py-2.5">Download PDF</a><button onClick={() => window.print()} className="btn-outline !py-2.5">Print</button></div>
      <div className="flex items-start justify-between border-b-2 border-plum-800 pb-5">
        <div><img src="/logo-mark.png" alt="Shyfly" className="h-14" /><p className="mt-2 font-semibold">{st.businessName || st.name || 'Shyfly'}</p>{st.address && <p className="max-w-xs text-plum-700/80">{st.address}</p>}{st.gstin && <p>GSTIN: {st.gstin}</p>}{(st.phone || st.email) && <p className="text-plum-700/80">{[st.phone, st.email].filter(Boolean).join(' · ')}</p>}</div>
        <div className="text-right"><h1 className="font-display text-4xl font-semibold text-plum-800">Invoice</h1><p className="mt-1">No: <b>{o.orderNumber}</b></p><p>Date: {fmtDate(o.createdAt)}</p></div>
      </div>
      <div className="grid gap-6 py-5 sm:grid-cols-2">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-plum-700/60">Billed & shipped to</p><p className="mt-1 font-medium">{o.customer.name}</p><p>{addr}</p><p>Phone: {o.customer.phone}</p></div>
        <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-wider text-plum-700/60">Payment</p><p className="mt-1">{o.payment.method === 'cod' ? 'Cash on Delivery' : 'Paid online (Razorpay)'}</p><p className="capitalize">Status: {o.payment.status.replace('_', ' ')}</p></div>
      </div>
      <table className="w-full text-left"><thead><tr className="border-y border-plum-200 bg-plum-50 text-xs uppercase tracking-wider"><th className="p-2">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th></tr></thead>
        <tbody>{o.items.map((i, k) => <tr key={k} className="border-b border-plum-100"><td className="p-2">{i.name}<span className="block text-xs text-plum-700/60">{[i.color, i.size && `Size ${i.size}`].filter(Boolean).join(' · ')}</span></td><td className="p-2 text-right">{i.qty}</td><td className="p-2 text-right">{inr(i.price)}</td><td className="p-2 text-right">{inr(i.price * i.qty)}</td></tr>)}</tbody></table>
      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
        {o.discount > 0 && <div className="flex justify-between"><dt>Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>− {inr(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shipping ? inr(o.shipping) : 'Free'}</dd></div>
        {o.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(o.codFee)}</dd></div>}
        <div className="flex justify-between border-t-2 border-plum-800 pt-2 text-lg font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
      </dl>
      <p className="mt-8 text-xs text-plum-700/70">All prices are in INR and inclusive of applicable taxes. This is a computer-generated invoice. For help, contact {st.email || st.phone || 'our support team'}.</p>
    </div>
  )
}
