import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiTrash2, FiPlus, FiCheckCircle, FiAlertCircle, FiDownload } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import { errMsg } from '../../lib/format'

const Card = ({ title, hint, children }) => <section className="rounded-3xl bg-white p-6 shadow-soft"><h2 className="font-display text-3xl font-semibold text-plum-800">{title}</h2>{hint && <p className="mt-1 text-sm text-plum-700/60">{hint}</p>}<div className="mt-5">{children}</div></section>
const Num = ({ label, k, f, set, suffix }) => <div><label className="label">{label}</label><div className="relative"><input type="number" min="0" className="input" value={f[k] ?? ''} onChange={(e) => set(k, e.target.value)} />{suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-plum-700/50">{suffix}</span>}</div></div>
const Txt = ({ label, k, f, set, ph }) => <div><label className="label">{label}</label><input className="input" placeholder={ph} value={f[k] ?? ''} onChange={(e) => set(k, e.target.value)} /></div>
const Toggle = ({ label, hint, k, f, set }) => <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-blush p-4"><span><b className="block text-[15px]">{label}</b><span className="text-sm text-plum-700/60">{hint}</span></span><input type="checkbox" className="h-5 w-5 accent-plum-700" checked={!!f[k]} onChange={(e) => set(k, e.target.checked)} /></label>

export default function AdminSettings() {
  const [f, setF] = useState(null)
  const [keys, setKeys] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checks, setChecks] = useState([])
  const [range, setRange] = useState({ from: '', to: '' })
  useEffect(() => { adminAPI.setupStatus().then((r) => setChecks(r.data.checks)).catch(() => {}) }, [])
  const download = async (path, params, fallback) => {
    try { const r = await adminAPI.download(path, params); const cd = r.headers['content-disposition'] || ''; const name = (cd.match(/filename="([^"]+)"/) || [])[1] || fallback; const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url) } catch (e) { toast.error('Download failed') }
  }
  useEffect(() => { adminAPI.settings().then((r) => { setF(r.data.settings); setKeys(r.data.razorpayKeys) }) }, [])
  if (!f) return <div className="skeleton h-96 rounded-3xl" />
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const save = async () => {
    setBusy(true)
    try { const r = await adminAPI.saveSettings(f); setF(r.data.settings); toast.success('Settings saved — live on the store') } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }
  const zones = f.fastZones || []
  const setZone = (i, k, v) => set('fastZones', zones.map((z, j) => (j === i ? { ...z, [k]: v } : z)))
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-5xl font-semibold text-plum-800">Store settings</h1><button onClick={save} disabled={busy} className="btn-plum">{busy ? 'Saving…' : 'Save all changes'}</button></div>

      {checks.length > 0 && (
        <Card title="Setup checklist" hint="What is connected on the server. Anything marked with a warning needs the developer or the hosting dashboard (see HANDOVER.md).">
          <div className="grid gap-2 sm:grid-cols-2">{checks.map((c) => <div key={c.key} className={`flex items-start gap-3 rounded-2xl p-3 text-sm ${c.ok ? 'bg-green-50' : 'bg-amber-50'}`}>{c.ok ? <FiCheckCircle className="mt-0.5 shrink-0 text-green-600" /> : <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />}<div><b>{c.label}</b>{!c.ok && <p className="text-plum-800/70">{c.help}</p>}</div></div>)}</div>
        </Card>
      )}

      <Card title="Payments" hint="Turn payment methods on or off instantly.">
        <div className="space-y-3">
          <Toggle label="Online payment (UPI, cards, net banking, wallets)" hint={keys ? 'Razorpay is connected.' : '⚠ Razorpay keys are not set on the server yet — online payment stays off until a developer adds them.'} k="onlineEnabled" f={f} set={set} />
          <Toggle label="Cash on Delivery" hint="Customers can pay when the parcel arrives." k="codEnabled" f={f} set={set} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Num label="Free shipping above" k="freeShippingMin" f={f} set={set} suffix="₹" /><Num label="Shipping fee" k="shippingFee" f={f} set={set} suffix="₹" /><Num label="COD fee" k="codFee" f={f} set={set} suffix="₹" /><Num label="Max COD order" k="codMax" f={f} set={set} suffix="₹" /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Num label="Return window (0 = no returns)" k="returnWindowDays" f={f} set={set} suffix="days" /></div>
      </Card>

      <Card title="Delivery promise" hint="Shown on product pages, checkout and order tracking. Dates are calculated from these numbers.">
        <div className="grid gap-4 sm:grid-cols-3"><Num label="Packing time" k="processingDays" f={f} set={set} suffix="days" /><Num label="Fastest delivery" k="deliveryMinDays" f={f} set={set} suffix="days" /><Num label="Slowest delivery" k="deliveryMaxDays" f={f} set={set} suffix="days" /></div>
        <p className="mb-2 mt-6 text-sm font-medium">Faster zones <span className="font-normal text-plum-700/60">— e.g. your own city (pincode starts with 700)</span></p>
        <div className="space-y-2">{zones.map((z, i) => <div key={i} className="grid grid-cols-[1.2fr_1fr_80px_80px_32px] items-center gap-2"><input className="input !py-2" placeholder="Name (Kolkata)" value={z.label} onChange={(e) => setZone(i, 'label', e.target.value)} /><input className="input !py-2" placeholder="Pincode starts" value={z.prefix} onChange={(e) => setZone(i, 'prefix', e.target.value.replace(/\D/g, ''))} /><input className="input !py-2" type="number" min="0" placeholder="Min" value={z.minDays} onChange={(e) => setZone(i, 'minDays', e.target.value)} /><input className="input !py-2" type="number" min="0" placeholder="Max" value={z.maxDays} onChange={(e) => setZone(i, 'maxDays', e.target.value)} /><button onClick={() => set('fastZones', zones.filter((_, j) => j !== i))}><FiTrash2 className="text-plum-300" /></button></div>)}
          <button onClick={() => set('fastZones', [...zones, { label: '', prefix: '', minDays: 1, maxDays: 2 }])} className="inline-flex items-center gap-1 text-sm text-rose-500 underline"><FiPlus /> Add zone</button></div>
        <div className="mt-6"><label className="label">Pincodes we do NOT deliver to (comma separated, prefixes allowed)</label><input className="input" placeholder="e.g. 790, 744101" value={(f.blockedPincodes || []).join(', ')} onChange={(e) => set('blockedPincodes', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></div>
      </Card>

      <Card title="Business details" hint="Printed on invoices and shown to customers.">
        <div className="grid gap-4 sm:grid-cols-2"><Txt label="Store name" k="storeName" f={f} set={set} /><Txt label="Legal / business name" k="businessName" f={f} set={set} /><div className="sm:col-span-2"><Txt label="Business address" k="address" f={f} set={set} /></div><Txt label="GSTIN (if registered)" k="gstin" f={f} set={set} /><Txt label="WhatsApp number (with country code, e.g. 919876543210)" k="whatsapp" f={f} set={set} /><Txt label="Support phone" k="supportPhone" f={f} set={set} /><Txt label="Support email" k="supportEmail" f={f} set={set} /></div>
      </Card>

      <Card title="Top announcement bar" hint="One message per line (max 8). Leave empty for the default messages.">
        <textarea rows={4} className="input" value={(f.announcements || []).join('\n')} onChange={(e) => set('announcements', e.target.value.split('\n'))} />
      </Card>
      <Card title="Backups & exports" hint="Download a copy of your data regularly (weekly is a good habit). Keep the file private.">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => download('/admin/backup', {}, 'shyfly-backup.json')} className="btn-outline"><FiDownload /> Full backup (JSON)</button>
        </div>
        <p className="mb-2 mt-6 text-sm font-medium">Orders spreadsheet (CSV — opens in Excel / Google Sheets)</p>
        <div className="flex flex-wrap items-end gap-3"><div><label className="label">From</label><input type="date" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></div><div><label className="label">To</label><input type="date" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div><button onClick={() => download('/admin/orders-export', range, 'shyfly-orders.csv')} className="btn-outline"><FiDownload /> Download orders</button></div>
      </Card>
      <button onClick={save} disabled={busy} className="btn-plum w-full sm:w-auto">{busy ? 'Saving…' : 'Save all changes'}</button>
    </div>
  )
}
