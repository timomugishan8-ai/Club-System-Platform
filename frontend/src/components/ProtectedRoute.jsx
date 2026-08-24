import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-text-muted animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user?.role_name)) {
    return <Navigate to="/" replace />
  }

  return children
}