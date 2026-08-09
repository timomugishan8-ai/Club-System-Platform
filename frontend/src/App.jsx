import { useState } from 'react'
import './App.css'

const API_BASE = '/api/auth'

function App() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role_id: '1' })
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    const payload = tab === 'login'
      ? { email: form.email, password: form.password }
      : { full_name: form.full_name, email: form.email, password: form.password, role_id: form.role_id }

    try {
      const response = await fetch(`${API_BASE}/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed')
      }

      setMessage(data.message || 'Success')
      if (tab === 'login' && data.token) {
        setToken(data.token)
      }
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <main className="app">
      <section className="auth-card">
        <h1>{tab === 'login' ? 'Login' : 'Register'}</h1>

        <div className="tab-buttons">
          <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
            Login
          </button>
          <button type="button" className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'register' && (
            <label>
              Full name
              <input name="full_name" value={form.full_name} onChange={handleChange} required />
            </label>
          )}

          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>

          {tab === 'register' && (
            <label>
              Role ID
              <input name="role_id" value={form.role_id} onChange={handleChange} />
            </label>
          )}

          <button type="submit">Submit</button>
        </form>

        {message && <p className="message">{message}</p>}
        {token && (
          <div className="token-box">
            <strong>JWT token:</strong>
            <code>{token}</code>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
