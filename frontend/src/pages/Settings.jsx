import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { User, Lock, GitBranch, Bell, Palette, LogOut, SlidersHorizontal } from 'lucide-react'

export default function Settings() {
  const { logout, refreshUser, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [pwd, setPwd] = useState({ current_password: '', new_password: '' })
  const [sysSettings, setSysSettings] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.members.me().then((d) => {
      setProfile({
        first_name: d.member.first_name || '',
        last_name: d.member.last_name || '',
        gender: d.member.gender || '',
        phone: d.member.phone || '',
        course: d.member.course || '',
        year_of_study: d.member.year_of_study || '',
        github_handle: d.member.github_handle || '',
        bio: d.member.bio || '',
        notify_email: d.member.notify_email !== false,
        notify_inapp: d.member.notify_inapp !== false,
        theme: d.member.theme || 'light',
      })
      setLoading(false)
    })
    if (isAdmin) {
      api.systemSettings.get().then((d) => setSysSettings(d.settings || {})).catch(() => setSysSettings({}))
    }
  }, [isAdmin])

  // keep local theme in sync with the saved member preference on load
  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) {
      // only sync if user hasn't explicitly chosen in this session
      if (!localStorage.getItem('theme')) setTheme(profile.theme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme])

  if (loading) return <Spinner className="py-20" />

  const saveProfile = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    try {
      await api.members.updateMe(profile)
      await refreshUser()
      setMsg('Profile updated.')
    } catch (err) { setError(err.message) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    try {
      await api.members.changePassword(pwd)
      setPwd({ current_password: '', new_password: '' })
      setMsg('Password changed.')
    } catch (err) { setError(err.message) }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const saveSysSettings = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    try {
      await api.systemSettings.update(sysSettings)
      setMsg('System settings updated.')
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-xl font-bold text-text">
        {isAdmin ? 'Admin Settings' : 'Settings'}
      </h1>

      {msg && <div className="rounded-lg border border-positive/30 bg-positive-soft px-4 py-2 text-sm text-positive">{msg}</div>}
      {error && <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger">{error}</div>}

      {/* System settings — Admin only */}
      {isAdmin && sysSettings && (
        <Section icon={SlidersHorizontal} title="System Settings (Admin)">
          <form onSubmit={saveSysSettings} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['tier_rookie_min', 'Rookie min score'],
                ['tier_rising_star_min', 'Rising Star min score'],
                ['tier_bronze_min', 'Bronze min score'],
                ['tier_silver_min', 'Silver min score'],
                ['tier_gold_min', 'Gold min score'],
                ['tier_diamond_min', 'Diamond min score'],
                ['github_weight', 'GitHub weight'],
                ['attendance_weight', 'Attendance weight'],
                ['late_grace_minutes', 'Late grace (min)'],
              ].map(([key, label]) => (
                <Field key={key} label={key.endsWith('_weight') ? label : label} type="number" step="any"
                  value={sysSettings[key] ?? ''}
                  onChange={(v) => setSysSettings({ ...sysSettings, [key]: v })} />
              ))}
            </div>
            <p className="text-xs text-text-muted">
              Tier thresholds and scoring weights apply across leaderboards, progress pages, and analytics.
              "Late grace" is how many minutes after a meeting's start time a QR check-in still counts as Present (after that, Late).
            </p>
            <button type="submit"
              className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
              Save System Settings
            </button>
          </form>
        </Section>
      )}

      {/* Profile */}
      <Section icon={User} title="Profile">
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" value={profile.first_name}
              onChange={(v) => setProfile({ ...profile, first_name: v })} />
            <Field label="Last name" value={profile.last_name}
              onChange={(v) => setProfile({ ...profile, last_name: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Gender" value={profile.gender}
              options={['', 'Male', 'Female', 'Other']}
              onChange={(v) => setProfile({ ...profile, gender: v })} />
            <Field label="Phone" value={profile.phone}
              onChange={(v) => setProfile({ ...profile, phone: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course" value={profile.course}
              onChange={(v) => setProfile({ ...profile, course: v })} />
            <Field label="Year of study" type="number" value={profile.year_of_study}
              onChange={(v) => setProfile({ ...profile, year_of_study: v })} />
          </div>
          <textarea placeholder="Bio" value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
          <button type="submit"
            className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            Save Profile
          </button>
        </form>
      </Section>

      {/* Password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={changePassword} className="space-y-3">
          <Field label="Current password" type="password" value={pwd.current_password}
            onChange={(v) => setPwd({ ...pwd, current_password: v })} />
          <Field label="New password" type="password" value={pwd.new_password}
            onChange={(v) => setPwd({ ...pwd, new_password: v })} />
          <button type="submit"
            className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            Change Password
          </button>
        </form>
      </Section>

      {/* GitHub */}
      <Section icon={GitBranch} title="GitHub Integration">
        <form onSubmit={saveProfile} className="space-y-3">
          <Field label="GitHub profile link or username" value={profile.github_handle}
            onChange={(v) => setProfile({ ...profile, github_handle: v })}
            placeholder="e.g. https://github.com/octocat or octocat" />
          <p className="text-xs text-text-muted">
            Paste your GitHub profile link or username. Linking enables contribution
            tracking for your progress and leaderboard score.
          </p>
          <button type="submit"
            className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            Save GitHub Link
          </button>
        </form>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notification Preferences">
        <form onSubmit={saveProfile} className="space-y-3">
          <label className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm text-text-soft">Email notifications</span>
            <input type="checkbox" checked={profile.notify_email}
              onChange={(e) => setProfile({ ...profile, notify_email: e.target.checked })}
              className="h-4 w-4 accent-accent" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm text-text-soft">In-app notifications</span>
            <input type="checkbox" checked={profile.notify_inapp}
              onChange={(e) => setProfile({ ...profile, notify_inapp: e.target.checked })}
              className="h-4 w-4 accent-accent" />
          </label>
          <button type="submit"
            className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            Save Preferences
          </button>
        </form>
      </Section>

      {/* Theme */}
      <Section icon={Palette} title="Theme">
        <div className="flex gap-3">
          {['light', 'dark'].map((t) => (
            <button key={t} onClick={() => { setTheme(t); setProfile((p) => ({ ...p, theme: t })) }}
              className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                theme === t ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted'
              }`}>
              {t}
            </button>
          ))}
          <button onClick={saveProfile}
            className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            Apply
          </button>
        </div>
      </Section>

      {/* Logout */}
      <Section icon={LogOut} title="Session">
        <button onClick={handleLogout}
          className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger">
          Log out
        </button>
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-soft">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', step, placeholder = '' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-text-muted">{label}</span>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
    </label>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
        {options.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </label>
  )
}