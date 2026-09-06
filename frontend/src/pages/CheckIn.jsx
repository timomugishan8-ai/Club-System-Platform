import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, formatTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import chapterLogo from '../assets/chapter-logo.jpg'
import { QrCode, CheckCircle2, Clock, XCircle, LogIn } from 'lucide-react'

// Landing page a member reaches by scanning the entrance QR. If they're
// not logged in yet, login redirects straight back here with the token.
export default function CheckIn() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const token = new URLSearchParams(location.search).get('token')

  const [preview, setPreview] = useState(null)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const attempted = useRef(false)

  useEffect(() => {
    if (!token) {
      setError('No check-in code found. Scan the QR code at the entrance again.')
      return
    }
    if (isAuthenticated) return
    api.qr.preview(token)
      .then((d) => setPreview(d.valid ? d.meeting : null))
      .catch(() => setPreview(null))
  }, [token, isAuthenticated])

  useEffect(() => {
    // Auto check-in once the member lands here authenticated (scan → done)
    if (isAuthenticated && token && !attempted.current) {
      attempted.current = true
      doCheckIn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token])

  const doCheckIn = async () => {
    setChecking(true)
    setError('')
    try {
      const d = await api.qr.checkIn(token)
      setResult(d)
    } catch (e) {
      setError(e.message)
    } finally {
      setChecking(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center px-4"
        style={{ background: 'linear-gradient(rgba(5, 6, 26, 0.85), rgba(5, 6, 26, 0.95))' }}
      >
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <img src={chapterLogo} alt="Data Science Chapter logo"
              className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-black/40 ring-2 ring-white/10" />
            <div className="text-center">
              <h1 className="flex items-center justify-center gap-2 text-lg font-bold tracking-wider text-white">
                <QrCode className="h-5 w-5" /> MEETING CHECK-IN
              </h1>
              <p className="text-xs font-semibold tracking-wider text-text-soft">DATA SCIENCE · UCU CHAPTER</p>
            </div>
          </div>

          <div className="card p-6 text-center">
            {preview ? (
              <>
                <p className="text-sm text-text-muted">You're checking in for</p>
                <h2 className="mt-1 text-lg font-bold text-text">{preview.title}</h2>
                <p className="mt-0.5 text-sm text-text-muted">
                  {formatDate(preview.meeting_date)}{preview.start_time ? ` · ${formatTime(preview.start_time)}` : ''}
                  {preview.venue ? ` · ${preview.venue}` : ''}
                </p>
                <button
                  onClick={() => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } })}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white"
                >
                  <LogIn className="h-4 w-4" /> Log in to check in
                </button>
              </>
            ) : (
              <>
                <Spinner className="py-6" />
                <p className="text-sm text-text-muted">Verifying check-in code…</p>
              </>
            )}
            {error && (
              <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(rgba(5, 6, 26, 0.85), rgba(5, 6, 26, 0.95))' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={chapterLogo} alt="Data Science Chapter logo"
            className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-black/40 ring-2 ring-white/10" />
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-wider text-white">
            <QrCode className="h-5 w-5" /> MEETING CHECK-IN
          </h1>
        </div>

        <div className="card p-6 text-center">
          {checking ? (
            <>
              <Spinner className="py-6" />
              <p className="text-sm text-text-muted">Recording your check-in…</p>
            </>
          ) : result ? (
            <>
              {result.status === 'Present' ? (
                <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-positive" />
              ) : (
                <Clock className="mx-auto mb-3 h-16 w-16 text-amber" />
              )}
              <h2 className="text-xl font-bold text-text">
                {result.status === 'Present' ? "You're on time!" : "Checked in — Late"}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {result.meeting.title} · checked in at {formatTime(result.check_in_time)}
              </p>
              {result.already_checked_in && (
                <p className="mt-2 text-xs text-text-muted">
                  You were already checked in for this meeting — original record kept.
                </p>
              )}
              <p className="mt-4 text-xs text-text-muted">
                See you at the next one, {user?.first_name}!
              </p>
              <button onClick={() => navigate('/')}
                className="mt-6 w-full rounded-lg border border-border py-2 text-sm text-text-soft hover:bg-card-2">
                Done
              </button>
            </>
          ) : (
            <>
              <XCircle className="mx-auto mb-3 h-16 w-16 text-danger" />
              <h2 className="text-lg font-bold text-text">Check-in failed</h2>
              <p className="mt-1 text-sm text-text-muted">{error || 'Something went wrong.'}</p>
              <button onClick={doCheckIn}
                className="mt-6 w-full rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white">
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}