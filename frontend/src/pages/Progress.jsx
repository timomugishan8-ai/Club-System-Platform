import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import GitHubHeatmap from '../components/GitHubHeatmap'
import { useAuth } from '../context/AuthContext'
import { Award, TrendingUp, GitBranch, CalendarCheck, Trophy, Lock, ChevronDown, ChevronRight } from 'lucide-react'

const TIERS = [
  { name: 'Diamond',     color: '#06B6D4' },
  { name: 'Gold',        color: '#FFC53A' },
  { name: 'Silver',      color: '#9CA3AF' },
  { name: 'Bronze',      color: '#92400E' },
  { name: 'Rising Star', color: '#14B8A6' },
  { name: 'Rookie',      color: '#6B7280' },
]

const tierColor = (name) => (TIERS.find((t) => t.name === name) || TIERS[5]).color

const PILLARS = [
  { key: 'Attendance & Participation', color: 'var(--color-accent-3)', short: 'Attendance' },
  { key: 'Technical Skills',          color: '#22C55E', short: 'Technical' },
  { key: 'Projects & GitHub',         color: '#FFC53A', short: 'Projects' },
  { key: 'Community Contribution',    color: '#06B6D4', short: 'Community' },
  { key: 'Professional Growth',       color: 'var(--color-accent)', short: 'Professional' },
]

export default function Progress() {
  const { isAdmin } = useAuth()
  const [progress, setProgress] = useState(null)
  const [github, setGithub] = useState(null)
  const [activity, setActivity] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [allBadges, setAllBadges] = useState([])
  const [myBadges, setMyBadges] = useState([])
  const [members, setMembers] = useState([])
  const [openDetailId, setOpenDetailId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      // Neutral admin: the progress page shows only chapter members' progress,
      // never the admin's own (points/GitHub/badges don't apply to admins).
      api.leaderboard.all()
        .then((d) => setMembers(d?.leaderboard || []))
        .catch(() => setMembers([]))
        .finally(() => setLoading(false))
      return
    }
    Promise.all([
      api.leaderboard.myProgress().catch(() => null),
      api.github.myStats().catch(() => null),
      api.github.myActivity().catch(() => null),
      api.attendance.myStats().catch(() => null),
      api.badges.all().catch(() => null),
      api.badges.mine().catch(() => null),
    ]).then(([p, g, a, att, bAll, bMine]) => {
      setProgress(p?.progress || null)
      setGithub(g?.stats || null)
      setActivity(a?.activity || [])
      setAttendance(att?.stats || null)
      setAllBadges(bAll?.badges || [])
      setMyBadges(bMine?.badges || [])
      setLoading(false)
    })
  }, [isAdmin])

  // Load a member's full progress detail when their snippet is expanded
  const toggleDetail = (memberId) => {
    if (openDetailId === memberId) { setOpenDetailId(null); setDetail(null); return }
    setOpenDetailId(memberId)
    setDetail(null)
    api.leaderboard.memberProgress(memberId)
      .then((d) => setDetail({ progress: d.progress || null }))
      .catch(() => setDetail({ progress: null }))
  }

  if (loading) return <Spinner className="py-20" />

  // Admin: neutral oversight — only chapter members' progress, no personal stats
  if (isAdmin) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-text">Chapter Member Progress</h1>
          <p className="text-sm text-text-muted">
            Progress overview for every chapter member — click a member to expand their details.
          </p>
        </div>

        <div className="card p-5">
          <div className="space-y-2">
            {members.map((m) => {
              const open = openDetailId === m.member_id
              return (
                <div key={m.member_id} className="rounded-lg border border-border">
                  <button
                    onClick={() => toggleDetail(m.member_id)}
                    className="flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-card-2"
                  >
                    {open
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-2 text-xs font-semibold text-accent">
                      {m.first_name?.[0]}{m.last_name?.[0]}
                    </div>
                    <span className="min-w-0 flex-1 truncate font-medium text-text">{m.first_name} {m.last_name}</span>
                    <TierBadge tier={m.tier} />
                    <span className="w-20 text-right text-sm font-semibold text-text">{m.progress_score}</span>
                    <span className="w-24 text-right text-xs text-text-muted">pts {m.total_points}</span>
                    <span className="w-16 text-right text-xs text-text-soft">GH {m.github_score}</span>
                    <span className="w-16 text-right text-xs text-text-soft">
                      {m.attendance_rate != null ? `${m.attendance_rate}%` : '—'}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-border p-4">
                      {!detail && <p className="text-sm text-text-muted">Loading details…</p>}
                      {detail?.progress && <MemberProgressDetail progress={detail.progress} />}
                      {detail && !detail.progress && <p className="text-sm text-text-muted">No progress data.</p>}
                    </div>
                  )}
                </div>
              )
            })}
            {members.length === 0 && (
              <p className="py-8 text-center text-sm text-text-muted">No chapter members found.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!progress) return <p className="py-10 text-center text-text-muted">No progress data.</p>

  const tc = tierColor(progress.tier)
  const pillarPoints = progress.pillar_points || {}
  const totalPillarPoints = PILLARS.reduce((sum, p) => sum + (pillarPoints[p.key] || 0), 0)

  return (
    <div className="space-y-5">
      {/* Tier banner */}
      <div
        className="card p-6"
        style={{ border: `1px solid ${tc}40` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6" style={{ color: tc }} />
              <h1 className="text-2xl font-bold text-text">
                {progress.tier} <span className="text-text-muted text-base font-normal">Member</span>
              </h1>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Progress score: <span className="text-text font-semibold">{progress.progress_score}</span>
              {progress.next_tier && (
                <span> · {progress.points_to_next} points to {progress.next_tier}</span>
              )}
            </p>
          </div>
          <div
            className="rounded-xl px-4 py-2"
            style={{ backgroundColor: tc + '20' }}
          >
            <div className="text-3xl font-bold text-text">{progress.progress_score}</div>
            <div className="text-xs text-text-muted">Total Score</div>
          </div>
        </div>
      </div>

      {/* Stat panels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPanel icon={TrendingUp} label="Participation Points" value={progress.total_points} color="bg-accent-2" />
        <StatPanel icon={GitBranch} label="GitHub Score" value={progress.github_score} color="bg-accent-3" />
        <StatPanel icon={CalendarCheck} label="Attendance Rate" value={`${progress.attendance_rate}%`} color="bg-positive" />
        <StatPanel icon={Award} label="Badges Earned" value={progress.badges_earned} color="bg-amber" />
      </div>

      {/* Pillar breakdown */}
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-soft">Points by Pillar</h3>
        {totalPillarPoints > 0 ? (
          <div className="space-y-3">
            {PILLARS.map((pillar) => {
              const pts = pillarPoints[pillar.key] || 0
              const pct = totalPillarPoints > 0 ? (pts / totalPillarPoints) * 100 : 0
              return (
                <div key={pillar.key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-text-muted">{pillar.short}</span>
                    <span className="text-text-soft">{pts} pts</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: pillar.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-text-muted">No pillar points yet.</p>
        )}
      </div>

      {/* Badges grid */}
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-soft">Badge Collection</h3>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-10">
          {allBadges.map((badge) => {
            const earned = myBadges.some((b) => b.badge_id === badge.badge_id)
            return (
              <div key={badge.badge_id} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{
                    background: earned ? badge.color + '20' : 'var(--color-card-2)',
                    border: earned ? `1px solid ${badge.color}40` : '1px solid transparent',
                  }}
                  title={badge.description}
                >
                  {earned ? (
                    <Award className="h-7 w-7" style={{ color: badge.color }} />
                  ) : (
                    <Lock className="h-6 w-6 text-text-muted" />
                  )}
                </div>
                <span className={`text-center text-[10px] leading-tight ${earned ? 'text-text-soft' : 'text-text-muted'}`}>
                  {badge.name}
                </span>
              </div>
            )
          })}
          {allBadges.length === 0 && (
            <p className="col-span-full py-4 text-center text-sm text-text-muted">No badges available.</p>
          )}
        </div>
      </div>

      {/* Attendance breakdown */}
      {attendance && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Attendance Breakdown</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AttStat label="Present" value={attendance.present} color="text-positive" />
            <AttStat label="Late" value={attendance.late} color="text-amber" />
            <AttStat label="Absent" value={attendance.absent} color="text-danger" />
            <AttStat label="Excused" value={attendance.excused} color="text-text-muted" />
          </div>
        </div>
      )}

      {/* GitHub breakdown */}
      {github && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">GitHub Breakdown</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <AttStat label="Repositories" value={github.repo_count} color="text-accent" />
            <AttStat label="Commits" value={github.commit_count} color="text-accent" />
            <AttStat label="Pull Requests" value={github.pr_count} color="text-accent" />
            <AttStat label="Issues" value={github.issue_count} color="text-accent" />
            <AttStat label="Streak (days)" value={github.streak_days} color="text-amber" />
          </div>
          <button
            onClick={() => api.github.refreshMy().then(() => window.location.reload())}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-text-soft hover:bg-card-2"
          >
            Refresh GitHub Stats
          </button>
        </div>
      )}

      {/* Contribution heatmap */}
      {github && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-soft">Contribution Activity</h3>
          <GitHubHeatmap activity={activity} />
        </div>
      )}
    </div>
  )
}

function TierBadge({ tier }) {
  const t = TIERS.find((x) => x.name === tier) || TIERS[5]
  return (
    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }}>
      {t.name}
    </span>
  )
}

function MemberProgressDetail({ progress }) {
  const tc = tierColor(progress.tier)
  const pillarPoints = progress.pillar_points || {}
  const totalPillarPoints = PILLARS.reduce((sum, p) => sum + (pillarPoints[p.key] || 0), 0)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-lg px-4 py-2" style={{ backgroundColor: tc + '20' }}>
          <div className="text-xl font-bold text-text">{progress.progress_score}</div>
          <div className="text-[10px] text-text-muted">Score</div>
        </div>
        <div className="text-sm text-text-muted">
          {progress.total_points} participation points · GitHub {progress.github_score} · Attendance {progress.attendance_rate ?? 0}% · {progress.badges_earned} badges
          {progress.next_tier && <> · {progress.points_to_next} pts to {progress.next_tier}</>}
        </div>
      </div>
      {totalPillarPoints > 0 && (
        <div className="space-y-2">
          {PILLARS.map((pillar) => {
            const pts = pillarPoints[pillar.key] || 0
            const pct = totalPillarPoints > 0 ? (pts / totalPillarPoints) * 100 : 0
            return (
              <div key={pillar.key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-text-muted">{pillar.short}</span>
                  <span className="text-text-soft">{pts} pts</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-card-2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatPanel({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-text" />
      </div>
      <div className="text-2xl font-bold text-text">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

function AttStat({ label, value, color }) {
  return (
    <div className="rounded-lg bg-card-2 p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value || 0}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}