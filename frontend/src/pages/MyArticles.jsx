import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import {
  FileText, Plus, X, Send, Trash2, Clock, Heart, MessageCircle,
  CheckCircle, XCircle, Eye, Upload,
} from 'lucide-react'

const statusConfig = {
  Draft: { color: 'bg-text-muted/20 text-text-muted', icon: FileText },
  Submitted: { color: 'bg-amber/20 text-amber', icon: Clock },
  Approved: { color: 'bg-positive/20 text-positive', icon: CheckCircle },
  Rejected: { color: 'bg-danger/20 text-danger', icon: XCircle },
  Published: { color: 'bg-accent-2/20 text-accent-2', icon: Eye },
}

export default function MyArticles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', summary: '', category: '', tags: '' })
  const [file, setFile] = useState(null)
  const [cover, setCover] = useState(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => {
    api.articles.mine().then((d) => setArticles(d.articles || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title) { setError('Title is required.'); return }
    if (!file) { setError('Article file is required.'); return }

    setCreating(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('summary', form.summary)
      fd.append('category', form.category)
      fd.append('tags', form.tags)
      fd.append('file', file)
      if (cover) fd.append('cover', cover)

      await api.articles.create(fd)
      setForm({ title: '', summary: '', category: '', tags: '' })
      setFile(null)
      setCover(null)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const submitForReview = async (id) => {
    if (!confirm('Submit this article for review? You won\'t be able to edit it after submission.')) return
    await api.articles.submit(id)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this article? This cannot be undone.')) return
    await api.articles.remove(id)
    load()
  }

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Articles</h1>
          <p className="text-sm text-text-muted">Upload, submit, and track your articles.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/articles" className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-soft hover:bg-card-2">
            Browse All
          </Link>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Upload Article
          </button>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-muted">No articles yet. Upload your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => {
            const st = statusConfig[a.status] || statusConfig.Draft
            const StatusIcon = st.icon
            return (
              <div key={a.article_id} className="card flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card-2">
                  {a.cover_image ? (
                    <img src={a.cover_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">{a.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${st.color}`}>
                      <StatusIcon className="h-3 w-3" /> {a.status}
                    </span>
                    {a.category && <span>{a.category}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.reading_time} min</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {a.like_count}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {a.comment_count}</span>
                  </div>
                  {a.status === 'Rejected' && a.review_note && (
                    <p className="mt-1 text-xs text-danger">Reviewer: {a.review_note}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {a.status === 'Draft' && (
                    <>
                      <button onClick={() => submitForReview(a.article_id)}
                        className="flex items-center gap-1.5 rounded-lg bg-positive/20 px-3 py-1.5 text-xs font-semibold text-positive hover:bg-positive/30">
                        <Send className="h-3.5 w-3.5" /> Submit
                      </button>
                      <button onClick={() => remove(a.article_id)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-danger/20 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {a.status === 'Published' && (
                    <Link to="/articles" className="rounded-lg bg-card-2 px-3 py-1.5 text-xs text-text-soft hover:bg-border">
                      View
                    </Link>
                  )}
                  {(a.status === 'Submitted' || a.status === 'Approved' || a.status === 'Rejected') && (
                    <button onClick={() => remove(a.article_id)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-danger/20 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Upload Article" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>
            )}
            <input required placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <textarea placeholder="Summary" value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <input placeholder="Category (e.g. ML, Data Viz, Career)" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            <input placeholder="Tags (comma-separated)" value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />

            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
                <Upload className="h-3.5 w-3.5" /> Article file (PDF, DOCX, MD)
              </span>
              <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.docx,.doc,.md,.txt"
                className="w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-card-2 file:px-3 file:py-2 file:text-sm file:text-text-soft" />
            </label>

            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs text-text-muted">
                <Upload className="h-3.5 w-3.5" /> Cover image (optional)
              </span>
              <input type="file" onChange={(e) => setCover(e.target.files?.[0] || null)}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                className="w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-card-2 file:px-3 file:py-2 file:text-sm file:text-text-soft" />
            </label>

            <button type="submit" disabled={creating}
              className="w-full rounded-lg bg-gradient-accent py-2 text-sm font-semibold text-white disabled:opacity-50">
              {creating ? 'Uploading…' : 'Upload as Draft'}
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
      <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}