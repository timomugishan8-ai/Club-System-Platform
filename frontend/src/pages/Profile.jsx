import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { Mail, Phone, BookOpen, GitBranch, Calendar, User, RefreshCw, Camera, Trash2, Loader2 } from 'lucide-react'

export default function Profile() {
  const { id } = useParams()
  const { user, refreshUser } = useAuth()
  const targetId = id || user?.member_id
  const isMe = String(targetId) === String(user?.member_id)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editHandle, setEditHandle] = useState(false)
  const [handle, setHandle] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const load = () => {
    api.members.getById(targetId).then((d) => {
      setMember(d.member)
      setHandle(d.member.github_handle || '')
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!targetId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId])

  const refreshStats = async () => {
    setRefreshing(true); setMsg(''); setError('')
    try {
      await api.github.refreshMy()
      setMsg('GitHub stats refreshed.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const saveHandle = async (e) => {
    e.preventDefault()
    setMsg(''); setError('')
    try {
      const value = handle.trim()
      // Send bare handles as-is; normalize pasted profile URLs to a handle
      // client-side so the stored value is always a clean handle.
      const urlMatch = value.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/?#\s]+)/i)
      const handleValue = value ? (urlMatch ? urlMatch[1].replace(/^@/, '') : value.replace(/^@/, '')) : null
      await api.members.updateMe({ github_handle: handleValue || null })
      await refreshStats()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const onPickPhoto = () => fileInputRef.current?.click()

  const onPhotoSelected = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, GIF, or WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.')
      return
    }
    setUploading(true); setMsg(''); setError('')
    const formData = new FormData()
    formData.append('avatar', file)
    api.members
      .uploadAvatar(formData)
      .then(async (d) => {
        setMember((m) => ({ ...m, avatar_url: d.avatar_url }))
        await refreshUser()
        setMsg('Profile picture updated.')
      })
      .catch((err) => setError(err.message))
      .finally(() => setUploading(false))
  }

  const removePhoto = () => {
    setUploading(true); setMsg(''); setError('')
    api.members
      .removeAvatar()
      .then(async () => {
        setMember((m) => ({ ...m, avatar_url: null }))
        await refreshUser()
        setMsg('Profile picture removed.')
      })
      .catch((err) => setError(err.message))
      .finally(() => setUploading(false))
  }

  if (loading) return <Spinner className="py-20" />
  if (!member) return <p className="py-10 text-center text-text-muted">Member not found.</p>

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-card-2 text-2xl font-bold text-accent">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                `${member.first_name?.[0]}${member.last_name?.[0]}`
              )}
            </div>
            {isMe && (
              <>
                <button
                  onClick={onPickPhoto}
                  disabled={uploading}
                  title={member.avatar_url ? 'Change profile picture' : 'Add profile picture'}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-accent text-white shadow-md transition-transform hover:scale-105 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPhotoSelected}
                  className="hidden"
                />
                {member.avatar_url && (
                  <button
                    onClick={removePhoto}
                    disabled={uploading}
                    title="Remove profile picture"
                    className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-text-muted shadow-md hover:text-danger disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-text">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-sm text-text-muted">{member.role_name}</p>
            {member.committee_name && (
              <span className="mt-1 inline-block rounded-full bg-card-2 px-2 py-0.5 text-xs text-text-soft">
                {member.committee_name}
              </span>
            )}
          </div>
          {isMe && (
            <div className="flex flex-shrink-0 flex-col gap-2">
              <button onClick={refreshStats} disabled={refreshing || !member.github_handle}
                title={!member.github_handle ? 'Link your GitHub handle first' : 'Fetch latest GitHub stats'}
                className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing…' : 'Refresh GitHub Stats'}
              </button>
              <button onClick={() => { setEditHandle(true); setHandle(member.github_handle ? `https://github.com/${member.github_handle}` : ''); setMsg(''); setError('') }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-soft hover:bg-card-2">
                {member.github_handle ? 'Change GitHub Link' : 'Link GitHub Account'}
              </button>
            </div>
          )}
        </div>
      </div>

      {msg && <div className="rounded-lg border border-positive/30 bg-positive-soft px-4 py-2 text-sm text-positive">{msg}</div>}
      {error && <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger">{error}</div>}

      {/* Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailCard icon={Mail} label="Email" value={member.email} />
        <DetailCard icon={Phone} label="Phone" value={member.phone || '—'} />
        <DetailCard icon={BookOpen} label="Course" value={member.course || '—'} />
        <DetailCard icon={User} label="Student No." value={member.student_number || '—'} />
        <DetailCard icon={GitBranch} label="GitHub"
          value={member.github_handle ? `@${member.github_handle}` : 'Not linked'}
          href={member.github_handle ? `https://github.com/${member.github_handle}` : null} />
        <DetailCard icon={Calendar} label="Joined" value={member.join_date || '—'} />
      </div>

      {/* GitHub link editor */}
      {isMe && editHandle && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-soft">GitHub Account</h3>
          <form onSubmit={saveHandle} className="space-y-3">
            <input value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Profile URL or handle, e.g. https://github.com/octocat"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <p className="text-xs text-text-muted">
              Paste your GitHub profile link (https://github.com/username) or just your username.
              Saving also triggers a stats refresh for the heatmap.
            </p>
            <div className="flex gap-2">
              <button type="submit"
                className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
                Save &amp; Sync
              </button>
              <button type="button" onClick={() => setEditHandle(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-soft hover:bg-card">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {member.bio && (
        <div className="card p-5">
          <h3 className="mb-2 text-sm font-semibold text-text-soft">Bio</h3>
          <p className="text-sm text-text-muted">{member.bio}</p>
        </div>
      )}
    </div>
  )
}

function DetailCard({ icon: Icon, label, value, href }) {
  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card-2">
        <Icon className="h-5 w-5 text-text-muted" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-muted">{label}</div>
        <div className="truncate text-sm text-text">{value}</div>
      </div>
    </>
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer"
        title="Open GitHub profile"
        className="card flex items-center gap-3 p-4 transition-colors hover:border-accent">
        {content}
      </a>
    )
  }
  return (
    <div className="card flex items-center gap-3 p-4">
      {content}
    </div>
  )
}