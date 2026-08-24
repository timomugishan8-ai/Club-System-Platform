import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Moon, Menu } from 'lucide-react'
import { api } from '../lib/api'

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.notifications.unread().then((d) => setUnread(d.unread || 0)).catch(() => {})
  }, [])

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-bg-soft px-4">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-text-muted hover:bg-card hover:text-text-soft lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          placeholder="Search members, projects, modules..."
          className="w-full rounded-full border border-border bg-card py-2 pl-10 pr-4 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/announcements')}
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

        <button className="rounded-lg p-2 text-text-muted hover:bg-card hover:text-text-soft" title="Theme">
          <Moon className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}