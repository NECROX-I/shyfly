import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiTrash2, FiPlus } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import { errMsg } from '../../lib/format'

const KINDS = ['ornaments', 'clothing', 'footwear', 'handbags', 'eyewear', 'accessories']
const Card = ({ title, hint, children }) => <section className="rounded-3xl bg-white p-6 shadow-soft"><h2 className="font-display text-3xl font-semibold text-plum-800">{title}</h2>{hint && <p className="mt-1 text-sm text-plum-700/60">{hint}</p>}<div className="mt-5">{children}</div></section>
const In = ({ label, value, onChange, ph, area, rows = 3 }) => <div><label className="label">{label}</label>{area ? <textarea rows={rows} className="input" placeholder={ph} value={value ?? ''} onChange={onChange} /> : <input className="input" placeholder={ph} value={value ?? ''} onChange={onChange} />}</div>
const Kind = ({ value, onChange }) => <div><label className="label">Icon</label><select className="input" value={value} onChange={onChange}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select></div>

export default function AdminContent() {
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { adminAPI.settings().then((r) => setF(r.data.settings)) }, [])
  if (!f) return <div className="skeleton h-96 rounded-3xl" />
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setIn = (k, sub, v) => set(k, { ...f[k], [sub]: v })
  const setList = (k, i, sub, v) => set(k, f[k].map((x, j) => (j === i ? { ...x, [sub]: v } : x)))
  const save = async () => {
    setBusy(true)
    try { const r = await adminAPI.saveSettings({ heroSlides: f.heroSlides, promoTiles: f.promoTiles, social: f.social, about: f.about, policies: f.policies, footerTagline: f.footerTagline }); setF(r.data.settings); toast.success('Website updated — live now') } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-5xl font-semibold text-plum-800">Website content</h1><p className="mt-1 text-sm text-plum-700/60">Change what customers see on the home page, About page, policies and footer.</p></div><button onClick={save} disabled={busy} className="btn-plum">{busy ? 'Saving…' : 'Save all changes'}</button></div>

      <Card title="Home page banner slides" hint="The big rotating banner. Up to 6 slides. Link examples: /shop/ornaments · /shop/footwear/heels · /shop?sale=true · /shop?isNew=true">
        <div className="space-y-5">
          {f.heroSlides.map((h, i) => (
            <div key={i} className="rounded-2xl border border-plum-100 p-4">
              <div className="mb-3 flex items-center justify-between"><b className="text-sm text-plum-700/70">Slide {i + 1}</b><button onClick={() => set('heroSlides', f.heroSlides.filter((_, j) => j !== i))} className="text-plum-300 hover:text-rose-500" aria-label="Remove"><FiTrash2 /></button></div>
              <div className="grid gap-3 sm:grid-cols-3"><In label="Small heading" value={h.eyebrow} onChange={(e) => setList('heroSlides', i, 'eyebrow', e.target.value)} /><In label="Title line 1" value={h.title1} onChange={(e) => setList('heroSlides', i, 'title1', e.target.value)} /><In label="Title line 2 (italic)" value={h.title2} onChange={(e) => setList('heroSlides', i, 'title2', e.target.value)} /></div>
              <div className="mt-3"><In label="Short description" area rows={2} value={h.sub} onChange={(e) => setList('heroSlides', i, 'sub', e.target.value)} /></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4"><In label="Button text" value={h.cta} onChange={(e) => setList('heroSlides', i, 'cta', e.target.value)} /><In label="Button links to" value={h.to} onChange={(e) => setList('heroSlides', i, 'to', e.target.value)} /><Kind value={h.kind} onChange={(e) => setList('heroSlides', i, 'kind', e.target.value)} /><In label="Photo URL (optional)" value={h.image} onChange={(e) => setList('heroSlides', i, 'image', e.target.value)} ph="https://…" /></div>
            </div>
          ))}
          {f.heroSlides.length < 6 && <button onClick={() => set('heroSlides', [...f.heroSlides, { eyebrow: '', title1: '', title2: '', sub: '', cta: 'Shop now', to: '/shop', kind: 'ornaments', image: '' }])} className="inline-flex items-center gap-1 text-sm text-rose-500 underline"><FiPlus /> Add slide</button>}
        </div>
      </Card>

      <Card title="Four promo tiles" hint="The small cards beside the banner.">
        <div className="space-y-4">{f.promoTiles.map((t, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-plum-100 p-4 sm:grid-cols-5"><In label="Badge (Hot, New…)" value={t.tag} onChange={(e) => setList('promoTiles', i, 'tag', e.target.value)} /><div className="sm:col-span-2"><In label="Headline" value={t.label} onChange={(e) => setList('promoTiles', i, 'label', e.target.value)} /></div><In label="Links to" value={t.to} onChange={(e) => setList('promoTiles', i, 'to', e.target.value)} /><Kind value={t.kind} onChange={(e) => setList('promoTiles', i, 'kind', e.target.value)} /></div>
        ))}</div>
      </Card>

      <Card title="Social links" hint="Leave blank to hide an icon from the footer.">
        <div className="grid gap-3 sm:grid-cols-3"><In label="Instagram URL" value={f.social.instagram} onChange={(e) => setIn('social', 'instagram', e.target.value)} ph="https://instagram.com/…" /><In label="Facebook URL" value={f.social.facebook} onChange={(e) => setIn('social', 'facebook', e.target.value)} /><In label="YouTube URL" value={f.social.youtube} onChange={(e) => setIn('social', 'youtube', e.target.value)} /></div>
        <div className="mt-4"><In label="Footer tagline" area rows={2} value={f.footerTagline} onChange={(e) => set('footerTagline', e.target.value)} /></div>
      </Card>

      <Card title="About page" hint="Separate paragraphs with a blank line.">
        <div className="space-y-3"><In label="Heading" value={f.about.heading} onChange={(e) => setIn('about', 'heading', e.target.value)} /><In label="Intro line" value={f.about.intro} onChange={(e) => setIn('about', 'intro', e.target.value)} /><In label="Our story" area rows={7} value={f.about.story} onChange={(e) => setIn('about', 'story', e.target.value)} /></div>
      </Card>

      <Card title="Policy pages (optional)" hint="Empty by default. A page and its footer link appear only after you write text here. Separate paragraphs with a blank line. You can use {{freeShippingMin}}, {{shippingFee}}, {{codFee}}, {{codMax}}, {{processingDays}}, {{returnWindowDays}}.">
        <div className="space-y-4">{[['shipping', 'Shipping policy'], ['returns', 'Returns & exchange'], ['privacy', 'Privacy policy'], ['terms', 'Terms of service']].map(([k, l]) => <In key={k} label={l} area rows={6} value={f.policies[k]} onChange={(e) => setIn('policies', k, e.target.value)} />)}</div>
      </Card>
      <button onClick={save} disabled={busy} className="btn-plum">{busy ? 'Saving…' : 'Save all changes'}</button>
    </div>
  )
}
