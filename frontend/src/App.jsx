import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Progress from './pages/Progress'
import Projects from './pages/Projects'
import Attendance from './pages/Attendance'
import Leaderboard from './pages/Leaderboard'
import Announcements from './pages/Announcements'
import Resources from './pages/Resources'
import Events from './pages/Events'
import Settings from './pages/Settings'
import AdminPending from './pages/AdminPending'
import Meetings from './pages/Meetings'
import Analytics from './pages/Analytics'
import Articles from './pages/Articles'
import MyArticles from './pages/MyArticles'
import ArticleReview from './pages/ArticleReview'
import Reports from './pages/Reports'
import AdminMembers from './pages/AdminMembers'
import CheckIn from './pages/CheckIn'
import QRDisplay from './pages/QRDisplay'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/check-in" element={<CheckIn />} />

          {/* Protected */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/events" element={<Events />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/mine" element={<MyArticles />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/admin/pending"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <AdminPending />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/members"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <AdminMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/articles"
              element={
                <ProtectedRoute roles={['Admin', 'Leader']}>
                  <ArticleReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings/:meetingId/qr"
              element={
                <ProtectedRoute roles={['Admin', 'Leader']}>
                  <QRDisplay />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}