import { useEffect, useState } from 'react'
import { X, Award, CheckCircle2, Target } from 'lucide-react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import BadgeIcon from '../components/BadgeIcon'

// Badge catalog modal: every badge with its criteria, step-by-step guide,
// and the viewer's live progress toward each requirement.
export default function BadgeCatalogModal({ onClose }) {
  const [badges, setBadges] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.badges.catalog()
      .then((d) => setBadges(d.badges || []))
      .catch((e) => setError(e.message))
  }, [])

  const earnedCount = badges?.filter((b) => b.earned).length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card flex max-h-[85vh] w-full max-w-2xl flex-col p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-text">
              <Award className="h-5 w-5 text-amber" /> Badge Guide
            </h2>
            <p className="text-xs text-text-muted">
              {badges ? `${earnedCount} of ${badges.length} earned — here's how to get the rest` : 'Loading…'}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-3 overflow-y-auto pr-1">
          {!badges && !error && <Spinner className="py-10" />}
          {badges?.map((badge) => (
            <div
              key={badge.badge_id}
              className="rounded-xl border p-4"
              style={{
                borderColor: badge.earned ? badge.color + '60' : 'var(--color-border)',
                background: badge.earned ? badge.color + '10' : 'var(--color-card-2)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: badge.color + '20', border: `1px solid ${badge.color}40` }}
                >
                  {badge.earned
                    ? <BadgeIcon icon={badge.icon} color={badge.color} size="h-6 w-6" />
                    : <BadgeIcon icon={badge.icon} color={badge.color} size="h-6 w-6" earned={false} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-text">{badge.name}</h3>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] text-text-muted">
                      {badge.pillar}
                    </span>
                    {badge.earned && (
                      <span className="flex items-center gap-1 rounded-full bg-positive/20 px-2 py-0.5 text-[10px] font-medium text-positive">
                        <CheckCircle2 className="h-3 w-3" /> Earned
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-soft">{badge.criteria}</p>

                  {/* Live progress bars */}
                  {badge.requirements?.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {badge.requirements.map((req, i) => {
                        const pct = Math.min(100, (req.current / req.target) * 100)
                        const done = req.current >= req.target
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-text-muted">{req.label}</span>
                              <span className={done ? 'font-semibold text-positive' : 'text-text-soft'}>
                                {req.current} / {req.target}
                              </span>
                            </div>
                            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-card">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: done ? '#22C55E' : badge.color }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* How-to steps */}
                  {badge.how_to_earn?.length > 0 && (
                    <div className="mt-2.5 rounded-lg bg-card p-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-text-soft">
                        <Target className="h-3 w-3" /> How to earn it
                      </div>
                      <ol className="list-inside list-decimal space-y-0.5 text-[11px] text-text-muted">
                        {badge.how_to_earn.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {badges?.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">No badges configured yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
