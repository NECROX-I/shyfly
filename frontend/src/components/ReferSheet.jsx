import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FaWhatsapp } from 'react-icons/fa'
import { FiX, FiCopy, FiShare2 } from 'react-icons/fi'
import { useAuth } from '../store'
import { useConfig, useLockBody } from '../lib/hooks'
import { authAPI } from '../services/api'

// 🍬 Refer & Earn — a bottom sheet opened straight from the tab bar, so nobody has to dig through Account.
export default function ReferSheet({ open, onClose }) {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const setUser = useAuth((s) => s.setUser)
  const cfg = useConfig()
  const bonus = cfg.candy?.referralBonus ?? 100
  const signup = cfg.candy?.signupBonus ?? 200
  const [code, setCode] = useState(user?.referralCode || '')
  useLockBody(open)

  // older logins may not carry a code yet → fetch it (the server creates one on demand)
  useEffect(() => {
    if (!open || !user) return
    if (user.referralCode) return setCode(user.referralCode)
    authAPI.candies().then((r) => { setCode(r.data.referralCode || ''); setUser({ ...user, candies: r.data.balance, referralCode: r.data.referralCode }) }).catch(() => {})
  }, [open, user?._id]) // eslint-disable-line

  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  const link = code ? `${window.location.origin}/login?ref=${code}` : ''
  const text = `Join Shyfly Fashion with my code ${code} and we both get ${bonus} candies 🍬 (1 candy = ₹1).`
  const copy = async (v, ok) => { try { await navigator.clipboard.writeText(v); toast.success(ok) } catch { toast.error('Couldn’t copy — please copy it manually') } }
  const share = () => navigator.share({ title: 'Shyfly Fashion', text, url: link }).catch(() => {})
  const go = (to, state) => { onClose(); nav(to, state && { state }) }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label="Refer and earn" onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.22 }}
            className="safe-b flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
            <div className="relative bg-gradient-to-br from-plum-800 to-rose-500 px-6 pb-6 pt-5 text-white">
              <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/40 sm:hidden" />
              <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-white/90 hover:bg-white/10"><FiX size={20} /></button>
              <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/80">Refer &amp; Earn</p>
              <h2 className="mt-1 font-display text-[28px] font-semibold leading-tight">Give {bonus} 🍬, get {bonus} 🍬</h2>
              <p className="mt-1.5 text-sm text-white/85">Invite a friend. When she joins with your code, you both get {bonus} candies (1 candy = ₹1).</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {user ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-plum-700/60">Your referral code</p>
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-blush px-4 py-3">
                    <span className="min-w-0 truncate font-display text-[28px] font-semibold tracking-wider text-plum-800">{code || '…'}</span>
                    <button type="button" disabled={!code} onClick={() => copy(code, 'Code copied')} aria-label="Copy code" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-plum-800 active:scale-95 disabled:opacity-50"><FiCopy size={17} /></button>
                  </div>

                  <a href={code ? `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}` : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!code}
                    className={`mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] text-[13px] font-bold uppercase tracking-wide text-white active:scale-[.98] ${code ? '' : 'pointer-events-none opacity-60'}`}>
                    <FaWhatsapp size={20} /> Share on WhatsApp
                  </a>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button type="button" disabled={!code} onClick={() => copy(link, 'Invite link copied')} className="flex h-11 items-center justify-center gap-2 rounded-full border border-plum-200 text-[12px] font-semibold uppercase tracking-wide text-plum-800 active:scale-[.98] disabled:opacity-50"><FiCopy size={15} /> Copy link</button>
                    {typeof navigator !== 'undefined' && navigator.share
                      ? <button type="button" disabled={!code} onClick={share} className="flex h-11 items-center justify-center gap-2 rounded-full border border-plum-200 text-[12px] font-semibold uppercase tracking-wide text-plum-800 active:scale-[.98] disabled:opacity-50"><FiShare2 size={15} /> More…</button>
                      : <button type="button" onClick={() => go('/account?tab=candy')} className="flex h-11 items-center justify-center rounded-full border border-plum-200 text-[12px] font-semibold uppercase tracking-wide text-plum-800 active:scale-[.98]">My candies</button>}
                  </div>
                  <p className="mt-4 text-center text-sm text-plum-700/70">You have <b className="text-plum-800">🍬 {user.candies ?? 0}</b> candies · <button type="button" onClick={() => go('/account?tab=candy')} className="font-semibold text-rose-500 underline-offset-2 hover:underline">see history</button></p>
                </>
              ) : (
                <>
                  <p className="text-[15px] leading-relaxed text-plum-800">Create your free account to get your personal referral code — and <b>{signup} candies</b> as a welcome gift.</p>
                  <button type="button" onClick={() => go('/login', { mode: 'register' })} className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-rose-500 text-[13px] font-bold uppercase tracking-wide text-white active:scale-[.98]">Sign up · get {signup} 🍬</button>
                  <button type="button" onClick={() => go('/login')} className="mt-2 flex h-11 w-full items-center justify-center rounded-full text-[12px] font-semibold uppercase tracking-wide text-plum-700">I already have an account</button>
                </>
              )}

              <ol className="mt-5 space-y-2.5 border-t border-plum-100 pt-4 text-sm text-plum-700/80">
                {['Share your code or link with a friend', 'She signs up using it', `You both get ${bonus} candies — use them at checkout`].map((t, i) => (
                  <li key={t} className="flex items-start gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blush text-[12px] font-bold text-plum-800">{i + 1}</span><span className="pt-0.5">{t}</span></li>
                ))}
              </ol>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
