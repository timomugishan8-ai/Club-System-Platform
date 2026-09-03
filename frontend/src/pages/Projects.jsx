import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { FolderGit2, Plus, X, GitBranch, Star, GitFork, ExternalLink, MessageSquare, Send, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Projects() {
  const { isAdmin, isLeader, user } = useAuth()
  const canCreate = isLeader // Admin is a reviewer, not a creator
  const canComment = isAdmin || isLeader
  const [memberEntries, setMemberEntries] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', repo_url: '', status: 'Planning' })
  const [openComments, setOpenComments] = useState(null) // project id
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    // One call returns every approved member with their GitHub repos (cached
    // at stats refresh) and club project assignments (assigned or created).
    api.projects.overviewByMember()
      .then((d) => setMemberEntries(d.members || []))
      .catch(() => setMemberEntries([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.projects.create(form)
    setForm({ title: '', description: '', repo_url: '', status: 'Planning' })
    setShowForm(false)
    load()
  }

  if (loading) return <Spinner className="py-20" />

  const statusColors = {
    Planning: 'bg-accent-3/20 text-accent-3',
    'In Progress': 'bg-accent-2/20 text-accent-2',
    Completed: 'bg-positive/20 text-positive',
    Archived: 'bg-text-muted/20 text-text-muted',
  }

  // Unified per-member items: GitHub repos + club project assignments.
  // Own entry first, others alphabetical.
  const entries = (memberEntries || [])
    .map((m) => ({
      ...m,
      items: [
        ...(m.repositories || []).map((r) => ({
          kind: 'repo',
          id: `repo-${r.github_repo_id}`,
          title: r.name,
          url: r.html_url,
          language: r.language,
          star_count: r.star_count,
          fork_count: r.fork_count,
          is_fork: !!r.is_fork,
          pushed_at: r.pushed_at,
        })),
        ...(m.projects || []).map((p) => ({
          kind: 'project',
          id: `p-${p.project_id}`,
          project_id: p.project_id,
          title: p.title,
          url: p.repo_url || null,
          status: p.status,
          role: p.role,
          description: p.description,
        })),
      ],
    }))
    .sort((a, b) => {
      if (a.member_id === user?.member_id) return -1
      if (b.member_id === user?.member_id) return 1
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    })

  const toggleComments = (projectId) => {
    if (openComments === projectId) { setOpenComments(null); setComments([]); return }
    setOpenComments(projectId)
    setComments([])
    api.projects.comments(projectId).then((d) => setComments(d.comments || [])).catch(() => setComments([]))
  }

  const submitComment = async (projectId) => {
    if (!commentText.trim()) return
    try {
      const d = await api.projects.addComment(projectId, commentText.trim())
      setComments(d.comments || [])
      setCommentText('')
    } catch (err) {
      setError(err.message)
    }
  }

  const removeComment = async (projectId, commentId) => {
    try {
      await api.projects.deleteComment(projectId, commentId)
      setComments((c) => c.filter((x) => x.comment_id !== commentId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">GitHub Projects</h1>
        {canCreate && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {/* GitHub Projects by each member (repos + club assignments merged) */}
      {entries.length === 0 ? (
        <p className="py-10 text-center text-text-muted">
          No GitHub projects yet — members' repositories appear here once they link their account and refresh stats.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((m) => (
            <div key={m.member_id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card-2 text-sm font-semibold text-accent">
                    {`${m.first_name} ${m.last_name}`.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-text">{m.first_name} {m.last_name}</div>
                    <div className="text-xs text-text-muted">
                      {m.items.length} item{m.items.length !== 1 ? 's' : ''}
                      {m.github_handle && <> · <a href={`https://github.com/${m.github_handle}`} target="_blank" rel="noreferrer"
                        className="text-accent hover:underline">@{m.github_handle}</a></>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
                {m.items.map((item) => (
                  <div key={item.id}
                    className="rounded-lg bg-card-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.kind === 'repo'
                            ? <GitBranch className="h-3.5 w-3.5 shrink-0 text-accent" />
                            : <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-accent-2" />}
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noreferrer"
                              title={`Open ${item.title}`}
                              className="truncate text-sm font-medium text-accent hover:underline">
                              {item.title}
                            </a>
                          ) : (
                            <span className="truncate text-sm font-medium text-text">{item.title}</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                          <span className={`rounded-full px-1.5 py-0.5 ${item.kind === 'repo' ? 'bg-accent-2/20 text-accent-2' : (statusColors[item.status] || statusColors.Planning)}`}>
                            {item.kind === 'repo' ? (item.is_fork ? 'Fork' : 'Repo') : item.status}
                          </span>
                          {item.language && (
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-accent-3" /> {item.language}
                            </span>
                          )}
                          {item.kind === 'repo' && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber" /> {item.star_count}</span>
                          )}
                          {item.kind === 'repo' && (
                            <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> {item.fork_count}</span>
                          )}
                          {item.kind === 'repo' && item.pushed_at && (
                            <span>· pushed {new Date(item.pushed_at).toLocaleDateString()}</span>
                          )}
                          {item.kind === 'project' && item.url && (
                            <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-accent hover:underline">
                              repo <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Reviewer comments toggle (club projects only) */}
                      {item.kind === 'project' && canComment && (
                        <button
                          onClick={() => toggleComments(item.project_id)}
                          title="View / write feedback"
                          className={`shrink-0 rounded-lg p-1.5 ${
                            openComments === item.project_id ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-accent'
                          }`}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Comment thread */}
                    {item.kind === 'project' && canComment && openComments === item.project_id && (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        {comments.map((c) => (
                          <div key={c.comment_id} className="rounded-lg bg-card p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 text-xs">
                                <span className="font-semibold text-text-soft">
                                  {c.first_name} {c.last_name}
                                </span>
                                {c.role_name && <span className="text-text-muted"> · {c.role_name}</span>}
                                <span className="text-text-muted"> · {String(c.created_at).slice(0, 10)}</span>
                              </div>
                              {String(c.member_id) === String(user?.member_id) && (
                                <button onClick={() => removeComment(item.project_id, c.comment_id)}
                                  title="Delete comment"
                                  className="shrink-0 rounded p-1 text-text-muted hover:text-danger">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-text">{c.body}</p>
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <p className="text-xs text-text-muted">No feedback yet — add suggestions to help polish this project.</p>
                        )}
                        <div className="flex gap-2">
                          <input value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitComment(item.project_id) }}
                            placeholder="Write feedback for the member…"
                            className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none" />
                          <button onClick={() => submitComment(item.project_id)}
                            className="rounded-lg bg-gradient-accent px-3 py-1.5 text-sm font-semibold text-white">
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="New Project" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" rows={3} />
            <input placeholder="Repository URL" value={form.repo_url}
              onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <select value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
              <option>Planning</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Archived</option>
            </select>
            <button type="submit"
              className="w-full rounded-lg bg-gradient-accent py-2 text-sm font-semibold text-white">
              Create
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-text">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}