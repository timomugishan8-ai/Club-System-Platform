import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { MapPin, Clock, Plus, Trash2, X } from 'lucide-react'

const typeColors = {
  Workshop: 'var(--color-accent-3)',
  Hackathon: 'var(--color-accent)',
  Social: '#22C55E',
  Talk: '#FFC53A',
  Other: '#8A88A6',
}

export default function Events() {
  const { isAdmin, isLeader } = useAuth()
  const canManage = isAdmin || isLeader
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'Workshop',
    venue: '', event_date: '', start_time: '', end_time: '',
  })

  const load = () => {
    api.events.list().then((d) => setEvents(d.events || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.events.create(form)
      setForm({
        title: '', description: '', event_type: 'Workshop',
        venue: '', event_date: '', start_time: '', end_time: '',
      })
      setShowForm(false)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await api.events.remove(deleting.event_id)
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
        <h1 className="text-xl font-bold text-text">Events</h1>
        {canManage && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => {
          const c = typeColors[ev.event_type] || typeColors.Other
          const d = new Date(ev.event_date)
          return (
            <div key={ev.event_id} className="card p-5">
              <div className="flex gap-3">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl text-white" style={{ background: c }}>
                  <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                  <span className="text-[10px] uppercase">{d.toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text">{ev.title}</h3>
                  <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px]" style={{ background: c + '20', color: c }}>
                    {ev.event_type}
                  </span>
                </div>
                {canManage && (
                  <button onClick={() => setDeleting(ev)}
                    className="self-start rounded-md p-1.5 text-text-muted hover:bg-card-2 hover:text-red-400"
                    title="Delete event">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {ev.description && (
                <p className="mt-3 text-sm text-text-muted line-clamp-2">{ev.description}</p>
              )}
              <div className="mt-3 space-y-1.5 text-xs text-text-muted">
                {ev.start_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {ev.start_time?.slice(0,5)}{ev.end_time ? ` – ${ev.end_time.slice(0,5)}` : ''}
                  </div>
                )}
                {ev.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {ev.venue}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {events.length === 0 && (
          <p className="col-span-full py-10 text-center text-text-muted">No events yet.</p>
        )}
      </div>

      {showForm && (
        <Modal title="New Event" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
                <option>Workshop</option>
                <option>Hackathon</option>
                <option>Social</option>
                <option>Talk</option>
                <option>Other</option>
              </select>
              <input required type="date" value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
              <input type="time" value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
              <input type="time" value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            </div>
            <input placeholder="Venue" value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <button type="submit"
              className="w-full rounded-lg bg-gradient-accent py-2 text-sm font-semibold text-white">
              Create Event
            </button>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Event" onClose={() => setDeleting(null)}>
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