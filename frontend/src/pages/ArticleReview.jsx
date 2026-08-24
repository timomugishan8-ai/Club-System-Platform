import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import {
  FileText, CheckCircle, XCircle, Eye, Clock,
} from 'lucide-react'

export default function ArticleReview() {
  const { isAdmin, isLeader } = useAuth()
  const canReview = isAdmin || isLeader
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => {
    api.articles.submitted().then((d) => setArticles(d.articles || [])).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (canReview) load()
  }, [canReview])

  const review = async (id, status) => {
    setReviewing(id)
    setMsg('')
    try {
      await api.articles.review(id, { status, review_note: reviewNote })
      setArticles((p) => p.filter((a) => a.article_id !== id))
      setReviewNote('')
      setMsg(`Article ${status.toLowerCase()}.`)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setReviewing(null)
    }
  }

  if (!canReview) return <p className="py-10 text-center text-text-muted">Admin or Leader access required.</p>
  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Article Review Queue</h1>
        <p className="text-sm text-text-muted">Review articles submitted by members.</p>
      </div>

      {msg && (
        <div className="rounded-lg border border-positive/30 bg-positive-soft px-4 py-2 text-sm text-positive">{msg}</div>
      )}

      {articles.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-muted">No articles awaiting review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.article_id} className="card p-5">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card-2">
                  {a.cover_image ? (
                    <img src={a.cover_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-6 w-6 text-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  {a.summary && <p className="mt-0.5 line-clamp-2 text-sm text-text-muted">{a.summary}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-card-2 text-[9px] font-semibold text-accent">
                        {a.author_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      {a.author_name}
                    </span>
                    {a.category && <span className="rounded-full bg-card-2 px-2 py-0.5">{a.category}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.reading_time} min</span>
                    <span>Submitted {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <a href={a.file_path} download target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-card-2">
                  <Eye className="h-3.5 w-3.5" /> Download & Review
                </a>
                <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Review note (optional)..."
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none" />
                <button onClick={() => review(a.article_id, 'Published')}
                  disabled={reviewing === a.article_id}
                  className="flex items-center gap-1.5 rounded-lg bg-positive/20 px-3 py-1.5 text-xs font-semibold text-positive hover:bg-positive/30 disabled:opacity-50">
                  <CheckCircle className="h-3.5 w-3.5" /> Publish
                </button>
                <button onClick={() => review(a.article_id, 'Rejected')}
                  disabled={reviewing === a.article_id}
                  className="flex items-center gap-1.5 rounded-lg bg-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/30 disabled:opacity-50">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}