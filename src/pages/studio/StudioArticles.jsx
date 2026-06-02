import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// TIER: admin (Joe only)

const LEVEL_COLOURS = {
  A1: 'bg-pink-900/40 text-pink-300',
  A2: 'bg-orange-900/40 text-orange-300',
  'A2+': 'bg-orange-900/40 text-orange-200',
  B1: 'bg-yellow-900/40 text-yellow-300',
  'B1+': 'bg-yellow-900/40 text-yellow-200',
  B2: 'bg-green-900/40 text-green-300',
  'B2+': 'bg-green-900/40 text-green-200',
  C1: 'bg-blue-900/40 text-blue-300',
  C2: 'bg-purple-900/40 text-purple-300',
}

const TIER_COLOURS = {
  advanced:   'bg-blue-900/40 text-blue-300',
  standard:   'bg-yellow-900/40 text-yellow-300',
  foundation: 'bg-orange-900/40 text-orange-300',
}

const TIER_ORDER = { foundation: 0, standard: 1, advanced: 2 }

export default function StudioArticles() {
  const navigate = useNavigate()
  const [articles,  setArticles]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all') // all | published | draft | tiered | standalone

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug, level, article_tier, topic_group_id, is_published, is_free, word_count, published_at, topic_tags, school_id')
      .is('school_id', null)  // public content only
      .order('created_at', { ascending: false })

    if (data) {
      // Group tiered siblings together
      const groups = {}
      const standalone = []
      for (const a of data) {
        if (a.topic_group_id) {
          if (!groups[a.topic_group_id]) groups[a.topic_group_id] = []
          groups[a.topic_group_id].push(a)
        } else {
          standalone.push(a)
        }
      }

      // For each group, show the advanced article as the representative row
      // but attach siblings for display
      const groupRows = Object.values(groups).map(siblings => {
        const sorted = [...siblings].sort((a, b) => (TIER_ORDER[a.article_tier] ?? 9) - (TIER_ORDER[b.article_tier] ?? 9))
        const face = sorted.find(a => a.article_tier === 'advanced') || sorted[sorted.length - 1]
        return { ...face, _siblings: sorted, _isGroup: true }
      })

      setArticles([...groupRows, ...standalone]
        .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0)))
    }
    setLoading(false)
  }

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all'        ? true :
      filter === 'published'  ? a.is_published :
      filter === 'draft'      ? !a.is_published :
      filter === 'tiered'     ? a._isGroup :
      filter === 'standalone' ? !a._isGroup :
      true
    return matchSearch && matchFilter
  })

  const counts = {
    all: articles.length,
    published: articles.filter(a => a.is_published).length,
    draft: articles.filter(a => !a.is_published).length,
    tiered: articles.filter(a => a._isGroup).length,
    standalone: articles.filter(a => !a._isGroup).length,
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            {counts.published} published · {counts.draft} drafts · {counts.tiered} tiered groups
          </p>
        </div>
        <a
          href="https://academy-dashboard-one.vercel.app/admin/articles"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>+</span> New article
          <span className="text-blue-300 text-xs ml-1">(opens editor)</span>
        </a>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-sm h-9 px-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
        />
        <div className="flex items-center gap-1">
          {[
            { key: 'all',        label: `All (${counts.all})` },
            { key: 'published',  label: `Published (${counts.published})` },
            { key: 'draft',      label: `Drafts (${counts.draft})` },
            { key: 'tiered',     label: `Tiered (${counts.tiered})` },
            { key: 'standalone', label: `Standalone (${counts.standalone})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-14 bg-gray-900 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          No articles found
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(a => (
            <ArticleRow key={a.id} article={a} onReload={load} />
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleRow({ article: a, onReload }) {
  const editorUrl = `https://academy-dashboard-one.vercel.app/admin/articles/${a.id}`

  return (
    <div className="group flex items-center gap-4 px-4 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors">

      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        a.is_published ? 'bg-green-500' : 'bg-gray-600'
      }`} title={a.is_published ? 'Published' : 'Draft'} />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{a.title}</p>
        {a._isGroup && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {(a._siblings || []).map(s => (
              <span key={s.id} className={`text-xs px-1.5 py-0.5 rounded font-medium ${TIER_COLOURS[s.article_tier] || 'bg-gray-800 text-gray-400'}`}>
                {s.article_tier === 'advanced' ? 'Adv' : s.article_tier === 'standard' ? 'Std' : 'Fnd'}
                {' '}{s.is_published ? '✓' : '·'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Level pill */}
      {a.level && (
        <span className={`text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0 ${LEVEL_COLOURS[a.level] || 'bg-gray-800 text-gray-400'}`}>
          {a.level}
        </span>
      )}

      {/* Topics */}
      <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
        {(a.topic_tags || []).slice(0, 2).map(t => (
          <span key={t} className="text-xs text-gray-600 capitalize">{t}</span>
        ))}
      </div>

      {/* Word count */}
      {a.word_count && (
        <span className="text-xs text-gray-600 flex-shrink-0 hidden lg:block">
          {a.word_count}w
        </span>
      )}

      {/* Free/subscriber */}
      <span className={`text-xs flex-shrink-0 ${a.is_free ? 'text-gray-600' : 'text-amber-500'}`}>
        {a.is_free ? 'Free' : 'Sub'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <a
          href={editorUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Edit →
        </a>
        {a.slug && (
          <a
            href={`/articles/${a.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            View →
          </a>
        )}
      </div>
    </div>
  )
}
