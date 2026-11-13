import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'
import SEO from '../components/SEO'
import { Butterfly } from '../lib/art'
import { inr } from '../lib/format'

export default function OrderSuccess() {
  const { orderNumber } = useParams()
  const { state } = useLocation()
  const order = state?.order
  const confetti = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ i, x: Math.random() * 100, d: Math.random() * 0.8, c: ['#f9698f', '#C9A24B', '#ffc7d9', '#6b1544'][i % 4], r: Math.random() * 360 })), [])
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div className="relative overflow-hidden">
      <SEO title="Order confirmed" noindex />
      {confetti.map((c) => <motion.span key={c.i} className="pointer-events-none absolute top-0 h-3 w-2 rounded-sm" style={{ left: `${c.x}%`, background: c.c }} initial={{ y: -20, opacity: 1, rotate: 0 }} animate={{ y: 620, opacity: 0, rotate: c.r + 360 }} transition={{ duration: 2.6, delay: c.d, ease: 'easeIn' }} />)}
      <div className="container-x max-w-2xl py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-plum-700 text-white shadow-lift"><FiCheck size={44} /></motion.div>
        <div className="mx-auto mt-6 w-20 animate-float"><Butterfly /></div>
        <h1 className="mt-2 font-display text-5xl font-semibold text-plum-800">Thank you{order?.customer?.name ? `, ${order.customer.name.split(' ')[0]}` : ''}!</h1>
        <p className="mt-3 text-plum-800/75">Your order is placed. We’ll start packing it with love.</p>
        <div className="mt-8 rounded-3xl bg-blush p-6 text-left">
          <div className="flex justify-between text-sm"><span className="text-plum-700/60">Order number</span><b className="tracking-wider">{orderNumber}</b></div>
          {order && <>
            <div className="mt-2 flex justify-between text-sm"><span className="text-plum-700/60">Payment</span><b>{order.payment.method === 'cod' ? 'Cash on Delivery' : order.payment.status === 'paid' ? 'Paid online ✓' : 'Online (pending)'}</b></div>
            {order.eta?.from && <div className="mt-2 flex justify-between text-sm"><span className="text-plum-700/60">Expected delivery</span><b>{new Date(order.eta.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(order.eta.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</b></div>}
            <div className="mt-2 flex justify-between text-sm"><span className="text-plum-700/60">Deliver to</span><b>{order.address.city}, {order.address.pincode}</b></div>
            <div className="mt-4 divide-y divide-plum-100 border-t border-plum-100">{order.items.map((i, k) => <div key={k} className="flex justify-between py-2 text-sm"><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>)}</div>
            <div className="flex justify-between border-t border-plum-100 pt-3 text-lg font-semibold text-plum-800"><span>Total</span><span>{inr(order.total)}</span></div>
          </>}
        </div>
        <p className="mt-5 text-sm text-plum-700/70">Save your order number — you’ll need it with your phone number to track this order.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to={`/track?order=${orderNumber}`} className="btn-plum">Track order</Link>{state?.phone && <Link to={`/invoice?order=${orderNumber}&phone=${state.phone}`} target="_blank" className="btn-outline">Invoice</Link>}<Link to="/shop" className="btn-outline">Keep shopping</Link></div>
      </div>
    </div>
  )
}
