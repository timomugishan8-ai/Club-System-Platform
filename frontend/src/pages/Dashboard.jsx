import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, GraduationCap, ClipboardCheck,   Trophy, ChevronRight,
  GitBranch, Calendar, Megaphone, Award, Flame, Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import GitHubHeatmap from '../components/GitHubHeatmap'

export default function Dashboard() {
  const { user } = useAuth()
  const [dash, setDash] = useState(null)
  const [progress, setProgress] = useState(null)
  const [github, setGithub] = useState(null)
  const [activity, setActivity] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [allBadges, setAllBadges] = useState([])
  const [myBadges, setMyBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.leaderboard.myDashboard().catch(() => null),
      api.leaderboard.myProgress().catch(() => null),
      api.github.myStats().catch(() => null),
      api.github.myActivity().catch(() => null),
      api.leaderboard.all().catch(() => null),
      api.badges.all().catch(() => null),
      api.badges.mine().catch(() => null),
    ]).then(([d, p, g, a, l, bAll, bMine]) => {
      setDash(d?.dashboard || {})
      setProgress(p?.progress || null)
      setGithub(g?.stats || null)
      setActivity(a?.activity || [])
      setLeaderboard(l?.leaderboard?.slice(0, 5) || [])
      setAllBadges(bAll?.badges || [])
      setMyBadges(bMine?.badges || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner className="py-20" />

  const firstName = user?.first_name || 'there'

  const stats = [
    { label: 'Chapter Members', value: dash.chapter_members ?? 0, sub: 'Active this semester', trend: '↑12%', icon: Users, color: 'bg-accent-3' },
    { label: 'Workshops Held', value: dash.workshops_held ?? 0, sub: 'This semester', trend: '↑27%', icon: GraduationCap, color: 'bg-accent-2' },
    { label: 'Projects Completed', value: dash.projects_completed ?? 0, sub: 'By chapter members', trend: '↑35%', icon: ClipboardCheck, color: 'bg-positive' },
    { label: 'Challenge Points', value: dash.my_points ?? 0, sub: 'Your total points', icon: Trophy, color: 'bg-amber' },
  ]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-bg-soft to-bg p-6 lg:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white lg:text-3xl">
            Welcome back, <span className="text-gradient">{firstName}</span>! 👋
          </h1>
          <p className="mt-1 text-sm text-text-muted">Track your growth. Build your skills. Make an impact.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <svg viewBox="0 0 400 200" className="h-full w-full">
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B6FE8" />
                <stop offset="100%" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
            <polyline points="0,150 50,120 100,140 150,90 200,110 250,60 300,80 350,40 400,50"
              fill="none" stroke="url(#heroGrad)" strokeWidth="2" />
            {[50,120,140,90,110,60,80,40,50].map((y,i) => (
              <circle key={i} cx={i*50} cy={y} r="3" fill="#7C5CFC" />
            ))}
          </svg>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {s.trend && (
                  <span className="text-xs font-medium text-positive">{s.trend}</span>
                )}
                {s.label === 'Challenge Points' && (
                  <ChevronRight className="h-5 w-5 text-text-muted" />
                )}
              </div>
              <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
              <div className="mt-0.5 text-xs text-text-muted">{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Progress */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">My Overall Progress</h3>
          <div className="flex items-center gap-5">
            <ProgressRing percent={Math.min(progress?.progress_score || 0, 100)} />
            <div className="flex-1 space-y-3">
              <MiniProgress label="Participation Points" value={progress?.total_points || 0} max={500} color="bg-accent-2" />
              <MiniProgress label="GitHub Score" value={progress?.github_score || 0} max={100} color="bg-accent-3" />
              <MiniProgress label="Attendance" value={progress?.attendance_rate || 0} max={100} color="bg-positive" suffix="%" />
            </div>
          </div>
          <Link to="/progress" className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm text-text-soft hover:bg-card-2">
            View Full Progress <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* GitHub */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <GitBranch className="h-4 w-4" /> GitHub Activity
            </h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">This Month</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Repositories', value: github?.repo_count ?? 0 },
              { label: 'Commits', value: github?.commit_count ?? 0 },
              { label: 'Pull Requests', value: github?.pr_count ?? 0 },
              { label: 'Issues', value: github?.issue_count ?? 0 },
              { label: 'Contributions', value: (github?.commit_count || 0) + (github?.pr_count || 0) + (github?.issue_count || 0) },
              { label: 'Day Streak', value: github?.streak_days ?? 0, flame: true },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-card-2 p-3">
                <div className="text-lg font-bold text-white">
                  {m.flame && m.value > 0 && <Flame className="mr-1 inline h-4 w-4 text-amber" />}
                  {m.value}
                </div>
                <div className="text-[11px] text-text-muted">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <GitHubHeatmap activity={activity} />
          </div>
          <a href={`https://github.com/${github?.member_id || ''}`} target="_blank" rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm text-text-soft hover:bg-card-2">
            View GitHub Profile ↗
          </a>
        </div>

        {/* Leaderboard top 5 */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-soft">Leaderboard (Top 5)</h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">This Semester</span>
          </div>
          <div className="space-y-2">
            {leaderboard.map((row) => {
              const isMe = row.member_id === user?.member_id
              return (
                <div key={row.member_id}
                  className={`flex items-center gap-3 rounded-lg p-2 ${isMe ? 'bg-accent-2/20 ring-1 ring-accent-2/40' : ''}`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    row.rank === 1 ? 'bg-amber text-white' : 'bg-card-2 text-text-muted'
                  }`}>
                    {row.rank}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-card-2 text-xs font-semibold text-accent flex items-center justify-center">
                    {row.first_name?.[0]}{row.last_name?.[0]}
                  </div>
                  <div className="flex-1 truncate text-sm text-white">
                    {row.first_name} {row.last_name}
                  </div>
                  <div className="text-sm font-semibold text-text-soft">{row.total_points}</div>
                </div>
              )
            })}
            {leaderboard.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No data yet.</p>
            )}
          </div>
          <Link to="/leaderboard" className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm text-text-soft hover:bg-card-2">
            View Full Leaderboard <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Events */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <Calendar className="h-4 w-4" /> Upcoming Events
            </h3>
            <Link to="/events" className="text-xs text-accent hover:underline">View Calendar</Link>
          </div>
          <div className="space-y-3">
            {(dash.upcoming_events || []).map((ev) => (
              <EventRow key={ev.event_id} event={ev} />
            ))}
            {(dash.upcoming_events || []).length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No upcoming events.</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <Megaphone className="h-4 w-4" /> Chapter Announcements
            </h3>
            <Link to="/announcements" className="text-xs text-accent hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {(dash.recent_announcements || []).map((a) => (
              <AnnouncementRow key={a.announcement_id} item={a} />
            ))}
            {(dash.recent_announcements || []).length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No announcements.</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-soft">
              <Award className="h-4 w-4" /> My Badges
            </h3>
            <Link to="/progress" className="text-xs text-accent hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {allBadges.slice(0, 4).map((badge) => {
              const earned = myBadges.some((b) => b.badge_id === badge.badge_id)
              return (
                <div key={badge.badge_id} className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: earned ? badge.color + '20' : 'var(--color-card-2)' }}
                  >
                    {earned ? (
                      <Award className="h-6 w-6" style={{ color: badge.color }} />
                    ) : (
                      <Lock className="h-5 w-5 text-text-muted" />
                    )}
                  </div>
                  <span className={`text-center text-[10px] leading-tight ${earned ? 'text-text-soft' : 'text-text-muted'}`}>
                    {badge.name}
                  </span>
                </div>
              )
            })}
            {allBadges.length === 0 && (
              <p className="col-span-4 py-4 text-center text-sm text-text-muted">No badges available.</p>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">{progress?.badges_earned ?? 0}</div>
              <div className="text-[11px] text-text-muted">Badges Earned</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{progress?.points_to_next ?? 0}</div>
              <div className="text-[11px] text-text-muted">Points to Next</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-accent">{progress?.next_tier || '—'}</div>
              <div className="text-[11px] text-text-muted">Next Tier</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ percent }) {
  const r = 54
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative h-[120px] w-[120px] flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B6FE8" />
            <stop offset="100%" stopColor="#7C5CFC" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{percent}%</span>
        <span className="text-[11px] text-text-muted">Overall</span>
      </div>
    </div>
  )
}

function MiniProgress({ label, value, max, color, suffix = '' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-soft">{value}{suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-card-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EventRow({ event }) {
  const colors = ['bg-accent-2', 'bg-accent-3', 'bg-amber']
  const c = colors[event.event_id % colors.length]
  const d = new Date(event.event_date)
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg ${c} text-white`}>
        <span className="text-lg font-bold leading-none">{d.getDate()}</span>
        <span className="text-[10px] uppercase">{d.toLocaleString('en', { month: 'short' })}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-white">{event.title}</div>
        <div className="text-xs text-text-muted">{event.start_time?.slice(0,5)} · {event.venue || 'TBD'}</div>
      </div>
      <span className="rounded-full bg-accent-2/20 px-2 py-0.5 text-[11px] text-accent">Upcoming</span>
    </div>
  )
}

function AnnouncementRow({ item }) {
  const colors = { General: '#3B6FE8', Event: '#22C55E', Achievement: '#F59E0B', Urgent: '#EF4444' }
  const c = colors[item.category] || '#3B6FE8'
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: c + '20' }}>
        <Megaphone className="h-4 w-4" style={{ color: c }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">{item.title}</div>
        <div className="truncate text-xs text-text-muted">{item.body?.slice(0, 80)}</div>
      </div>
    </div>
  )
}