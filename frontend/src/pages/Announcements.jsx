import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { Megaphone, Plus, X, Pin, Pencil, Trash2 } from 'lucide-react'

const catColors = {
  General: 'var(--color-accent-3)',
  Event: '#22C55E',
  Achievement: '#FFC53A',
  Urgent: '#D7014D',
}

export default function Announcements() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const emptyForm = { title: '', body: '', category: 'General', is_pinned: false }
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    api.announcements.list().then((d) => setItems(d.announcements || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title, body: a.body, category: a.category || 'General', is_pinned: !!a.is_pinned })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.announcements.update(editing.announcement_id, form)
      } else {
        await api.announcements.create(form)
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.announcements.remove(deleting.announcement_id)
      setDeleting(null)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Announcements</h1>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }}
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
                    <h3 className="font-semibold text-text">{a.title}</h3>
                    {a.is_pinned && <Pin className="h-3.5 w-3.5 text-accent-3" />}
                    <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: c + '20', color: c }}>
                      {a.category}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-text-muted">{a.body}</p>
                  <div className="mt-2 text-xs text-text-muted">
                    {a.created_by_name} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex flex-shrink-0 self-start gap-1">
                    <button onClick={() => openEdit(a)}
                      className="rounded-md p-1.5 text-text-muted hover:bg-card-2 hover:text-accent-3"
                      title="Edit announcement">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleting(a)}
                      className="rounded-md p-1.5 text-text-muted hover:bg-card-2 hover:text-red-400"
                      title="Delete announcement">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="py-10 text-center text-text-muted">No announcements.</p>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? 'Edit Announcement' : 'New Announcement'} onClose={() => { setShowForm(false); setEditing(null) }}>
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
              {editing ? 'Save Changes' : 'Post'}
            </button>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Announcement" onClose={() => setDeleting(null)}>
          <p className="text-sm text-text-muted">
            Delete <span className="font-semibold text-text">“{deleting.title}”</span>? This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setDeleting(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-soft hover:bg-card">
              Cancel
            </button>
            <button onClick={confirmDelete}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
              Delete
            </button>
          </div>
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
          <h2 className="font-bold text-text">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}