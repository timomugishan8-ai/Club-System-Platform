import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { api } from '../lib/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    token: params.get('token') || '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.resetPassword(form)
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-accent">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-wider text-white">DATA SCIENCE · UCU CHAPTER</h1>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-xl font-bold text-white">Set new password</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">Reset token</span>
              <input name="token" value={form.token} onChange={handleChange} required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">New password</span>
              <input type="password" name="password" value={form.password} onChange={handleChange} required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            <Link to="/login" className="text-accent hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}