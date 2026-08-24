import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { Check, X, UserCheck, Clock, Mail, BookOpen, Hash } from 'lucide-react'

export default function AdminPending() {
  const { isAdmin } = useAuth()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => {
    api.admin.pending().then((d) => setPending(d.pending || [])).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  const approve = async (id) => {
    setActing(id); setMsg('')
    try {
      await api.admin.approve(id)
      setPending((p) => p.filter((m) => m.member_id !== id))
      setMsg('Member approved. They can now log in.')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setActing(null)
    }
  }

  const reject = async (id) => {
    setActing(id); setMsg('')
    try {
      await api.admin.reject(id)
      setPending((p) => p.filter((m) => m.member_id !== id))
      setMsg('Member rejected.')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setActing(null)
    }
  }

  if (!isAdmin) {
    return <p className="py-10 text-center text-text-muted">Admin access required.</p>
  }
  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pending Approvals</h1>
          <p className="text-sm text-text-muted">Review and approve new member signups.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card-2 px-3 py-1.5 text-sm text-text-soft">
          <Clock className="h-4 w-4" />
          {pending.length} pending
        </div>
      </div>

      {msg && (
        <div className="rounded-lg border border-positive/30 bg-positive-soft px-4 py-2 text-sm text-positive">
          {msg}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="card p-10 text-center">
          <UserCheck className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-muted">No pending approvals. Everyone is up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pending.map((m) => (
            <div key={m.member_id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-card-2 text-lg font-bold text-accent">
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">
                    {m.first_name} {m.last_name}
                  </h3>
                  <p className="text-xs text-text-muted">
                    Requested {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[11px] text-amber">
                  Pending
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <Detail icon={Mail} value={m.email} />
                {m.student_number && <Detail icon={Hash} value={m.student_number} />}
                {m.course && <Detail icon={BookOpen} value={`${m.course}${m.year_of_study ? ` · Year ${m.year_of_study}` : ''}`} />}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => approve(m.member_id)}
                  disabled={acting === m.member_id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-positive/20 py-2 text-sm font-semibold text-positive transition-colors hover:bg-positive/30 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => reject(m.member_id)}
                  disabled={acting === m.member_id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-danger/20 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/30 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Detail({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-2 text-text-muted">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  )
}