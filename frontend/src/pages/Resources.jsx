import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { Database, Plus, X, ExternalLink, Download } from 'lucide-react'

const catIcons = {
  Dataset: Database,
  Tutorial: Database,
  Article: Database,
  Tool: Database,
  Other: Database,
}

const diffColors = {
  Beginner: 'bg-positive/20 text-positive',
  Intermediate: 'bg-amber/20 text-amber',
  Advanced: 'bg-danger/20 text-danger',
}

export default function Resources() {
  const { isAdmin, isLeader } = useAuth()
  const canCreate = isAdmin || isLeader
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Dataset', difficulty: 'Beginner', link_url: '' })

  const load = () => {
    api.resources.list().then((d) => setItems(d.resources || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const fileInput = document.getElementById('file-upload')
    if (fileInput?.files?.[0]) fd.append('file', fileInput.files[0])
    await api.resources.create(fd)
    setForm({ title: '', description: '', category: 'Dataset', difficulty: 'Beginner', link_url: '' })
    setShowForm(false)
    load()
  }

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Resources</h1>
        {canCreate && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Add Resource
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => {
          const Icon = catIcons[r.category] || Database
          return (
            <div key={r.resource_id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-3/20">
                  <Icon className="h-5 w-5 text-accent-3" />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${diffColors[r.difficulty] || diffColors.Beginner}`}>
                  {r.difficulty}
                </span>
              </div>
              <h3 className="font-semibold text-white">{r.title}</h3>
              <p className="mt-1 text-sm text-text-muted line-clamp-2">{r.description || 'No description.'}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="rounded-full bg-card-2 px-2 py-0.5 text-xs text-text-muted">{r.category}</span>
                {r.link_url && (
                  <a href={r.link_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-accent hover:underline">
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {r.file_path && (
                  <a href={r.file_path} download
                    className="flex items-center gap-1 text-xs text-accent hover:underline">
                    Download <Download className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="col-span-full py-10 text-center text-text-muted">No resources yet.</p>
        )}
      </div>

      {showForm && (
        <Modal title="Add Resource" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
                <option>Dataset</option><option>Tutorial</option><option>Article</option><option>Tool</option><option>Other</option>
              </select>
              <select value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none">
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <input placeholder="Link URL (or upload a file below)" value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <input id="file-upload" type="file"
              className="w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-card-2 file:px-3 file:py-2 file:text-sm file:text-text-soft" />
            <button type="submit"
              className="w-full rounded-lg bg-gradient-accent py-2 text-sm font-semibold text-white">
              Add
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
          <h2 className="font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}