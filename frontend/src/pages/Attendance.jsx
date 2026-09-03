import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { Check, Clock, X, MinusCircle, Users } from 'lucide-react'

const statusIcons = {
  Present: { icon: Check, color: 'text-positive' },
  Late: { icon: Clock, color: 'text-amber' },
  Absent: { icon: X, color: 'text-danger' },
  Excused: { icon: MinusCircle, color: 'text-text-muted' },
}

export default function Attendance() {
  const { isAdmin, isLeader } = useAuth()
  const canViewAll = isAdmin || isLeader
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [allRecords, setAllRecords] = useState(null)
  const [allStats, setAllStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calls = [
      api.attendance.mine().catch(() => null),
      api.attendance.myStats().catch(() => null),
      canViewAll ? api.attendance.all().catch(() => null) : Promise.resolve(null),
    ]
    Promise.all(calls).then(([a, s, all]) => {
      setRecords(a?.attendance || [])
      setStats(s?.stats || null)
      setAllRecords(all?.attendance || null)
      if (all?.attendance) {
        // Aggregate per-status counts across everyone's records
        const agg = { present: 0, late: 0, absent: 0, excused: 0 }
        for (const r of all.attendance) {
          const k = r.status?.toLowerCase()
          if (agg[k] !== undefined) agg[k]++
        }
        setAllStats(agg)
      }
      setLoading(false)
    })
  }, [canViewAll])

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">
        {canViewAll ? 'Attendance Records' : 'My Attendance'}
      </h1>

      {/* All-members records (Admin/Leader) */}
      {canViewAll && allRecords && (
        <>
          {allStats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['Present', 'Late', 'Absent', 'Excused'].map((s) => {
                const Icon = statusIcons[s].icon
                return (
                  <div key={s} className="card p-4 text-center">
                    <Icon className={`mx-auto mb-2 h-5 w-5 ${statusIcons[s].color}`} />
                    <div className="text-2xl font-bold text-text">{allStats[s.toLowerCase()] || 0}</div>
                    <div className="text-xs text-text-muted">{s} (all members)</div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-card-2 px-4 py-3 text-xs text-text-muted">
              <Users className="h-4 w-4" /> All members · newest meetings first
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card-2 text-left text-xs text-text-muted">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Meeting</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {allRecords.map((r) => {
                  const Icon = statusIcons[r.status]?.icon || MinusCircle
                  return (
                    <tr key={r.attendance_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link to={`/profile/${r.member_id}`} className="font-medium text-accent hover:underline">
                          {r.first_name} {r.last_name}
                        </Link>
                      </td>
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
                {allRecords.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No attendance records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* My records */}
      <div>
        {canViewAll && <h2 className="mb-3 text-sm font-semibold text-text-soft">My Attendance</h2>}
        {stats && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                const Icon = statusIcons[r.status]?.icon || MinusCircle
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
    </div>
  )
}