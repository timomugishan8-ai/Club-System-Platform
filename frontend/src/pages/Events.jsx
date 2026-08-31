import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { MapPin, Clock } from 'lucide-react'

const typeColors = {
  Workshop: 'var(--color-accent-3)',
  Hackathon: 'var(--color-accent)',
  Social: '#22C55E',
  Talk: '#FFC53A',
  Other: '#8A88A6',
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.events.list().then((d) => setEvents(d.events || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">Events</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => {
          const c = typeColors[ev.event_type] || typeColors.Other
          const d = new Date(ev.event_date)
          return (
            <div key={ev.event_id} className="card p-5">
              <div className="flex gap-3">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl text-white" style={{ background: c }}>
                  <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                  <span className="text-[10px] uppercase">{d.toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text">{ev.title}</h3>
                  <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px]" style={{ background: c + '20', color: c }}>
                    {ev.event_type}
                  </span>
                </div>
              </div>
              {ev.description && (
                <p className="mt-3 text-sm text-text-muted line-clamp-2">{ev.description}</p>
              )}
              <div className="mt-3 space-y-1.5 text-xs text-text-muted">
                {ev.start_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {ev.start_time?.slice(0,5)}{ev.end_time ? ` – ${ev.end_time.slice(0,5)}` : ''}
                  </div>
                )}
                {ev.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {ev.venue}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {events.length === 0 && (
          <p className="col-span-full py-10 text-center text-text-muted">No events yet.</p>
        )}
      </div>
    </div>
  )
}