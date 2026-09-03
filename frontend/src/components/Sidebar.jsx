import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useSidebarCounts from '../hooks/useSidebarCounts'
import {
  LayoutDashboard, User, TrendingUp, BookOpen, FolderGit2,
  CalendarCheck, Trophy, Megaphone, Database, Settings,
  ChevronDown, UserCheck, CalendarDays, BarChart2,
  FileText, ClipboardCheck, FileBarChart, Users,
} from 'lucide-react'
import chapterLogo from '../assets/chapter-logo.jpg'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'My Profile', icon: User },
  { to: '/progress', label: 'My Progress', icon: TrendingUp },
  { to: '/projects', label: 'GitHub Projects', icon: FolderGit2 },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/meetings', label: 'Meetings', icon: CalendarDays },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/articles', label: 'Articles', icon: FileText },
  { to: '/resources', label: 'Resources', icon: Database },
  { to: '/events', label: 'Events', icon: BookOpen },
]

const settingsItem = { to: '/settings', label: 'Settings', icon: Settings }

const leaderItems = [
  { to: '/admin/articles', label: 'Article Review', icon: ClipboardCheck },
]

const adminItems = [
  { to: '/admin/pending', label: 'Pending Approvals', icon: UserCheck },
  { to: '/admin/members', label: 'Chapter Members', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/admin/reports', label: 'Semester Report', icon: FileBarChart },
  { to: '/admin/articles', label: 'Article Review', icon: ClipboardCheck },
]

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-[10px] px-3 py-[14px] text-sm transition-colors ${
    isActive
      ? 'bg-gradient-accent font-medium text-white'
      : 'text-text-muted hover:bg-card hover:text-text-soft'
  }`

function Badge({ count }) {
  if (!count || count <= 0) return null
  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Sidebar({ onCollapse }) {
  const { user, logout, isAdmin, isLeader } = useAuth()
  const navigate = useNavigate()
  const { counts } = useSidebarCounts()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Map sidebar routes to badge count keys
  const badgeKey = {
    '/meetings': 'meetings',
    '/announcements': 'announcements',
    '/events': 'events',
    '/projects': 'projects',
    '/admin/pending': 'pending',
    '/admin/members': 'admin/members',
    '/admin/articles': 'admin/articles',
  }

  // Merge all sections into one scrollable list. Admins get the admin items
  // appended after the main nav; non-admin leaders get leader items instead.
  // Settings always sits at the very end of the list. The admin is a neutral
  // oversight account: its "progress" entry shows chapter members' progress.
  const items = isAdmin
    ? [...navItems.map((i) => (i.to === '/progress' ? { ...i, label: 'Chapter Member Progress' } : i)), ...adminItems, settingsItem]
    : isLeader
      ? [...navItems, ...leaderItems, settingsItem]
      : [...navItems, settingsItem]

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-bg-soft">
      {/* Header */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <img
            src={chapterLogo}
            alt="Data Science Chapter logo"
            className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/10"
          />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wider text-text">DATA SCIENCE</div>
            <div className="text-xs font-semibold tracking-wider text-text-soft">UCU CHAPTER</div>
          </div>
        </div>
        <p className="mt-2 text-[10px] tracking-[0.2em] text-text-muted">
          LEARN. BUILD. IMPACT.
        </p>
      </div>

      {/* Nav — single scrollable list containing every section */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCollapse}
              className={navLinkClass}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
              {badgeKey[item.to] && (
                <Badge count={counts[badgeKey[item.to]]} />
              )}
            </NavLink>
          )
        })}
      </nav>

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
            <div className="truncate text-sm font-medium text-text">
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