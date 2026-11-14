import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiInstagram, FiFacebook, FiYoutube, FiSend } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { shopAPI } from '../services/api'
import { useCategories, useConfig } from '../lib/hooks'
import { errMsg } from '../lib/format'

export default function Footer() {
  const cats = useCategories()
  const cfg = useConfig()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const subscribe = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await shopAPI.contact({ type: 'newsletter', email }); toast.success('You’re on the list 💌'); setEmail('') }
    catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  const pol = cfg.content?.policies || {}
  const col = 'space-y-2.5 text-[15px] text-plum-800/80 [&_a]:transition [&_a:hover]:text-rose-500'

  return (
    <footer className="mt-24 bg-blush pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <img src="/logo-full.png" alt="Shyfly — For Every Woman, Every You" className="w-60" loading="lazy" />
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-plum-800/75">{cfg.content?.footerTagline}</p>
          <form onSubmit={subscribe} className="mt-6 flex max-w-sm overflow-hidden rounded-full border border-plum-200 bg-white p-1">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email for offers" className="min-w-0 flex-1 bg-transparent px-4 text-sm focus:outline-none" />
            <button disabled={busy} className="grid h-10 w-10 place-items-center rounded-full bg-plum-700 text-white transition hover:bg-rose-500" aria-label="Subscribe"><FiSend size={16} /></button>
          </form>
          <div className="mt-6 flex gap-3">
            {[[FiInstagram, 'instagram'], [FiFacebook, 'facebook'], [FiYoutube, 'youtube']].filter(([, k]) => cfg.content?.social?.[k]).map(([I, k]) => <a key={k} href={cfg.content.social[k]} target="_blank" rel="noreferrer" aria-label={k} className="grid h-10 w-10 place-items-center rounded-full border border-plum-200 text-plum-700 transition hover:border-rose-500 hover:bg-rose-500 hover:text-white"><I size={17} /></a>)}
            {cfg.whatsapp && <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-plum-200 text-plum-700 transition hover:border-green-500 hover:bg-green-500 hover:text-white"><FaWhatsapp size={18} /></a>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
          <div><h4 className="eyebrow mb-5">Shop</h4><ul className={col}>{cats.map((c) => <li key={c._id}><Link to={`/shop/${c.slug}`}>{c.name}</Link></li>)}<li><Link to="/shop?isNew=true">New in</Link></li><li><Link to="/shop?sale=true">Sale</Link></li></ul></div>
          <div><h4 className="eyebrow mb-5">Help</h4><ul className={col}><li><Link to="/track">Track order</Link></li>{cfg.returnWindowDays > 0 && <li><Link to="/track">Return or exchange</Link></li>}{pol.shipping && <li><Link to="/policy/shipping">Shipping</Link></li>}{pol.returns && <li><Link to="/policy/returns">Returns policy</Link></li>}<li><Link to="/contact">Contact us</Link></li><li><Link to="/wishlist">Wishlist</Link></li></ul></div>
          <div><h4 className="eyebrow mb-5">Shyfly</h4><ul className={col}><li><Link to="/about">Our story</Link></li>{pol.privacy && <li><Link to="/policy/privacy">Privacy</Link></li>}{pol.terms && <li><Link to="/policy/terms">Terms</Link></li>}<li><Link to="/account">My account</Link></li></ul></div>
        </div>
      </div>
      <div className="border-t border-plum-100">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-plum-800/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Shyfly. All rights reserved.</p>
          <p>🔒 Secure payments · UPI · Cards · Net banking · Cash on Delivery</p>
        </div>
      </div>
    </footer>
  )
}
