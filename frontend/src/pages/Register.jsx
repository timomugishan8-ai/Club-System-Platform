import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import chapterLogo from '../assets/chapter-logo.jpg'
import frontCover from '../assets/front-cover.jpg'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    student_number: '', gender: '', phone: '', course: '', year_of_study: '',
    github_handle: '', bio: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.auth.register(form)
      setSuccess('Registration received. An admin must approve your account before you can log in.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center px-4"
        style={{
          backgroundImage: `linear-gradient(rgba(5, 6, 26, 0.78), rgba(5, 6, 26, 0.92)), url(${frontCover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full max-w-md card p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-text">Registration received</h2>
          <p className="mb-6 text-sm text-text-muted">{success}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white"
          >
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 6, 26, 0.78), rgba(5, 6, 26, 0.92)), url(${frontCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src={chapterLogo}
            alt="Data Science Chapter logo"
            className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-black/40 ring-2 ring-white/10"
          />
          <h1 className="text-lg font-bold tracking-wider text-white drop-shadow">DATA SCIENCE · UCU CHAPTER</h1>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-xl font-bold text-text">Create your account</h2>
          <p className="mb-6 text-sm text-text-muted">An admin must approve before you can log in.</p>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">First name</span>
                <input name="first_name" value={form.first_name} onChange={handleChange} required
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">Last name</span>
                <input name="last_name" value={form.last_name} onChange={handleChange} required
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">Password</span>
              <input type="password" name="password" value={form.password} onChange={handleChange} required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">Student number</span>
                <input name="student_number" value={form.student_number} onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">Course</span>
                <input name="course" value={form.course} onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">Gender</span>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none">
                  <option value="">Prefer not to say</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">Year of study</span>
                <input type="number" name="year_of_study" value={form.year_of_study} onChange={handleChange} min="1" max="6"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">Phone</span>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+256..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-text-soft">GitHub profile link <span className="text-text-muted">(optional)</span></span>
                <input name="github_handle" value={form.github_handle} onChange={handleChange}
                  placeholder="https://github.com/username"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm text-text-soft">Short bio <span className="text-text-muted">(optional)</span></span>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                placeholder="A line or two about you — interests, skills, goals…"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none" />
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? 'Submitting…' : 'Register'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}