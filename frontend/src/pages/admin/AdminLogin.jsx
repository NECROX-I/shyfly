import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../../services/api'
import { useAuth } from '../../store'
import { errMsg } from '../../lib/format'

export default function AdminLogin() {
  const nav = useNavigate()
  const { user, login } = useAuth()
  const [f, setF] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { const r = await authAPI.login(f); if (r.data.user.role !== 'admin') throw new Error('This account is not an admin'); login(r.data.user, r.data.token); nav('/admin') }
    catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-blush p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lift">
        <img src="/logo-mark.png" alt="Shyfly" className="mx-auto h-16" /><p className="mb-6 mt-1 text-center text-xs uppercase tracking-[.25em] text-plum-700/50">Admin login</p>
        <div className="space-y-4"><div><label className="label">Email</label><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div><div><label className="label">Password</label><input type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></div></div>
        <button disabled={busy} className="btn-plum mt-6 w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link to="/forgot-password" className="mt-4 block text-center text-sm text-plum-700 underline">Forgot password?</Link>
      </form>
    </div>
  )
}
