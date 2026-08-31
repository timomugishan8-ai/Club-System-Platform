import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import chapterLogo from '../assets/chapter-logo.jpg'
import frontCover from '../assets/front-cover.jpg'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 6, 26, 0.78), rgba(5, 6, 26, 0.92)), url(${frontCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src={chapterLogo}
            alt="Data Science Chapter logo"
            className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-black/40 ring-2 ring-white/10"
          />
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-wider text-white drop-shadow">DATA SCIENCE</h1>
            <p className="text-xs font-semibold tracking-wider text-text-soft drop-shadow">UCU CHAPTER</p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-xl font-bold text-text">Welcome back</h2>
          <p className="mb-6 text-sm text-text-muted">Log in to your chapter account.</p>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-accent hover:underline">
              Forgot password?
            </Link>
            <Link to="/register" className="text-text-muted hover:text-text-soft">
              Need an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}