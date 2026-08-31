import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { FolderGit2, Plus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Projects() {
  const { isAdmin, isLeader } = useAuth()
  const canCreate = isAdmin || isLeader
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', repo_url: '', status: 'Planning' })

  const load = () => {
    api.projects.list().then((d) => setProjects(d.projects || [])).finally(() => setLoading(false))
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Projects</h1>
        {canCreate && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="py-10 text-center text-text-muted">No projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.project_id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-2/20">
                  <FolderGit2 className="h-5 w-5 text-accent-2" />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[p.status] || statusColors.Planning}`}>
                  {p.status}
                </span>
              </div>
              <h3 className="font-semibold text-text">{p.title}</h3>
              <p className="mt-1 text-sm text-text-muted line-clamp-2">{p.description || 'No description.'}</p>
              {p.repo_url && (
                <a href={p.repo_url} target="_blank" rel="noreferrer"
                  className="mt-3 inline-block text-xs text-accent hover:underline">
                  View Repository ↗
                </a>
              )}
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