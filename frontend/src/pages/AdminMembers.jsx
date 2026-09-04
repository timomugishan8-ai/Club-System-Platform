import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import {
  Users, TrendingUp, FolderGit2, CalendarCheck, Trophy,
  GitBranch, Mail, Phone, BookOpen, ExternalLink, UserX,
} from 'lucide-react'

const TIERS = [
  { name: 'Diamond',     color: '#06B6D4' },
  { name: 'Gold',        color: '#FFC53A' },
  { name: 'Silver',      color: '#9CA3AF' },
  { name: 'Bronze',      color: '#92400E' },
  { name: 'Rising Star', color: '#14B8A6' },
  { name: 'Rookie',      color: '#6B7280' },
]

const TABS = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'progress', label: 'Progress', icon: TrendingUp },
  { key: 'projects', label: 'GitHub Projects', icon: FolderGit2 },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
]

export default function AdminMembers() {
  const [members, setMembers] = useState([])
  const [committees, setCommittees] = useState([])
  const [tab, setTab] = useState('members')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.all([
      api.admin.membersOverview(),
      api.leaderboard.all().catch(() => null),
      api.committees.list().catch(() => null),
    ])
      .then(([mo, lb, cm]) => {
        const withTiers = lb?.leaderboard || []
        setMembers((mo.members || []).map((m) => {
          const match = withTiers.find((r) => r.member_id === m.member_id)
          return {
            ...m,
            // Overview provides points/github/attendance/badges; leaderboard
            // only contributes rank + tier.
            tier: match?.tier || 'Rookie',
            rank: match?.rank || null,
            progress_score: match?.progress_score ?? Number(m.total_points) + Number(m.github_score || 0),
          }
        }))
        setCommittees(cm?.committees || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (memberId, role) => {
    setNotice(''); setError('')
    try {
      const d = await api.admin.setRole(memberId, role)
      setMembers((prev) => prev.map((m) => (m.member_id === memberId ? { ...m, role_name: role } : m)))
      setNotice(d.message || `Role updated to ${role}.`)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleCommitteeChange = async (memberId, committeeId) => {
    setNotice(''); setError('')
    const label = committeeId ? committees.find((c) => c.committee_id === Number(committeeId))?.committee_name : 'Unassigned'
    try {
      const d = await api.admin.setCommittee(memberId, committeeId ? Number(committeeId) : null)
      const name = committees.find((c) => c.committee_id === Number(committeeId))?.committee_name || null
      setMembers((prev) => prev.map((m) => (m.member_id === memberId ? { ...m, committee: name } : m)))
      setNotice(d.message || `Committee updated to ${label}.`)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (m) => {
    const name = `${m.first_name} ${m.last_name}`
    if (!confirm(
      `Remove ${name} from the chapter?\n\n` +
      'This permanently deletes their profile, attendance, participation, points, badges, articles and projects.\n' +
      'Meetings/events/announcements they created will be kept under your name. This cannot be undone.'
    )) return
    setNotice(''); setError('')
    try {
      const d = await api.admin.removeMember(m.member_id)
      setMembers((prev) => prev.filter((x) => x.member_id !== m.member_id))
      setNotice(d.message || `${name} has been removed.`)
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <Spinner className="py-20" />
  if (error) return <p className="py-10 text-center text-danger">{error}</p>

  const filtered = members.filter((m) =>
    `${m.first_name} ${m.last_name} ${m.email} ${m.github_handle || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const ranked = [...filtered].sort((a, b) => (a.rank || 9999) - (b.rank || 9999))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-text">
          <Users className="h-5 w-5" /> Chapter Members
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-64 rounded-full border border-border bg-card py-2 pl-4 pr-4 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {notice && <div className="rounded-lg border border-positive/30 bg-positive-soft px-4 py-2 text-sm text-positive">{notice}</div>}
      {error && <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger">{error}</div>}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-gradient-accent text-white' : 'border border-border text-text-muted hover:text-text'
              }`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'members' && (
        <MembersTab
          members={filtered}
          committees={committees}
          onRoleChange={handleRoleChange}
          onCommitteeChange={handleCommitteeChange}
          onDelete={handleDelete}
        />
      )}
      {tab === 'progress' && <ProgressTab members={filtered} />}
      {tab === 'projects' && <ProjectsTab members={filtered} />}
      {tab === 'attendance' && <AttendanceTab members={filtered} />}
      {tab === 'leaderboard' && <LeaderboardTab members={ranked} />}
    </div>
  )
}

/* ---------- Members (profiles) ---------- */
function MembersTab({ members, committees, onRoleChange, onCommitteeChange, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <div key={m.member_id} className="card p-5">
          <Link to={`/profile/${m.member_id}`} className="block transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card-2 text-base font-bold text-accent">
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                  : `${m.first_name?.[0]}${m.last_name?.[0]}`}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-text">{m.first_name} {m.last_name}</div>
                <div className="text-xs text-text-muted">{m.role_name} · {m.committee}</div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-text-muted"><Mail className="h-3.5 w-3.5" /> <span className="truncate">{m.email}</span></div>
              <div className="flex items-center gap-2 text-text-muted"><Phone className="h-3.5 w-3.5" /> {m.phone || '—'}</div>
              <div className="flex items-center gap-2 text-text-muted"><BookOpen className="h-3.5 w-3.5" /> {m.course || '—'} {m.year_of_study ? `· Year ${m.year_of_study}` : ''}</div>
              <div className="flex items-center gap-2 text-text-muted"><GitBranch className="h-3.5 w-3.5" /> {m.github_handle || 'Not linked'}</div>
            </div>
          </Link>
          {/* Role management (Admin only) — promote Member <-> Leader */}
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <span className="text-xs text-text-muted">Role:</span>
            <select
              value={m.role_name === 'Leader' ? 'Leader' : 'Member'}
              onChange={(e) => onRoleChange(m.member_id, e.target.value)}
              disabled={m.role_name === 'Admin'}
              title={m.role_name === 'Admin' ? 'Admin role cannot be changed' : 'Promote or demote this member'}
              className="flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none disabled:opacity-50"
            >
              {m.role_name === 'Admin' && <option>Admin</option>}
              <option>Member</option>
              <option>Leader</option>
            </select>
            <button
              onClick={() => onDelete(m)}
              title="Permanently remove this member"
              className="rounded-lg border border-danger/40 p-1.5 text-danger transition-colors hover:bg-danger-soft"
            >
              <UserX className="h-4 w-4" />
            </button>
          </div>
          {/* Committee assignment (Admin only) */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-text-muted">Committee:</span>
            <select
              value={m.committee_id ?? ''}
              onChange={(e) => onCommitteeChange(m.member_id, e.target.value)}
              disabled={m.role_name === 'Admin' || committees.length === 0}
              title={m.role_name === 'Admin' ? 'The admin account is neutral — no committee' : 'Assign this member to a committee'}
              className="flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none disabled:opacity-50"
            >
              <option value="">Unassigned</option>
              {committees.map((c) => (
                <option key={c.committee_id} value={c.committee_id}>{c.committee_name}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      {members.length === 0 && <p className="col-span-full py-10 text-center text-text-muted">No members found.</p>}
    </div>
  )
}

/* ---------- Progress (per-member) ---------- */
function ProgressTab({ members }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-card-2 text-left text-xs text-text-muted">
          <tr>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3 text-right">Points</th>
            <th className="px-4 py-3 text-right">GitHub Score</th>
            <th className="px-4 py-3 text-right">Attendance</th>
            <th className="px-4 py-3 text-right">Badges</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.member_id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-medium text-text">{m.first_name} {m.last_name}</td>
              <td className="px-4 py-3"><TierBadge tier={m.tier} /></td>
              <td className="px-4 py-3 text-right font-semibold text-text">{Number(m.total_points).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-text-soft">{m.github_score}</td>
              <td className="px-4 py-3 text-right text-text-soft">{m.attendance_rate != null ? `${m.attendance_rate}%` : '—'}</td>
              <td className="px-4 py-3 text-right text-text-soft">{m.badges_earned}</td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No members.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- GitHub Projects per member ---------- */
function ProjectsTab({ members }) {
  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.member_id} className="card flex flex-wrap items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card-2 text-sm font-bold text-accent">
            {m.first_name?.[0]}{m.last_name?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-text">{m.first_name} {m.last_name}</div>
            <div className="text-xs text-text-muted">
              {m.github_handle ? (
                <a href={`https://github.com/${m.github_handle}`} target="_blank" rel="noreferrer"
                  title={`Open github.com/${m.github_handle}`}
                  className="inline-flex items-center gap-1 text-accent hover:underline">
                  @{m.github_handle} <ExternalLink className="h-3 w-3" />
                </a>
              ) : 'No GitHub linked'}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center sm:grid-cols-5">
            <Mini label="Commits" value={m.commit_count} />
            <Mini label="PRs" value={m.pr_count} />
            <Mini label="Issues" value={m.issue_count} />
            <Mini label="Repos" value={m.repo_count} />
            <Mini label="Stars" value={m.star_count} />
          </div>
        </div>
      ))}
      {members.length === 0 && <p className="py-10 text-center text-text-muted">No members.</p>}
    </div>
  )
}

/* ---------- Attendance per member ---------- */
function AttendanceTab({ members }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-card-2 text-left text-xs text-text-muted">
          <tr>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3 text-right">Meetings Attended</th>
            <th className="px-4 py-3 text-right">Present</th>
            <th className="px-4 py-3 text-right">Rate</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const rate = m.attendance_rate
            const present = m.present_count ?? 0
            const total = m.meetings_attended ?? 0
            return (
              <tr key={m.member_id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-text">{m.first_name} {m.last_name}</td>
                <td className="px-4 py-3 text-right text-text-soft">{present}/{total}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${rate == null ? 'text-text-muted' : rate >= 75 ? 'text-positive' : rate >= 50 ? 'text-amber' : 'text-danger'}`}>
                    {rate != null ? `${rate}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-card-2">
                    <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${rate || 0}%` }} />
                  </div>
                </td>
              </tr>
            )
          })}
          {members.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No members.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Leaderboard ---------- */
function LeaderboardTab({ members }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-card-2 text-left text-xs text-text-muted">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3 text-right">Points</th>
            <th className="px-4 py-3 text-right">GitHub</th>
            <th className="px-4 py-3 text-right">Attendance</th>
            <th className="px-4 py-3 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.member_id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-bold text-text">#{m.rank ?? '—'}</td>
              <td className="px-4 py-3 font-medium text-text">{m.first_name} {m.last_name}</td>
              <td className="px-4 py-3"><TierBadge tier={m.tier} /></td>
              <td className="px-4 py-3 text-right">{Number(m.total_points).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-text-soft">{m.github_score}</td>
              <td className="px-4 py-3 text-right text-text-soft">{m.attendance_rate != null ? `${m.attendance_rate}%` : '—'}</td>
              <td className="px-4 py-3 text-right font-semibold text-accent">{m.progress_score}</td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No members.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TierBadge({ tier }) {
  const t = TIERS.find((x) => x.name === tier) || TIERS[5]
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }}>
      {t.name}
    </span>
  )
}

function Mini({ label, value }) {
  return (
    <div className="rounded-lg bg-card-2 px-3 py-2 text-center">
      <div className="text-base font-bold text-text">{value ?? 0}</div>
      <div className="text-[10px] text-text-muted">{label}</div>
    </div>
  )
}