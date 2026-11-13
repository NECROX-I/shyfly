import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import { authAPI } from '../services/api'
import { errMsg } from '../lib/format'

export default function ResetPassword() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await authAPI.reset({ email: sp.get('email'), token: sp.get('token'), password }); toast.success('Password updated — please log in'); nav('/login') } catch (err) { toast.error(errMsg(err)) } finally { setBusy(false) }
  }
  if (!sp.get('token')) return <div className="container-x py-24 text-center"><p className="font-display text-4xl text-plum-800">This reset link is incomplete.</p><Link to="/forgot-password" className="btn-plum mt-6">Request a new link</Link></div>
  return (
    <div className="container-x max-w-md py-20">
      <SEO title="Reset password" noindex />
      <h1 className="font-display text-5xl font-semibold text-plum-800">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4"><input type="password" required minLength={8} className="input" placeholder="New password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /><button disabled={busy} className="btn-plum w-full">{busy ? 'Saving…' : 'Update password'}</button></form>
    </div>
  )
}
