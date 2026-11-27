import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiInstagram, FiFacebook, FiYoutube, FiSend, FiChevronDown } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { shopAPI } from '../services/api'
import { useCategories, useConfig } from '../lib/hooks'
import { errMsg } from '../lib/format'

// link column — an accordion on phones (keeps the footer short), always open from sm up
function Col({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-plum-100 sm:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-[48px] w-full items-center justify-between text-left sm:pointer-events-none sm:mb-5 sm:min-h-0">
        <h4 className="eyebrow">{title}</h4><FiChevronDown size={18} className={`text-plum-700/60 transition sm:hidden ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`${open ? 'block pb-3' : 'hidden'} sm:block sm:pb-0`}>{children}</div>
    </div>
  )
}

export default function Footer() {
  const cats = useCategories()
  const cfg = useConfig()
  const compact = useLocation().pathname.startsWith('/checkout') // tight spacing on checkout
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const subscribe = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await shopAPI.contact({ type: 'newsletter', email }); toast.success('You’re on the list 💌'); setEmail('') }
    catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  const pol = cfg.content?.policies || {}
  const col = 'flex flex-col gap-0.5 text-[14px] text-plum-800/80 sm:gap-2.5 sm:text-[15px] [&_a]:inline-block [&_a]:py-1.5 sm:[&_a]:py-1 [&_a]:transition [&_a:hover]:text-rose-500'

  return (
    <footer className={`${compact ? 'mt-6' : 'mt-12 sm:mt-24'} bg-blush pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0`}>
      <div className={`container-x grid gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-12 ${compact ? 'py-6 sm:py-10' : 'py-6 sm:py-16'}`}>
        <div className="lg:col-span-4">
          <img src="/logo-full.png" alt="Shyfly Fashion — For Every Woman, Every You" className="w-20 sm:w-24" loading="lazy" />
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-plum-800/75 sm:mt-4">{cfg.content?.footerTagline}</p>
          <form onSubmit={subscribe} className="mt-4 flex max-w-sm overflow-hidden rounded-full border border-plum-200 bg-white p-1 sm:mt-6">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email for offers" className="min-w-0 flex-1 bg-transparent px-4 text-[16px] focus:outline-none sm:text-sm" />
            <button disabled={busy} className="grid h-10 w-10 place-items-center rounded-full bg-plum-700 text-white transition hover:bg-rose-500" aria-label="Subscribe"><FiSend size={16} /></button>
          </form>
          <div className="mt-4 flex gap-3 sm:mt-6">
            {[[FiInstagram, 'instagram'], [FiFacebook, 'facebook'], [FiYoutube, 'youtube']].filter(([, k]) => cfg.content?.social?.[k]).map(([I, k]) => <a key={k} href={cfg.content.social[k]} target="_blank" rel="noreferrer" aria-label={k} className="grid h-10 w-10 place-items-center rounded-full border border-plum-200 text-plum-700 transition hover:border-rose-500 hover:bg-rose-500 hover:text-white"><I size={17} /></a>)}
            {cfg.whatsapp && <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-plum-200 text-plum-700 transition hover:border-green-500 hover:bg-green-500 hover:text-white"><FaWhatsapp size={18} /></a>}
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-plum-100 sm:grid-cols-3 sm:gap-10 sm:border-0 lg:col-span-8">
          <Col title="Shop"><ul className={`${col} max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-6`}>{cats.map((c) => <li key={c._id}><Link to={`/shop/${c.slug}`}>{c.name}</Link></li>)}<li><Link to="/shop?isNew=true">New in</Link></li><li><Link to="/shop?sale=true">Sale</Link></li></ul></Col>
          <Col title="Help"><ul className={col}><li><Link to="/track">Track order</Link></li>{cfg.returnWindowDays > 0 && <li><Link to="/track">Return or exchange</Link></li>}{pol.shipping && <li><Link to="/policy/shipping">Shipping</Link></li>}{pol.returns && <li><Link to="/policy/returns">Returns policy</Link></li>}<li><Link to="/contact">Contact us</Link></li><li><Link to="/wishlist">Wishlist</Link></li></ul></Col>
          <Col title="Shyfly"><ul className={col}><li><Link to="/about">Our story</Link></li>{pol.privacy && <li><Link to="/policy/privacy">Privacy</Link></li>}{pol.terms && <li><Link to="/policy/terms">Terms</Link></li>}<li><Link to="/account">My account</Link></li></ul></Col>
        </div>
      </div>
      <div className="border-t border-plum-100">
        <div className="container-x flex flex-col items-center justify-between gap-1.5 py-4 text-center text-xs sm:gap-3 sm:py-5 sm:text-left text-plum-800/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Shyfly Fashion. All rights reserved.</p>
          <p>🔒 Secure payments · UPI · Cards · Net banking · Cash on Delivery</p>
        </div>
      </div>
    </footer>
  )
}
