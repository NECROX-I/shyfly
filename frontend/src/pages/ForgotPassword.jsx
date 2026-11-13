import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import { authAPI } from '../services/api'
import { errMsg } from '../lib/format'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (e) => { e.preventDefault(); setBusy(true); try { await authAPI.forgot(email); setDone(true) } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) } }
  return (
    <div className="container-x max-w-md py-20">
      <SEO title="Forgot password" noindex />
      <h1 className="font-display text-5xl font-semibold text-plum-800">Forgot password?</h1>
      {done ? <div className="mt-6 rounded-3xl bg-blush p-6 text-plum-800">If an account exists for <b>{email}</b>, we’ve sent a reset link. It works for 30 minutes. Check your spam folder too.<Link to="/login" className="btn-plum mt-5 w-full">Back to login</Link></div> : (
        <form onSubmit={submit} className="mt-6 space-y-4"><p className="text-plum-800/70">Enter your email and we’ll send you a link to choose a new password.</p><input type="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button disabled={busy} className="btn-plum w-full">{busy ? 'Sending…' : 'Send reset link'}</button></form>
      )}
    </div>
  )
}
