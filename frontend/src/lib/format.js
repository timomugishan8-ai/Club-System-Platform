// Human-friendly date/time formatting shared across pages.

// "2026-09-06" | ISO string | Date -> "Sun, Sep 6, 2026"
// Plain YYYY-MM-DD is parsed as local time, not UTC.
export function formatDate(value) {
  if (!value) return '—'
  const str = String(value)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str)
    ? new Date(`${str}T00:00:00`)
    : new Date(str)
  if (Number.isNaN(d.getTime())) return str
  return d.toLocaleDateString('en', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

// "08:16:00" | "08:16" | Date -> "8:16 AM"
export function formatTime(value) {
  if (!value) return '—'
  const m = String(value).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return String(value)
  const d = new Date()
  d.setHours(Number(m[1]), Number(m[2]), 0, 0)
  return d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
}