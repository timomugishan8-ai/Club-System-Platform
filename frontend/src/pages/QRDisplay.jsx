import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { ChevronLeft, QrCode, RotateCw, Users, Check, Clock, Copy, CheckCheck, Printer } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate } from '../lib/format'

const CHECKIN_URL = `${window.location.origin}/check-in`

// Full-screen QR display for the entrance. Shows the code plus a live
// check-in tally; refreshes every 10s while the meeting door is open.
export default function QRDisplay({ onBack }) {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const back = onBack || (() => navigate('/meetings'))
  const [data, setData] = useState(null)
  const [meeting, setMeeting] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  const timer = useRef(null)

  const load = () => {
    api.qr.getToken(meetingId)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
    api.meetings.get(meetingId)
      .then((d) => setMeeting(d.meeting))
      .catch(() => {})
  }

  useEffect(() => {
    load()
    timer.current = setInterval(load, 10000)
    return () => clearInterval(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId])

  const rotate = async () => {
    if (!confirm('Invalidate the current code and issue a new one? Members who already checked in keep their record.')) return
    setRotating(true)
    try {
      await api.qr.rotate(meetingId)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setRotating(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${CHECKIN_URL}?token=${data.token}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const tally = data?.check_ins

  // Print-friendly poster: only the #qr-poster node renders on paper
  const printPoster = () => window.print()

  return (
    <div className="space-y-5">
      <button onClick={back}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-soft">
        <ChevronLeft className="h-4 w-4" /> Back to meetings
      </button>

      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-text">
              <QrCode className="h-6 w-6 text-accent" /> Meeting Check-in
            </h1>
            <p className="mt-0.5 text-sm text-text-muted">
              {meeting ? `${meeting.title} · ${formatDate(meeting.meeting_date)}` : 'Loading meeting…'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={printPoster} disabled={!data}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-card-2 disabled:opacity-50">
              <Printer className="h-3.5 w-3.5" /> Print poster
            </button>
            <button onClick={copyLink} disabled={!data}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-card-2 disabled:opacity-50">
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button onClick={rotate} disabled={rotating || !data}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-card-2 disabled:opacity-50">
              <RotateCw className={`h-3.5 w-3.5 ${rotating ? 'animate-spin' : ''}`} /> New code
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
          {/* QR code */}
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-lg">
            {data ? (
              <>
                <QRCode value={`${CHECKIN_URL}?token=${data.token}`} size={260} />
                <p className="max-w-[260px] text-center font-mono text-[10px] text-neutral-500">
                  {data.token}
                </p>
              </>
            ) : (
              <div className="flex h-[260px] w-[260px] items-center justify-center">
                <QrCode className="h-16 w-16 animate-pulse text-neutral-300" />
              </div>
            )}
          </div>

          {/* Live tally + instructions */}
          <div className="w-full max-w-sm space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <Users className="mx-auto mb-1 h-5 w-5 text-accent" />
                <div className="text-2xl font-bold text-text">{tally?.total ?? '—'}</div>
                <div className="text-xs text-text-muted">Checked in</div>
              </div>
              <div className="card p-4 text-center">
                <Check className="mx-auto mb-1 h-5 w-5 text-positive" />
                <div className="text-2xl font-bold text-text">{tally?.present ?? '—'}</div>
                <div className="text-xs text-text-muted">On time</div>
              </div>
              <div className="card p-4 text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-amber" />
                <div className="text-2xl font-bold text-text">{tally?.late ?? '—'}</div>
                <div className="text-xs text-text-muted">Late</div>
              </div>
            </div>

            <div className="card space-y-2 p-4 text-sm text-text-muted">
              <p className="font-semibold text-text">How it works</p>
              <p>1. Display this screen at the entrance (projector or laptop).</p>
              <p>2. Members scan the QR with their phone camera.</p>
              <p>3. The system marks them Present if they're within the grace window, Late after.</p>
              <p className="pt-1 text-xs">The tally refreshes automatically. "New code" invalidates the current QR — useful if it leaked or the meeting moved rooms.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only poster (A4): rendered by the browser on window.print() */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-poster, #qr-poster * { visibility: visible !important; }
          #qr-poster {
            position: fixed;
            inset: 0;
            margin: 0;
            padding: 24px;
            background: #ffffff !important;
            color: #111111 !important;
          }
        }
      `}</style>
      <div id="qr-poster" className="hidden print:block">
        <div className="text-center" style={{ color: '#111' }}>
          <p style={{ fontSize: 13, letterSpacing: '0.25em', color: '#555', margin: 0 }}>
            DATA SCIENCE CHAPTER · UCU
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 2px' }}>MEETING CHECK-IN</h1>
          <p style={{ fontSize: 15, color: '#333', margin: 0 }}>
            {meeting ? `${meeting.title} — ${formatDate(meeting.meeting_date)}` : ''}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0' }}>
            <div style={{ padding: 16, border: '2px solid #111', borderRadius: 16, background: '#fff' }}>
              {data && <QRCode value={`${CHECKIN_URL}?token=${data.token}`} size={340} />}
            </div>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, margin: '4px 0' }}>Scan with your phone camera to check in</p>
          <p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>
            You'll be marked Present if you're on time, Late after the grace window.
            Not logged in? You'll log in once, then be checked in automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
