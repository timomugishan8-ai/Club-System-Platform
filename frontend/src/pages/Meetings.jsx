import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import {
  Calendar, Plus, X, ChevronLeft, Check, Clock, XCircle,
  MinusCircle, Save, Trash2, Pencil,
} from 'lucide-react'

const STATUSES = ['Present', 'Late', 'Absent', 'Excused']
const statusStyles = {
  Present: { active: 'bg-positive text-white', idle: 'text-positive', icon: Check },
  Late: { active: 'bg-amber text-white', idle: 'text-amber', icon: Clock },
  Absent: { active: 'bg-danger text-white', idle: 'text-danger', icon: XCircle },
  Excused: { active: 'bg-text-muted text-white', idle: 'text-text-muted', icon: MinusCircle },
}

export default function Meetings() {
  const { isAdmin, isLeader } = useAuth()
  const canManage = isAdmin || isLeader
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editMeeting, setEditMeeting] = useState(null)
  const [form, setForm] = useState({
    title: '', topic: '', description: '', venue: '',
    meeting_date: '', start_time: '', end_time: '',
  })

  const load = () => {
    api.meetings.list().then((d) => setMeetings(d.meetings || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditMeeting(null)
    setForm({ title: '', topic: '', description: '', venue: '', meeting_date: '', start_time: '', end_time: '' })
    setShowForm(true)
  }

  const openEdit = (m) => {
    setEditMeeting(m)
    setForm({
      title: m.title || '', topic: m.topic || '', description: m.description || '',
      venue: m.venue || '', meeting_date: m.meeting_date || '',
      start_time: m.start_time?.slice(0, 5) || '', end_time: m.end_time?.slice(0, 5) || '',
    })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (editMeeting) {
      await api.meetings.update(editMeeting.meeting_id, form)
    } else {
      await api.meetings.create(form)
    }
    setShowForm(false)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this meeting? Attendance records will also be removed.')) return
    await api.meetings.remove(id)
    load()
  }

  if (loading) return <Spinner className="py-20" />

  if (selectedId) {
    return <AttendanceSheet meetingId={selectedId} onBack={() => setSelectedId(null)} canManage={canManage} />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Meetings</h1>
        {canManage && (
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New Meeting
          </button>
        )}
      </div>

      {meetings.length === 0 ? (
        <div className="card p-10 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-muted">No meetings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => {
            const d = new Date(m.meeting_date)
            return (
              <div key={m.meeting_id} className="card flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-accent-2/20 text-accent-2">
                  <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                  <span className="text-[10px] uppercase">{d.toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">{m.title}</h3>
                  {m.topic && <p className="truncate text-sm text-text-muted">{m.topic}</p>}
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                    {m.venue && <span>{m.venue}</span>}
                    {m.start_time && <span>{m.start_time?.slice(0, 5)}{m.end_time ? `–${m.end_time.slice(0, 5)}` : ''}</span>}
                    <span>by {m.created_by_name || 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSelectedId(m.meeting_id)}
                    className="rounded-lg bg-card-2 px-3 py-1.5 text-xs text-text-soft hover:bg-border">
                    Take Attendance
                  </button>
                  {canManage && (
                    <>
                      <button onClick={() => openEdit(m)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-card-2 hover:text-text-soft">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(m.meeting_id)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-danger/20 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editMeeting ? 'Edit Meeting' : 'New Meeting'} onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <input placeholder="Topic" value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <input placeholder="Venue" value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-text-muted">Date</span>
                <input type="date" required value={form.meeting_date}
                  onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-text-muted">Start</span>
                <input type="time" value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-text-muted">End</span>
                <input type="time" value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
              </label>
            </div>
            <button type="submit"
              className="w-full rounded-lg bg-gradient-accent py-2 text-sm font-semibold text-white">
              {editMeeting ? 'Update' : 'Create'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function AttendanceSheet({ meetingId, onBack, canManage }) {
  const [meeting, setMeeting] = useState(null)
  const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([
      api.meetings.get(meetingId),
      api.members.list(),
      api.attendance.byMeeting(meetingId),
    ]).then(([m, mem, att]) => {
      setMeeting(m.meeting)
      setMembers(mem.members || [])
      const map = {}
      for (const a of (att.attendance || [])) {
        map[a.member_id] = a.status
      }
      setAttendance(map)
      setLoading(false)
    })
  }, [meetingId])

  const setStatus = (memberId, status) => {
    setAttendance((prev) => ({ ...prev, [memberId]: status }))
  }

  const markAll = (status) => {
    const next = {}
    members.forEach((m) => { next[m.member_id] = status })
    setAttendance(next)
  }

  const save = async () => {
    setSaving(true); setMsg('')
    const records = members.map((m) => ({
      member_id: m.member_id,
      status: attendance[m.member_id] || 'Absent',
    }))
    try {
      await api.attendance.bulkRecord(meetingId, records)
      setMsg(`Attendance saved for ${records.length} members.`)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner className="py-20" />
  if (!meeting) return <p className="py-10 text-center text-text-muted">Meeting not found.</p>

  const present = Object.values(attendance).filter((s) => s === 'Present').length
  const late = Object.values(attendance).filter((s) => s === 'Late').length
  const absent = Object.values(attendance).filter((s) => s === 'Absent').length
  const excused = Object.values(attendance).filter((s) => s === 'Excused').length

  return (
    <div className="space-y-5">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-soft">
        <ChevronLeft className="h-4 w-4" /> Back to meetings
      </button>

      {/* Meeting header */}
      <div className="card p-5">
        <h1 className="text-xl font-bold text-white">{meeting.title}</h1>
        {meeting.topic && <p className="mt-0.5 text-sm text-text-muted">{meeting.topic}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {meeting.meeting_date}</span>
          {meeting.venue && <span>{meeting.venue}</span>}
          {meeting.start_time && <span>{meeting.start_time?.slice(0,5)}{meeting.end_time ? `–${meeting.end_time.slice(0,5)}` : ''}</span>}
        </div>
      </div>

      {/* Summary + quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <StatPill label="Present" value={present} color="text-positive" />
          <StatPill label="Late" value={late} color="text-amber" />
          <StatPill label="Absent" value={absent} color="text-danger" />
          <StatPill label="Excused" value={excused} color="text-text-muted" />
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Mark all:</span>
            {STATUSES.map((s) => {
              const Icon = statusStyles[s].icon
              return (
                <button key={s} onClick={() => markAll(s)}
                  className={`flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs ${statusStyles[s].idle} hover:bg-card-2`}>
                  <Icon className="h-3 w-3" /> {s}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {msg && (
        <div className="rounded-lg border border-positive/30 bg-positive-soft px-4 py-2 text-sm text-positive">
          {msg}
        </div>
      )}

      {/* Member list */}
      <div className="card overflow-hidden">
        <div className="border-b border-border bg-card-2 px-4 py-2.5 text-xs font-semibold text-text-muted">
          {members.length} members
        </div>
        <div className="divide-y divide-border">
          {members.map((m) => {
            const current = attendance[m.member_id] || 'Absent'
            return (
              <div key={m.member_id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-xs font-semibold text-accent">
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">
                    {m.first_name} {m.last_name}
                  </div>
                  <div className="truncate text-xs text-text-muted">
                    {m.student_number || m.email}
                  </div>
                </div>
                {canManage ? (
                  <div className="flex gap-1">
                    {STATUSES.map((s) => {
                      const Icon = statusStyles[s].icon
                      const isActive = current === s
                      return (
                        <button key={s} onClick={() => setStatus(m.member_id, s)} title={s}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            isActive
                              ? `${statusStyles[s].active} border-transparent`
                              : 'border-border text-text-muted hover:bg-card-2'
                          }`}>
                          <Icon className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[current]?.idle || 'text-text-muted'}`}>
                    {current}
                  </span>
                )}
              </div>
            )
          })}
          {members.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-text-muted">No members to track.</p>
          )}
        </div>
      </div>

      {canManage && (
        <button onClick={save} disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Attendance'}
        </button>
      )}
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-card-2 px-3 py-1.5 text-sm">
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
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