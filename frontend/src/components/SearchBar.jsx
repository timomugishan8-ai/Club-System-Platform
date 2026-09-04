import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, User, FolderGit2, CalendarDays, BookOpen, Megaphone, Database,
  FileText, Loader2, LayoutDashboard, TrendingUp, CalendarCheck, Trophy,
  ClipboardCheck, BarChart2, FileBarChart, Users, Settings, CornerDownLeft, UserCheck,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const GROUPS = [
  { key: 'members', label: 'Members', icon: User, route: (id) => `/profile/${id}` },
  { key: 'projects', label: 'Projects', icon: FolderGit2, route: () => '/projects' },
  { key: 'meetings', label: 'Meetings', icon: CalendarDays, route: () => '/meetings' },
  { key: 'events', label: 'Events', icon: BookOpen, route: () => '/events' },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, route: () => '/announcements' },
  { key: 'resources', label: 'Resources', icon: Database, route: () => '/resources' },
  { key: 'articles', label: 'Articles', icon: FileText, route: (id) => `/articles?article=${id}` },
]

// Pages/sections the user can jump to straight from the search bar
const SECTIONS = [
  { label: 'Dashboard', keywords: ['dashboard', 'home', 'overview'], icon: LayoutDashboard, route: '/' },
  { label: 'My Profile', keywords: ['profile', 'account', 'me'], icon: User, route: '/profile' },
  { label: 'My Progress', keywords: ['progress', 'points', 'tier'], icon: TrendingUp, route: '/progress' },
  { label: 'GitHub Projects', keywords: ['projects', 'github', 'repo', 'repositories'], icon: FolderGit2, route: '/projects' },
  { label: 'Attendance', keywords: ['attendance', 'present'], icon: CalendarCheck, route: '/attendance' },
  { label: 'Meetings', keywords: ['meetings'], icon: CalendarDays, route: '/meetings' },
  { label: 'Leaderboard', keywords: ['leaderboard', 'ranking', 'rank'], icon: Trophy, route: '/leaderboard' },
  { label: 'Announcements', keywords: ['announcements', 'news'], icon: Megaphone, route: '/announcements' },
  { label: 'Articles', keywords: ['articles', 'blog', 'posts'], icon: FileText, route: '/articles' },
  { label: 'Resources', keywords: ['resources', 'datasets', 'library'], icon: Database, route: '/resources' },
  { label: 'Events', keywords: ['events', 'workshops', 'hackathons', 'socials'], icon: BookOpen, route: '/events' },
  { label: 'Settings', keywords: ['settings', 'preferences', 'password'], icon: Settings, route: '/settings' },
  { label: 'Article Review', keywords: ['review', 'article review', 'submissions'], icon: ClipboardCheck, route: '/admin/articles', roles: ['Admin', 'Leader'] },
  { label: 'Pending Approvals', keywords: ['pending', 'approvals', 'requests'], icon: UserCheck, route: '/admin/pending', roles: ['Admin'] },
  { label: 'Chapter Members', keywords: ['members list', 'chapter members', 'manage members'], icon: Users, route: '/admin/members', roles: ['Admin'] },
  { label: 'Analytics', keywords: ['analytics', 'stats', 'statistics'], icon: BarChart2, route: '/admin/analytics', roles: ['Admin'] },
  { label: 'Semester Report', keywords: ['report', 'semester report', 'csv'], icon: FileBarChart, route: '/admin/reports', roles: ['Admin'] },
]

export default function SearchBar() {
  const navigate = useNavigate()
  const { isAdmin, isLeader } = useAuth()
  const [q, setQ] = useState('')
  const [results, setResults] = useState({})
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)
  const abortRef = useRef(null)

  // Sections matching the query (label + keywords), filtered by role
  const sections = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 2) return []
    return SECTIONS.filter(
      (s) =>
        (!s.roles ||
          (s.roles.includes('Admin') && isAdmin) ||
          (s.roles.includes('Leader') && isLeader)) &&
        (s.label.toLowerCase().includes(term) ||
          s.keywords.some((k) => k.includes(term) || term.includes(k)))
    )
  }, [q, isAdmin, isLeader])

  // Flatten grouped results + sections into one ordered list for keyboard navigation
  const flat = useMemo(
    () => [
      ...sections.map((s) => ({ type: 'section', ...s })),
      ...GROUPS.flatMap((g) =>
        (results[g.key] || []).map((r) => ({ type: 'result', ...r, group: g }))
      ),
    ],
    [sections, results]
  )

  // Debounced search
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults({})
      setLoading(false)
      return
    }

    setLoading(true)
    const t = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      api.search
        .query(term)
        .then((d) => {
          setResults(d.results || {})
          setActive(0)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(t)
  }, [q])

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (item) => {
    if (!item) return
    setOpen(false)
    setQ('')
    setResults({})
    navigate(item.type === 'section' ? item.route : item.group.route(item.id))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!open || flat.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(flat[active])
    }
  }

  const hasResults = flat.length > 0
  const showEmpty = open && q.trim().length >= 2 && !loading && !hasResults
  let idx = -1

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search members, projects, meetings..."
        className="w-full rounded-full border border-border bg-card py-2 pl-10 pr-10 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />
      )}

      {open && q.trim().length >= 2 && (hasResults || showEmpty) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
          {hasResults ? (
            <>
              {sections.length > 0 && (
                <div className="py-1">
                  <div className="flex items-center gap-2 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    <LayoutDashboard className="h-3 w-3" />
                    Go to
                  </div>
                  {sections.map((s) => {
                    idx++
                    const isActive = idx === active
                    const Icon = s.icon
                    return (
                      <button
                        key={`section-${s.route}`}
                        onClick={() => go(s)}
                        onMouseEnter={() => setActive(idx)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                          isActive ? 'bg-card-2' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-accent-2" />
                        <span className="flex-1 truncate text-sm font-medium text-text">
                          {s.label}
                        </span>
                        {isActive && <CornerDownLeft className="h-3 w-3 text-text-muted" />}
                      </button>
                    )
                  })}
                </div>
              )}
              {GROUPS.map((g) => {
                const items = results[g.key] || []
                if (items.length === 0) return null
                const Icon = g.icon
                return (
                  <div key={g.key} className="py-1">
                    <div className="flex items-center gap-2 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      <Icon className="h-3 w-3" />
                      {g.label}
                    </div>
                    {items.map((r) => {
                      idx++
                      const isActive = idx === active
                      return (
                        <button
                          key={`${g.key}-${r.id}`}
                          onClick={() => go({ ...r, group: g })}
                          onMouseEnter={() => setActive(idx)}
                          className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left ${
                            isActive ? 'bg-card-2' : ''
                          }`}
                        >
                          <span className="w-full truncate text-sm font-medium text-text">
                            {r.title}
                          </span>
                          {r.subtitle && (
                            <span className="w-full truncate text-xs text-text-muted">
                              {r.subtitle}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              No matches for &ldquo;{q.trim()}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}