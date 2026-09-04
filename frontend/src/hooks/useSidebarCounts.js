import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const POLL_MS = 30000

/**
 * Fetches per-section badge counts for the sidebar and polls for updates.
 * Counts are cleared per section once the user visits that section.
 */
export default function useSidebarCounts() {
  const { user } = useAuth()
  const location = useLocation()
  const [counts, setCounts] = useState({})
  const visitedRef = useRef({})

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.sidebarCounts.get()
      setCounts(data.counts || {})
    } catch {
      // Non-critical: ignore polling errors (e.g. expired session)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setCounts({})
      return undefined
    }
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [user, refresh])

  // Mark sections as visited when navigated to, so their badge clears.
  useEffect(() => {
    if (!user) return
    const path = location.pathname
    const mark = (key) => {
      if (key && counts[key]) {
        visitedRef.current[key] = true
        setCounts((prev) => (prev[key] ? { ...prev, [key]: 0 } : prev))
      }
    }

    if (path === '/meetings') mark('meetings')
    else if (path === '/announcements') mark('announcements')
    else if (path === '/events') mark('events')
    else if (path === '/projects') mark('projects')
    else if (path === '/admin/pending') mark('pending')
    else if (path === '/admin/articles') mark('admin/articles')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user])

  return { counts, refresh }
}