import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, Megaphone, UserCheck, Award, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

const TYPE_META = {
  announcement: { icon: Megaphone, color: 'text-accent-2' },
  approval: { icon: UserCheck, color: 'text-positive' },
  role_change: { icon: Award, color: 'text-amber' },
}

const fallbackMeta = { icon: Bell, color: 'text-text-muted' }

function timeAgo(dateStr) {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.floor((Date.now() - then) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  // Keep the badge count fresh, even while the dropdown is closed
  useEffect(() => {
    let alive = true
    const load = () => {
      api.notifications
        .unread()
        .then((d) => {
          if (alive) setUnread(d.unread || 0)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 30000)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [])

  const loadList = () => {
    setLoading(true)
    api.notifications
      .list()
      .then((d) => {
        setItems(d.notifications || [])
        setUnread((d.notifications || []).filter((n) => !n.is_read).length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // Close on outside click or Escape
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) loadList()
  }

  const markRead = (n) => {
    if (n.is_read) return
    api.notifications
      .markRead(n.notification_id)
      .then(() => {
        setItems((list) =>
          list.map((x) => (x.notification_id === n.notification_id ? { ...x, is_read: 1 } : x))
        )
        setUnread((c) => Math.max(0, c - 1))
      })
      .catch(() => {})
  }

  const markAllRead = () => {
    api.notifications
      .markAllRead()
      .then(() => {
        setItems((list) => list.map((x) => ({ ...x, is_read: 1 })))
        setUnread(0)
      })
      .catch(() => {})
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        className="relative rounded-lg p-2 text-text-muted hover:bg-card hover:text-text-soft"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold text-text">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-card-2 hover:text-text-soft"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-text-muted">
                No notifications yet
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] || fallbackMeta
                const Icon = meta.icon
                return (
                  <button
                    key={n.notification_id}
                    onClick={() => markRead(n)}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-card-2 ${
                      !n.is_read ? 'bg-accent/5' : ''
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${meta.color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-text">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-danger" />
                        )}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-text-muted">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[11px] text-text-muted">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}