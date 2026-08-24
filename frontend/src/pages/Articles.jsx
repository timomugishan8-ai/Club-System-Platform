import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import Spinner from '../components/Spinner'
import {
  FileText, Clock, Heart, MessageCircle, ChevronLeft,
  Download, Send, Trash2, Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    api.articles.published().then((d) => setArticles(d.articles || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-20" />

  if (selectedId) {
    return <ArticleReader articleId={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Articles</h1>
        <p className="text-sm text-text-muted">Read articles published by chapter members.</p>
      </div>

      <div className="flex gap-2">
        <Link to="/articles/mine" className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-soft hover:bg-card-2">
          My Articles
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-muted">No published articles yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <button
              key={a.article_id}
              onClick={() => setSelectedId(a.article_id)}
              className="card overflow-hidden text-left transition-transform hover:scale-[1.02]"
            >
              {a.cover_image ? (
                <img src={a.cover_image} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-card-2 to-bg-soft">
                  <FileText className="h-12 w-12 text-text-muted" />
                </div>
              )}
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  {a.category && (
                    <span className="rounded-full bg-accent-2/20 px-2 py-0.5 text-[11px] text-accent-2">
                      {a.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-text-muted">
                    <Clock className="h-3 w-3" /> {a.reading_time} min
                  </span>
                </div>
                <h3 className="line-clamp-2 font-semibold text-white">{a.title}</h3>
                {a.summary && <p className="mt-1 line-clamp-2 text-sm text-text-muted">{a.summary}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-card-2 text-[10px] font-semibold text-accent">
                      {a.author_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-xs text-text-muted">{a.author_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {a.like_count}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {a.comment_count}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleReader({ articleId, onBack }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const load = () => {
    api.articles.get(articleId).then((d) => {
      setData(d)
      setComments(d.comments || [])
      setLiked(d.liked || false)
      setLikeCount(d.article ? (d.article.like_count || 0) : 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [articleId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLike = async () => {
    const res = await api.articles.like(articleId)
    setLiked(res.liked)
    setLikeCount((c) => res.liked ? c + 1 : c - 1)
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    await api.articles.addComment(articleId, commentText.trim())
    setCommentText('')
    load()
  }

  const deleteComment = async (commentId) => {
    await api.articles.deleteComment(articleId, commentId)
    load()
  }

  if (loading) return <Spinner className="py-20" />
  if (!data || !data.article) return <p className="py-10 text-center text-text-muted">Article not found.</p>

  const a = data.article

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-soft">
        <ChevronLeft className="h-4 w-4" /> Back to articles
      </button>

      <div className="card overflow-hidden">
        {a.cover_image && (
          <img src={a.cover_image} alt="" className="h-56 w-full object-cover" />
        )}
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {a.category && (
              <span className="rounded-full bg-accent-2/20 px-2 py-0.5 text-xs text-accent-2">{a.category}</span>
            )}
            {data.tags?.map((t) => (
              <span key={t} className="rounded-full bg-card-2 px-2 py-0.5 text-xs text-text-muted">#{t}</span>
            ))}
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="h-3 w-3" /> {a.reading_time} min read
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white">{a.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card-2 text-sm font-semibold text-accent">
              {a.author_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="text-sm text-white">{a.author_name}</div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar className="h-3 w-3" /> {a.published_at ? new Date(a.published_at).toLocaleDateString() : ''}
              </div>
            </div>
          </div>

          {a.summary && <p className="mt-4 text-sm text-text-soft">{a.summary}</p>}

          <a href={a.file_path} download
            className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-gradient-accent py-2.5 text-sm font-semibold text-white">
            <Download className="h-4 w-4" /> Download Article ({a.file_type?.toUpperCase()})
          </a>
        </div>
      </div>

      {/* Like + comments */}
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-4 border-b border-border pb-4">
          <button onClick={toggleLike}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              liked ? 'bg-danger/20 text-danger' : 'text-text-muted hover:bg-card-2'
            }`}>
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <MessageCircle className="h-4 w-4" /> {comments.length} Comments
          </div>
        </div>

        <form onSubmit={submitComment} className="mb-4 flex gap-2">
          <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none" />
          <button type="submit" className="rounded-lg bg-gradient-accent px-3 py-2 text-white">
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.comment_id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-card-2 text-xs font-semibold text-accent">
                {c.first_name?.[0]}{c.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {c.first_name} {c.last_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{new Date(c.created_at).toLocaleDateString()}</span>
                    {c.member_id === user?.member_id && (
                      <button onClick={() => deleteComment(c.comment_id)}
                        className="text-text-muted hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-sm text-text-soft">{c.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="py-4 text-center text-sm text-text-muted">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  )
}