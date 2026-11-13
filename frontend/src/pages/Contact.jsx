import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiMail, FiMessageCircle, FiClock } from 'react-icons/fi'
import SEO from '../components/SEO'
import { shopAPI } from '../services/api'
import { useConfig } from '../lib/hooks'
import { errMsg, waLink } from '../lib/format'

export default function Contact() {
  const cfg = useConfig()
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '' })
  const [busy, setBusy] = useState(false)
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => { e.preventDefault(); setBusy(true); try { await shopAPI.contact(f); toast.success('Message sent — we’ll reply soon 💌'); setF({ name: '', email: '', phone: '', message: '' }) } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) } }
  return (
    <div className="container-x grid max-w-5xl gap-12 py-14 lg:grid-cols-[1fr_1.2fr]">
      <SEO title="Contact us" />
      <div><p className="eyebrow">Say hello</p><h1 className="h-section mt-2">We’d love to hear from you</h1>
        <div className="mt-8 space-y-4">
          {cfg.whatsapp && <a href={waLink(cfg.whatsapp, 'Hi Shyfly!')} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl bg-blush p-5 transition hover:shadow-soft"><FiMessageCircle className="text-rose-500" size={24} /><div><b>WhatsApp us</b><p className="text-sm text-plum-700/70">Fastest way to reach us</p></div></a>}
          <div className="flex items-center gap-4 rounded-2xl bg-blush p-5"><FiMail className="text-rose-500" size={24} /><div><b>Write to us</b><p className="text-sm text-plum-700/70">Use the form — we reply within a day</p></div></div>
          <div className="flex items-center gap-4 rounded-2xl bg-blush p-5"><FiClock className="text-rose-500" size={24} /><div><b>Support hours</b><p className="text-sm text-plum-700/70">Mon – Sat, 10am – 7pm IST</p></div></div>
        </div></div>
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-plum-100 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Name</label><input className="input" value={f.name} onChange={on('name')} required /></div><div><label className="label">Phone</label><input className="input" value={f.phone} onChange={on('phone')} /></div></div>
        <div><label className="label">Email</label><input type="email" className="input" value={f.email} onChange={on('email')} /></div>
        <div><label className="label">Message</label><textarea rows={5} className="input" value={f.message} onChange={on('message')} required maxLength={3000} /></div>
        <button disabled={busy} className="btn-plum w-full">{busy ? 'Sending…' : 'Send message'}</button>
      </form>
    </div>
  )
}
