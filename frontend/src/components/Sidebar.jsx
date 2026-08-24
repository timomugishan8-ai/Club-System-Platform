import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, User, TrendingUp, BookOpen, FolderGit2,
  CalendarCheck, Trophy, Megaphone, Database, Settings,
  ChevronDown, BarChart3, UserCheck, CalendarDays, BarChart2,
  FileText, ClipboardCheck,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'My Profile', icon: User },
  { to: '/progress', label: 'My Progress', icon: TrendingUp },
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/meetings', label: 'Meetings', icon: CalendarDays },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/articles', label: 'Articles', icon: FileText },
  { to: '/resources', label: 'Resources', icon: Database },
  { to: '/events', label: 'Events', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const leaderItems = [
  { to: '/admin/articles', label: 'Article Review', icon: ClipboardCheck },
]

const adminItems = [
  { to: '/admin/pending', label: 'Pending Approvals', icon: UserCheck },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/admin/articles', label: 'Article Review', icon: ClipboardCheck },
]

export default function Sidebar({ onCollapse }) {
  const { user, logout, isAdmin, isLeader } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-bg-soft">
      {/* Header */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wider text-white">DATA SCIENCE</div>
            <div className="text-xs font-semibold tracking-wider text-text-soft">UCU CHAPTER</div>
          </div>
        </div>
        <p className="mt-2 text-[10px] tracking-[0.2em] text-text-muted">
          LEARN. BUILD. IMPACT.
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCollapse}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[10px] px-3 py-[14px] text-sm transition-colors ${
                  isActive
                    ? 'bg-gradient-accent font-medium text-white'
                    : 'text-text-muted hover:bg-card hover:text-text-soft'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Leader section (non-admin leaders) */}
      {isLeader && !isAdmin && (
        <div className="border-t border-border px-3 py-2">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Leader
          </p>
          <div className="space-y-1">
            {leaderItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCollapse}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[10px] px-3 py-[14px] text-sm transition-colors ${
                      isActive
                        ? 'bg-gradient-accent font-medium text-white'
                        : 'text-text-muted hover:bg-card hover:text-text-soft'
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </div>
      )}

      {/* Admin section */}
      {isAdmin && (
        <div className="border-t border-border px-3 py-2">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Admin
          </p>
          <div className="space-y-1">
            {adminItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCollapse}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[10px] px-3 py-[14px] text-sm transition-colors ${
                      isActive
                        ? 'bg-gradient-accent font-medium text-white'
                        : 'text-text-muted hover:bg-card hover:text-text-soft'
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </div>
      )}

      {/* User card */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-card-2 text-sm font-semibold text-accent">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              `${user?.first_name?.[0] || '?'}${user?.last_name?.[0] || ''}`
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="truncate text-xs text-text-muted">{user?.role_name}</div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1 text-text-muted hover:bg-card hover:text-text-soft"
            title="Log out"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}