import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { Megaphone, Plus, X, Pin } from 'lucide-react'

const catColors = {
  General: '#6C6AE8',
  Event: '#22C55E',
  Achievement: '#FFC53A',
  Urgent: '#D7014D',
}

export default function Announcements() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', category: 'General', is_pinned: false })

  const load = () => {
    api.announcements.list().then((d) => setItems(d.announcements || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.announcements.create(form)
    setForm({ title: '', body: '', category: 'General', is_pinned: false })
    setShowForm(false)
    load()
  }

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Announcements</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Post Announcement
          </button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((a) => {
          const c = catColors[a.category] || catColors.General
          return (
            <div key={a.announcement_id} className="card p-5">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: c + '20' }}>
                  <Megaphone className="h-4 w-4" style={{ color: c }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{a.title}</h3>
                    {a.is_pinned && <Pin className="h-3.5 w-3.5 text-accent-3" />}
                    <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: c + '20', color: c }}>
                      {a.category}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-text-muted">{a.body}</p>
                  <div className="mt-2 text-xs text-text-muted">
                    {a.created_by_name} Â· {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="py-10 text-center text-text-muted">No announcements.</p>
        )}
      </div>

      {showForm && (
        <Modal title="New Announcement" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <textarea required placeholder="Body" value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <select value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
              <option>General</option>
              <option>Event</option>
              <option>Achievement</option>
              <option>Urgent</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-text-soft">
              <input type="checkbox" checked={form.is_pinned}
                onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} />
              Pin to top
            </label>
            <button type="submit"
              className="w-full rounded-lg bg-gradient-accent py-2 text-sm font-semibold text-white">
              Post
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}