import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { api } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.auth.forgotPassword({ email })
      setMessage('If that email exists, a reset link has been sent.')
    } catch {
      setMessage('If that email exists, a reset link has been sent.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-accent">
            <BarChart3 className="h-6 w-6 text-text" />
          </div>
          <h1 className="text-lg font-bold tracking-wider text-text">DATA SCIENCE · UCU CHAPTER</h1>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-xl font-bold text-text">Reset password</h2>
          <p className="mb-6 text-sm text-text-muted">Enter your email to receive a reset link.</p>

          {message && (
            <div className="mb-4 rounded-lg border border-positive/30 bg-positive-soft px-4 py-3 text-sm text-positive">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? 'Sending…' : 'Send reset link'}
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