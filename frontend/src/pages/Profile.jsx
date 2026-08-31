import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { Mail, Phone, BookOpen, GitBranch, Calendar, User } from 'lucide-react'

export default function Profile() {
  const { id } = useParams()
  const { user } = useAuth()
  const targetId = id || user?.member_id
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetId) return
    api.members.getById(targetId).then((d) => setMember(d.member)).finally(() => setLoading(false))
  }, [targetId])

  if (loading) return <Spinner className="py-20" />
  if (!member) return <p className="py-10 text-center text-text-muted">Member not found.</p>

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-card-2 text-2xl font-bold text-accent">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              `${member.first_name?.[0]}${member.last_name?.[0]}`
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
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailCard icon={Mail} label="Email" value={member.email} />
        <DetailCard icon={Phone} label="Phone" value={member.phone || '—'} />
        <DetailCard icon={BookOpen} label="Course" value={member.course || '—'} />
        <DetailCard icon={User} label="Student No." value={member.student_number || '—'} />
        <DetailCard icon={GitBranch} label="GitHub" value={member.github_handle || 'Not linked'} />
        <DetailCard icon={Calendar} label="Joined" value={member.join_date || '—'} />
      </div>

      {member.bio && (
        <div className="card p-5">
          <h3 className="mb-2 text-sm font-semibold text-text-soft">Bio</h3>
          <p className="text-sm text-text-muted">{member.bio}</p>
        </div>
      )}
    </div>
  )
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card-2">
        <Icon className="h-5 w-5 text-text-muted" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-muted">{label}</div>
        <div className="truncate text-sm text-text">{value}</div>
      </div>
    </div>
  )
}