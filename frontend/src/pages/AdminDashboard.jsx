import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, UserCheck, CalendarCheck, GitBranch, FolderGit2, Trophy,
  Megaphone, Calendar, TrendingUp, Inbox, ShieldCheck, ChevronRight,
  Activity, CalendarDays,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'

const TIERS = [
  { name: 'Diamond',     color: '#06B6D4' },
  { name: 'Gold',        color: '#FFC53A' },
  { name: 'Silver',      color: '#9CA3AF' },
  { name: 'Bronze',      color: '#92400E' },
  { name: 'Rising Star', color: '#14B8A6' },
  { name: 'Rookie',      color: '#6B7280' },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.leaderboard.adminDashboard()
      .then((d) => setData(d.dashboard || {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-20" />

  const chapter = data.chapter || {}
  const att = data.attendance || {}
  const tiers = data.tier_distribution || {}
  const firstName = user?.first_name || 'Admin'

  const totalAtt =
    (att.present || 0) + (att.late || 0) + (att.absent || 0) + (att.excused || 0)
  const attRate = totalAtt > 0 ? Math.round(((att.present || 0) + (att.late || 0)) / totalAtt * 100) : 0

  const heroStats = [
    { label: 'Chapter Members', value: chapter.approved_members ?? 0, sub: 'Active & approved', icon: Users, color: 'bg-accent-3' },
    { label: 'Pending Approvals', value: chapter.pending_members ?? 0, sub: 'Awaiting your review', icon: Inbox, color: 'bg-amber' },
    { label: 'Meetings Held', value: chapter.total_meetings ?? 0, sub: 'All time', icon: CalendarCheck, color: 'bg-accent-2' },
    { label: 'Active Projects', value: chapter.active_projects ?? 0, sub: `${chapter.completed_projects ?? 0} completed`, icon: FolderGit2, color: 'bg-positive' },
  ]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-bg-soft to-bg p-6 lg:p-8">
        <div className="relative z-10">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text lg:text-3xl">
            Admin <span className="text-gradient">Overview</span> <ShieldCheck className="h-6 w-6 text-accent" />
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Chapter oversight — members, engagement, and system health. Welcome, {firstName}.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-25 dark:opacity-10">
          <svg viewBox="0 0 400 200" className="h-full w-full">
            <defs>
              <linearGradient id="admGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-accent-3)" />
                <stop offset="100%" stopColor="var(--color-accent)" />
              </linearGradient>
            </defs>
            <polyline points="0,150 50,120 100,140 150,90 200,110 250,60 300,80 350,40 400,50"
              fill="none" stroke="url(#admGrad)" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Chapter health cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Members with GitHub', value: chapter.members_with_github ?? 0, icon: GitBranch, color: 'bg-accent-3', to: '/admin/members' },
          { label: 'Upcoming Events', value: chapter.upcoming_events_count ?? 0, icon: Calendar, color: 'bg-accent-2', to: '/events' },
          { label: 'Points Awarded', value: Number(chapter.total_points_awarded ?? 0).toLocaleString(), icon: Trophy, color: 'bg-amber', to: '/leaderboard' },
          { label: 'Members Synced (GH)', value: data.github_synced ?? 0, icon: TrendingUp, color: 'bg-positive', to: '/admin/members' },
        ].map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.label} to={c.to} className="card p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-soft">{c.label}</h3>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                  <Icon className="h-5 w-5 text-text" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-bold text-text">{c.value}</div>
              <div className="mt-2 flex items-center justify-end border-t border-border pt-3">
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pending approvals */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <Inbox className="h-4 w-4" /> Pending Approvals
            </h3>
            <Link to="/admin/pending" className="text-xs text-accent hover:underline">Review All</Link>
          </div>
          <div className="space-y-2">
            {(data.pending_approvals || []).map((m) => (
              <div key={m.member_id} className="flex items-center gap-3 rounded-lg bg-card-2 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold text-accent">
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text">{m.first_name} {m.last_name}</div>
                  <div className="truncate text-xs text-text-muted">{m.email}</div>
                </div>
                <UserCheck className="h-4 w-4 shrink-0 text-amber" />
              </div>
            ))}
            {(data.pending_approvals || []).length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No pending approvals.</p>
            )}
          </div>
        </div>

        {/* Attendance overview */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <CalendarCheck className="h-4 w-4" /> Attendance Overview
            </h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">
              {attRate}% present+late
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Present', value: att.present || 0, cls: 'text-positive' },
              { label: 'Late', value: att.late || 0, cls: 'text-amber' },
              { label: 'Absent', value: att.absent || 0, cls: 'text-danger' },
              { label: 'Excused', value: att.excused || 0, cls: 'text-text-muted' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-card-2 p-3.5 text-center">
                <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
                <div className="mt-1 text-[11px] text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>
          <Link to="/attendance"
            className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm text-text-soft hover:bg-card-2">
            View Attendance Records <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tier distribution */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <Trophy className="h-4 w-4" /> Tier Distribution
            </h3>
            <Link to="/leaderboard" className="text-xs text-accent hover:underline">Leaderboard</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Diamond', value: tiers.Diamond || 0, color: '#06B6D4' },
              { label: 'Gold', value: tiers.Gold || 0, color: '#FFC53A' },
              { label: 'Silver', value: tiers.Silver || 0, color: '#9CA3AF' },
              { label: 'Bronze', value: tiers.Bronze || 0, color: '#B45309' },
              { label: 'Rising Star', value: tiers['Rising Star'] || 0, color: '#14B8A6' },
              { label: 'Rookie', value: tiers.Rookie || 0, color: '#6B7280' },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
                <span className="w-20 text-xs text-text-muted">{t.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-2">
                  <div className="h-full rounded-full" style={{ width: `${pct(t.value, Object.values(tiers))}%`, background: t.color }} />
                </div>
                <span className="w-6 text-right text-xs font-semibold text-text">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent activity pulse */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <Activity className="h-4 w-4" /> Recent Activity
            </h3>
            <Link to="/admin/analytics" className="text-xs text-accent hover:underline">Analytics</Link>
          </div>
          <div className="space-y-2">
            {(data.recent_activity || []).map((r) => (
              <div key={r.participation_id} className="flex items-center gap-3 rounded-lg bg-card-2 p-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-semibold text-accent">
                  {r.first_name?.[0]}{r.last_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-text">
                    <span className="font-medium">{r.first_name} {r.last_name}</span> — {r.activity}
                  </div>
                  <div className="text-[11px] text-text-muted">{r.recorded_at?.slice(0, 10)}</div>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${r.points >= 0 ? 'text-positive' : 'text-danger'}`}>
                  {r.points >= 0 ? '+' : ''}{r.points}
                </span>
              </div>
            ))}
            {(data.recent_activity || []).length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No activity recorded yet.</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-soft">
            <Megaphone className="h-4 w-4" /> Admin Shortcuts
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Approve Members', to: '/admin/pending', icon: UserCheck, desc: 'Review signups' },
              { label: 'Chapter Members', to: '/admin/members', icon: Users, color: 'bg-accent-2', desc: 'Stats & profiles' },
              { label: 'Analytics', to: '/admin/analytics', icon: TrendingUp, color: 'bg-accent-3', desc: 'Chapter trends' },
              { label: 'Semester Report', to: '/admin/reports', icon: CalendarDays, color: 'bg-amber', desc: 'Download CSV' },
              { label: 'Meetings', to: '/meetings', icon: CalendarCheck, color: 'bg-positive', desc: 'Schedule & record' },
              { label: 'Announcements', to: '/announcements', icon: Megaphone, color: 'bg-accent-2', desc: 'Post updates' },
            ].map((a) => {
              const Icon = a.icon
              return (
                <Link key={a.label} to={a.to}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card-2 p-3.5 transition-colors hover:border-accent">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.color || 'bg-card'}`}>
                    <Icon className="h-4 w-4 text-text" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text">{a.label}</div>
                    <div className="truncate text-[11px] text-text-muted">{a.desc}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function pct(value, all) {
  const total = (all || []).reduce((s, v) => s + v, 0)
  if (!total) return 0
  return (value / total) * 100
}