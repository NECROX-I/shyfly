import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI, authAPI } from '../../services/api'
import { useAuth } from '../../store'
import { errMsg, fmtDate } from '../../lib/format'

export default function AdminTeam() {
  const me = useAuth((s) => s.user)
  const [admins, setAdmins] = useState([])
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [nu, setNu] = useState({ name: '', email: '', password: '' })
  const load = () => adminAPI.admins().then((r) => setAdmins(r.data.admins))
  useEffect(() => { load() }, [])

  const changePw = async (e) => { e.preventDefault(); try { await authAPI.changePassword(pw); toast.success('Password changed'); setPw({ currentPassword: '', newPassword: '' }) } catch (err) { toast.error(errMsg(err)) } }
  const add = async (e) => { e.preventDefault(); try { const r = await adminAPI.createAdmin(nu); toast.success(r.data.promoted ? 'Existing customer promoted to admin' : 'Admin added'); setNu({ name: '', email: '', password: '' }); load() } catch (err) { toast.error(errMsg(err)) } }
  const act = async (a, body, msg) => { try { await adminAPI.updateAdmin(a._id, body); toast.success(msg); load() } catch (err) { toast.error(errMsg(err)) } }
  const reset = (a) => { const p = window.prompt(`New password for ${a.email} (min 8 characters):`); if (p) act(a, { password: p }, 'Password reset') }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-5xl font-semibold text-plum-800">Team & security</h1>

      <form onSubmit={changePw} className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="font-display text-3xl font-semibold text-plum-800">Change my password</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input type="password" required className="input" placeholder="Current password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /><input type="password" required minLength={8} className="input" placeholder="New password (min 8)" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /><button className="btn-plum">Update</button></div>
      </form>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="font-display text-3xl font-semibold text-plum-800">Admins</h2>
        <p className="mt-1 text-sm text-plum-700/60">Everyone listed here can manage the whole store. Add family or staff as needed; remove access any time.</p>
        <div className="mt-4 divide-y divide-plum-50">{admins.map((a) => (
          <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div><b>{a.name}</b> {a._id === me?._id && <span className="ml-1 rounded-full bg-blush px-2 py-0.5 text-[11px]">you</span>}<p className="text-plum-700/60">{a.email} · added {fmtDate(a.createdAt)}</p></div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs ${a.isActive ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-600'}`}>{a.isActive ? 'Active' : 'Disabled'}</span>
              <button onClick={() => reset(a)} className="text-plum-700 underline">Reset password</button>
              {a._id !== me?._id && <><button onClick={() => act(a, { isActive: !a.isActive }, a.isActive ? 'Disabled' : 'Enabled')} className="text-plum-700 underline">{a.isActive ? 'Disable' : 'Enable'}</button><button onClick={() => window.confirm(`Remove admin access for ${a.email}?`) && act(a, { remove: true }, 'Admin access removed')} className="text-rose-500 underline">Remove</button></>}
            </div>
          </div>))}</div>
        <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-blush p-4 sm:grid-cols-4">
          <input required className="input" placeholder="Name" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} /><input required type="email" className="input" placeholder="Email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} /><input type="password" minLength={8} className="input" placeholder="Password (min 8)" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} autoComplete="new-password" /><button className="btn-plum">Add admin</button>
          <p className="text-xs text-plum-700/60 sm:col-span-4">If this email already has a customer account, it is upgraded to admin and the password field is ignored.</p>
        </form>
      </section>
    </div>
  )
}
