import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import {
  Users, UserCheck, UserX, Calendar, BookOpen, FolderGit2,
  Megaphone, Database, Trophy, GitBranch, Award,
} from 'lucide-react'

export default function Analytics() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    api.analytics.get().then((d) => setData(d.analytics || {})).finally(() => setLoading(false))
  }, [isAdmin])

  if (!isAdmin) return <p className="py-10 text-center text-text-muted">Admin access required.</p>
  if (loading) return <Spinner className="py-20" />
  if (!data) return <p className="py-10 text-center text-text-muted">No data.</p>

  const ov = data.overview || {}

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">Chapter Analytics</h1>
        <p className="text-sm text-text-muted">Overview of chapter engagement and growth.</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={UserCheck} label="Active" value={ov.active_members} color="bg-positive" />
        <StatCard icon={Users} label="Pending" value={ov.pending_members} color="bg-amber" />
        <StatCard icon={UserX} label="Rejected" value={ov.rejected_members} color="bg-danger" />
        <StatCard icon={Calendar} label="Meetings" value={ov.total_meetings} color="bg-accent-2" />
        <StatCard icon={BookOpen} label="Events" value={ov.total_events} color="bg-accent-3" />
        <StatCard icon={FolderGit2} label="Projects" value={ov.total_projects} color="bg-accent-2" />
        <StatCard icon={Megaphone} label="Announcements" value={ov.total_announcements} color="bg-accent-3" />
        <StatCard icon={Database} label="Resources" value={ov.total_resources} color="bg-positive" />
        <StatCard icon={Trophy} label="Total Points" value={ov.total_points} color="bg-amber" />
        <StatCard icon={GitBranch} label="GH Contribs" value={ov.total_github_contributions} color="bg-accent-2" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Member growth line chart */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Member Growth (12 months)</h3>
          <LineChart
            data={data.member_growth || []}
            xKey="month"
            yKey="count"
            color="var(--color-accent-3)"
          />
        </div>

        {/* Tier distribution donut */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Tier Distribution</h3>
          <div className="flex items-center gap-6">
            <DonutChart
              data={[
                { label: 'Gold', value: data.tier_distribution?.Gold || 0, color: '#FFC53A' },
                { label: 'Silver', value: data.tier_distribution?.Silver || 0, color: '#8A88A6' },
                { label: 'Bronze', value: data.tier_distribution?.Bronze || 0, color: '#B45309' },
              ]}
            />
            <div className="space-y-2">
              {[
                { label: 'Gold', value: data.tier_distribution?.Gold || 0, color: '#FFC53A' },
                { label: 'Silver', value: data.tier_distribution?.Silver || 0, color: '#8A88A6' },
                { label: 'Bronze', value: data.tier_distribution?.Bronze || 0, color: '#B45309' },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-text-soft">{d.label}</span>
                  <span className="font-semibold text-text">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance trend bar chart */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Attendance Trend (last 12 meetings)</h3>
          <StackedBarChart
            data={data.attendance_trend || []}
            bars={[
              { key: 'present', color: '#22C55E', label: 'Present' },
              { key: 'late', color: '#FFC53A', label: 'Late' },
              { key: 'absent', color: '#D7014D', label: 'Absent' },
              { key: 'excused', color: '#8A88A6', label: 'Excused' },
            ]}
            xKey="meeting_date"
          />
        </div>

        {/* Activity distribution horizontal bars */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Top Activities by Points</h3>
          <HBarChart
            data={data.activity_distribution || []}
            valueKey="total_points"
            labelKey="activity"
          />
        </div>

        {/* Committee distribution donut */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Members by Committee</h3>
          <HBarChart
            data={data.committee_distribution || []}
            valueKey="count"
            labelKey="committee"
          />
        </div>

        {/* Project status */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Projects by Status</h3>
          <div className="flex flex-wrap gap-3">
            {(data.project_status || []).map((p) => {
              const colors = { Planning: 'var(--color-accent)', 'In Progress': 'var(--color-accent-3)', Completed: '#22C55E', Archived: '#8A88A6' }
              const c = colors[p.status] || '#8A88A6'
              return (
                <div key={p.status} className="rounded-xl border border-border bg-card-2 px-4 py-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: c }}>{p.count}</div>
                  <div className="text-xs text-text-muted">{p.status}</div>
                </div>
              )
            })}
            {(!data.project_status || data.project_status.length === 0) && (
              <p className="text-sm text-text-muted">No projects.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top contributors */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-soft">
          <Award className="h-4 w-4" /> Top Contributors
        </h3>
        <div className="space-y-2">
          {(data.top_contributors || []).map((c, i) => (
            <div key={c.member_id} className="flex items-center gap-3 rounded-lg bg-card-2 p-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i === 0 ? 'bg-amber text-white' : i === 1 ? 'bg-text-soft text-bg' : i === 2 ? 'bg-amber/60 text-bg' : 'bg-card text-text-muted'
              }`}>
                {i + 1}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-xs font-semibold text-accent">
                {c.first_name?.[0]}{c.last_name?.[0]}
              </div>
              <div className="flex-1 text-sm text-text">
                {c.first_name} {c.last_name}
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-text-soft"><Trophy className="mr-1 inline h-3.5 w-3.5" />{c.points} pts</span>
                <span className="text-text-soft"><GitBranch className="mr-1 inline h-3.5 w-3.5" />{c.github_score}</span>
              </div>
            </div>
          ))}
          {(!data.top_contributors || data.top_contributors.length === 0) && (
            <p className="text-sm text-text-muted">No contributors yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-text" />
      </div>
      <div className="text-xl font-bold text-text">{(value || 0).toLocaleString()}</div>
      <div className="text-[11px] text-text-muted">{label}</div>
    </div>
  )
}

function LineChart({ data, xKey, yKey, color }) {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No data.</p>
  }

  const w = 320, h = 140, pad = 24
  const max = Math.max(...data.map((d) => d[yKey] || 0), 1)
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((d[yKey] || 0) / max) * (h - pad * 2)
    return { x, y, ...d }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${path} L${points[points.length - 1].x},${h - pad} L${points[0].x},${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad} y1={pad + t * (h - pad * 2)} x2={w - pad} y2={pad + t * (h - pad * 2)}
          stroke="var(--color-border)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#lcGrad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} />
          <text x={p.x} y={h - 6} textAnchor="middle" fontSize="8" fill="var(--color-text-muted)">
            {(p[xKey] || '').slice(5)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="py-8 text-center text-sm text-text-muted">No members.</p>

  const r = 50, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  let offset = 0
  const segments = data.map((d) => {
    const pct = d.value / total
    const seg = {
      color: d.color,
      dasharray: `${pct * circ} ${circ}`,
      dashoffset: -offset * circ,
      label: d.label,
      value: d.value,
    }
    offset += pct
    return seg
  })

  return (
    <svg viewBox="0 0 120 120" className="h-[120px] w-[120px]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-card)" strokeWidth="14" />
      {segments.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
          strokeDasharray={s.dasharray} strokeDashoffset={s.dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="18" fontWeight="bold" fill="var(--color-text)">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="var(--color-text-muted)">Members</text>
    </svg>
  )
}

function StackedBarChart({ data, bars, xKey }) {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No data.</p>
  }

  const max = Math.max(...data.map((d) => bars.reduce((s, b) => s + (d[b.key] || 0), 0)), 1)
  const w = 320, h = 140, pad = 24
  const bw = (w - pad * 2) / data.length * 0.7

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={pad} y1={pad + t * (h - pad * 2)} x2={w - pad} y2={pad + t * (h - pad * 2)}
            stroke="var(--color-border)" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const x = pad + (i + 0.5) * ((w - pad * 2) / data.length) - bw / 2
          let yBase = h - pad
          return (
            <g key={i}>
              {bars.map((b) => {
                const val = d[b.key] || 0
                const bh = (val / max) * (h - pad * 2)
                const y = yBase - bh
                yBase = y
                return <rect key={b.key} x={x} y={y} width={bw} height={Math.max(bh, 0)} fill={b.color} rx="2" />
              })}
              <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="7" fill="var(--color-text-muted)">
                {((d[xKey] || '').slice(5))}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {bars.map((b) => (
          <div key={b.key} className="flex items-center gap-1.5 text-xs">
            <div className="h-2.5 w-2.5 rounded" style={{ background: b.color }} />
            <span className="text-text-muted">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HBarChart({ data, valueKey, labelKey }) {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No data.</p>
  }
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1)

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 truncate text-xs text-text-muted">{d[labelKey]}</div>
          <div className="flex-1">
            <div className="h-5 overflow-hidden rounded-full bg-card-2">
              <div
                className="h-full rounded-full bg-gradient-accent"
                style={{ width: `${((d[valueKey] || 0) / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-10 text-right text-xs font-semibold text-text">{d[valueKey] || 0}</div>
        </div>
      ))}
    </div>
  )
}