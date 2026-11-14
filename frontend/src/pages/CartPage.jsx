import { Link } from 'react-router-dom'
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'
import SEO from '../components/SEO'
import ProductImage from '../components/ProductImage'
import { FreeShipBar } from '../components/CartDrawer'
import { useCart } from '../store'
import { useConfig } from '../lib/hooks'
import { inr } from '../lib/format'

export default function CartPage() {
  const { items, setQty, remove } = useCart()
  const cfg = useConfig()
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const save = items.reduce((s, i) => s + Math.max(0, (i.mrp || i.price) - i.price) * i.qty, 0)
  const ship = subtotal >= cfg.freeShippingMin ? 0 : cfg.shippingFee
  if (!items.length) return <div className="container-x py-28 text-center"><SEO title="Your bag" /><p className="font-display text-5xl font-semibold text-plum-800">Your bag is empty</p><Link to="/shop" className="btn-plum mt-8">Start shopping</Link></div>
  return (
    <div className="container-x py-10">
      <SEO title="Your bag" noindex />
      <h1 className="h-section">Your bag</h1>
      <div className="mt-8 grid gap-10 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <FreeShipBar subtotal={subtotal} />
          {items.map((i) => (
            <div key={i.key} className="flex gap-3 rounded-2xl border border-plum-100 p-3 sm:gap-5 sm:p-4">
              <Link to={`/product/${i.slug}`} className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-plum-50 sm:h-32 sm:w-28"><ProductImage product={{ name: i.name, images: i.image ? [{ url: i.image }] : [], category: i.category }} w={260} className="h-full w-full object-cover" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/product/${i.slug}`} className="py-1 font-medium leading-snug">{i.name}</Link>
                <p className="mt-1 text-sm text-plum-700/60">{[i.color, i.size && `Size ${i.size}`].filter(Boolean).join(' · ')}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center rounded-full border border-plum-100">
                    <button onClick={() => setQty(i.key, i.qty - 1)} disabled={i.qty <= 1} className="p-3 disabled:opacity-30"><FiMinus size={14} /></button><span className="w-7 text-center">{i.qty}</span>
                    <button onClick={() => setQty(i.key, i.qty + 1)} disabled={i.qty >= (i.max || 10)} className="p-3 disabled:opacity-30"><FiPlus size={14} /></button>
                  </div>
                  <b className="text-lg text-plum-800">{inr(i.price * i.qty)}</b>
                </div>
              </div>
              <button onClick={() => remove(i.key)} className="self-start p-2 text-plum-300 hover:text-rose-500" aria-label="Remove"><FiTrash2 /></button>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-3xl bg-blush p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-3xl font-semibold text-plum-800">Summary</h2>
          <dl className="mt-5 space-y-3 text-[15px]">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
            {save > 0 && <div className="flex justify-between text-green-700"><dt>You save</dt><dd>{inr(save)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{ship ? inr(ship) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-plum-200 pt-3 text-lg font-semibold text-plum-800"><dt>Total</dt><dd>{inr(subtotal + ship)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-plum-700/60">Coupons & COD fee applied at checkout.</p>
          <Link to="/checkout" className="btn-plum btn-sheen mt-5 w-full">Proceed to checkout</Link>
        </aside>
      </div>
    </div>
  )
}
