import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import {
  FileText, Download, Users, CalendarDays, Trophy,
  GitBranch, Calendar, TrendingUp,
} from 'lucide-react'

const semesterPresets = () => {
  const now = new Date()
  const y = now.getFullYear()
  return [
    { label: `${y} Aug – Dec (Sem 1)`, start: `${y}-08-01`, end: `${y}-12-31` },
    { label: `${y} Jan – May (Sem 2)`, start: `${y}-01-01`, end: `${y}-05-31` },
    { label: 'Last 3 months', start: iso(new Date(y, now.getMonth() - 3, 1)), end: iso(now) },
  ]
}

const iso = (d) => d.toISOString().slice(0, 10)

export default function Reports() {
  const preset = semesterPresets()
  const [start, setStart] = useState(preset[2].start)
  const [end, setEnd] = useState(preset[2].end)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const query = `start=${start}&end=${encodeURIComponent(end + ' 23:59:59')}`

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await api.reports.downloadMembersCsv(query)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `semester-report_${start}_to_${end}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    api.reports.semester(query)
      .then((d) => setReport(d.report))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end])

  if (loading && !report) return <Spinner className="py-20" />

  const r = report || {}

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-text">
          <FileText className="h-5 w-5" /> Semester Report
        </h1>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {downloading ? 'Preparing…' : 'Download Members CSV'}
        </button>
      </div>

      {/* Range picker */}
      <div className="card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-text-muted">Semester start</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-text-muted">Semester end</span>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
          </label>
          <div className="flex flex-wrap gap-2">
            {preset.map((p) => (
              <button key={p.label} onClick={() => { setStart(p.start); setEnd(iso(new Date(p.end))) }}
                className="rounded-lg border border-border px-3 py-2 text-xs text-text-muted hover:border-accent hover:text-accent">
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {loading && <p className="mt-3 text-xs text-text-muted">Refreshing…</p>}
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
      </div>

      {/* Membership */}
      <Section icon={Users} title="Membership">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active Members" value={r.membership?.active_members} />
          <Stat label="New This Semester" value={r.membership?.new_members} accent />
          <Stat label="Pending Approvals" value={r.membership?.pending_members} />
          <Stat label="Rejected" value={r.membership?.rejected} />
        </div>
      </Section>

      {/* Meetings & attendance */}
      <Section icon={CalendarDays} title="Meetings & Attendance">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Meetings Held" value={r.meetings?.meetings_held} accent />
          <Stat label="Avg Attendance" value={r.meetings?.avg_attendance_rate != null ? `${r.meetings.avg_attendance_rate}%` : '0%'} />
          <Stat label="Present" value={r.meetings?.present} />
          <Stat label="Late" value={r.meetings?.late} />
          <Stat label="Absent" value={r.meetings?.absent} />
          <Stat label="Excused" value={r.meetings?.excused} />
        </div>
      </Section>

      {/* Engagement */}
      {r.participation && (
        <Section icon={TrendingUp} title="Engagement & Points">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Points Awarded" value={Number(r.participation.total_points || 0).toLocaleString()} accent />
            <Stat label="Participation Records" value={r.participation.participation_records} />
            <Stat label="Active Participants" value={r.participation.active_participants} />
          </div>
          {r.points_by_pillar?.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Points by Pillar</h4>
              {r.points_by_pillar.map((p) => (
                <div key={p.pillar} className="flex items-center justify-between text-sm">
                  <span className="text-text-soft">{p.pillar}</span>
                  <span className="font-semibold text-text">{Number(p.points).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Activities */}
      {r.events?.events_held !== undefined && (
        <Section icon={Calendar} title="Events & Projects">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Events Held" value={r.events.events_held} accent />
            <Stat label="Event Registrations" value={r.events.event_registrations} />
            <Stat label="Projects Created" value={r.projects?.total_projects} />
            <Stat label="Projects Completed" value={r.projects?.completed} />
            <Stat label="Projects In Progress" value={r.projects?.in_progress} />
          </div>
        </Section>
      )}

      {/* GitHub */}
      {r.github && (
        <Section icon={GitBranch} title="GitHub Engagement">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Members Linked" value={r.github.members_with_github} />
            <Stat label="Commits" value={r.github.commits} accent />
            <Stat label="Pull Requests" value={r.github.pull_requests} />
            <Stat label="Issues" value={r.github.issues} />
            <Stat label="Repositories" value={r.github.repos} />
            <Stat label="Stars" value={r.github.stars} />
          </div>
        </Section>
      )}

      {/* Top contributors */}
      {r.top_contributors?.length > 0 && (
        <Section icon={Trophy} title="Top Contributors (Semester Points)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Member</th>
                  <th className="pb-2 pr-4 text-right">Points</th>
                  <th className="pb-2 text-right">Activities</th>
                </tr>
              </thead>
              <tbody>
                {r.top_contributors.map((m, i) => (
                  <tr key={m.member_id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 text-text-muted">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium text-text">{m.first_name} {m.last_name}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-text">{Number(m.points).toLocaleString()}</td>
                    <td className="py-2 text-right text-text-soft">{m.activities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-soft">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg bg-card-2 p-4">
      <div className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text'}`}>
        {value ?? 0}
      </div>
      <div className="mt-1 text-xs text-text-muted">{label}</div>
    </div>
  )
}