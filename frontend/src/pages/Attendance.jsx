import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { Check, Clock, X, MinusCircle } from 'lucide-react'

const statusIcons = {
  Present: { icon: Check, color: 'text-positive' },
  Late: { icon: Clock, color: 'text-amber' },
  Absent: { icon: X, color: 'text-danger' },
  Excused: { icon: MinusCircle, color: 'text-text-muted' },
}

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.attendance.mine().catch(() => null),
      api.attendance.myStats().catch(() => null),
    ]).then(([a, s]) => {
      setRecords(a?.attendance || [])
      setStats(s?.stats || null)
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">My Attendance</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['Present', 'Late', 'Absent', 'Excused'].map((s) => {
            const Icon = statusIcons[s].icon
            return (
              <div key={s} className="card p-4 text-center">
                <Icon className={`mx-auto mb-2 h-5 w-5 ${statusIcons[s].color}`} />
                <div className="text-2xl font-bold text-text">{stats[s.toLowerCase()] || 0}</div>
                <div className="text-xs text-text-muted">{s}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Records */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-card-2 text-left text-xs text-text-muted">
            <tr>
              <th className="px-4 py-3">Meeting</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const Icon = statusIcons[r.status]?.icon || CalendarCheck
              return (
                <tr key={r.attendance_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text">{r.title}</td>
                  <td className="px-4 py-3 text-text-muted">{r.meeting_date}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 ${statusIcons[r.status]?.color || 'text-text-muted'}`}>
                      <Icon className="h-4 w-4" /> {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{r.check_in_time || '—'}</td>
                </tr>
              )
            })}
            {records.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No attendance records.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}