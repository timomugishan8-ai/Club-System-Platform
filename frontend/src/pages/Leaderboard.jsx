import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { Trophy } from 'lucide-react'

const TIERS = [
  { name: 'Diamond',     color: '#06B6D4' },
  { name: 'Gold',        color: '#F59E0B' },
  { name: 'Silver',      color: '#9CA3AF' },
  { name: 'Bronze',      color: '#92400E' },
  { name: 'Rising Star', color: '#14B8A6' },
  { name: 'Rookie',      color: '#6B7280' },
]

const tierStyle = (tierName) => {
  const t = TIERS.find((t) => t.name === tierName) || TIERS[5]
  return {
    badge: { backgroundColor: t.color + '20', color: t.color, border: `1px solid ${t.color}40` },
    color: t.color,
  }
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.leaderboard.all().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-20" />
  if (!data) return <p className="py-10 text-center text-text-muted">No data.</p>

  const { leaderboard, tiers } = data

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Leaderboard</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          {TIERS.map((t) => (
            <span
              key={t.name}
              className="rounded-full px-3 py-1 font-medium"
              style={{ backgroundColor: t.color + '20', color: t.color }}
            >
              {t.name} ≥ {tiers[t.name] ?? 0}
            </span>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-card-2 text-left text-xs text-text-muted">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-right">GitHub</th>
              <th className="px-4 py-3 text-right">Attendance</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-center">Tier</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row) => {
              const isMe = row.member_id === user?.member_id
              const ts = tierStyle(row.tier)
              return (
                <tr key={row.member_id}
                  className={`border-b border-border last:border-0 ${isMe ? 'bg-accent-2/10' : ''}`}>
                  <td className="px-4 py-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      row.rank === 1 ? 'bg-amber text-white' : row.rank === 2 ? 'bg-text-soft text-bg' : row.rank === 3 ? 'bg-amber/60 text-bg' : 'bg-card-2 text-text-muted'
                    }`}>
                      {row.rank === 1 ? <Trophy className="h-3.5 w-3.5" /> : row.rank}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card-2 text-xs font-semibold text-accent">
                        {row.first_name?.[0]}{row.last_name?.[0]}
                      </div>
                      <span className="text-white">
                        {row.first_name} {row.last_name}
                        {isMe && <span className="ml-2 text-xs text-accent">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-text-soft">{row.total_points}</td>
                  <td className="px-4 py-3 text-right text-text-soft">{row.github_score}</td>
                  <td className="px-4 py-3 text-right text-text-soft">{row.attendance_rate}%</td>
                  <td className="px-4 py-3 text-right font-bold text-white">{row.progress_score}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={ts.badge}
                    >
                      {row.tier}
                    </span>
                  </td>
                </tr>
              )
            })}
            {leaderboard.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No members yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}