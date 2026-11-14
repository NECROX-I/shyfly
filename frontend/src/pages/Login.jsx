import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import { authAPI } from '../services/api'
import { useAuth } from '../store'
import { errMsg } from '../lib/format'
import { Butterfly } from '../lib/art'

export default function Login() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { user, login } = useAuth()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={state?.from || '/account'} replace />
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const r = mode === 'login' ? await authAPI.login({ email: f.email, password: f.password }) : await authAPI.register(f)
      login(r.data.user, r.data.token); toast.success(`Welcome${r.data.user.name ? ', ' + r.data.user.name.split(' ')[0] : ''} 💗`)
      nav(state?.from || '/account', { replace: true })
    } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="container-x grid max-w-5xl gap-10 py-14 lg:grid-cols-2">
      <SEO title="Login" noindex />
      <div className="relative hidden overflow-hidden rounded-[32px] bg-gradient-to-br from-plum-800 to-rose-500 p-12 text-white lg:block">
        <div className="bg-petal absolute inset-0 opacity-40" /><Butterfly className="absolute right-8 top-8 w-28 animate-float" />
        <p className="relative mt-48 font-display text-6xl font-semibold leading-none">For every woman, <span className="italic text-rose-100">every you.</span></p>
        <p className="relative mt-5 text-white/80">Save your wishlist, track orders and check out faster.</p>
      </div>
      <form onSubmit={submit} className="self-center">
        <h1 className="font-display text-5xl font-semibold text-plum-800">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <div className="mt-6 space-y-4">
          {mode === 'register' && <><div><label className="label">Name</label><input className="input" value={f.name} onChange={on('name')} required /></div><div><label className="label">Mobile (optional)</label><input className="input" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div></>}
          <div><label className="label">Email</label><input type="email" className="input" value={f.email} onChange={on('email')} required autoComplete="email" /></div>
          <div><label className="label">Password</label><input type="password" className="input" value={f.password} onChange={on('password')} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>
        </div>
        {mode === 'login' && <Link to="/forgot-password" className="mt-1 block py-2.5 text-right text-sm text-plum-700 underline underline-offset-4 hover:text-rose-500">Forgot password?</Link>}
        <button disabled={busy} className="btn-plum btn-sheen mt-6 w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
        <p className="mt-5 text-center text-sm text-plum-800/70">{mode === 'login' ? 'New to Shyfly?' : 'Already have an account?'} <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="inline-block py-2.5 font-medium text-rose-500 underline">{mode === 'login' ? 'Create an account' : 'Log in'}</button></p>
      </form>
    </div>
  )
}
