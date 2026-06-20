import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageMeta from '../components/PageMeta'
import { cefrToDisplay, tierToDisplay, levelPillClass, DISPLAY_LEVEL_COLOURS, DISPLAY_TO_CEFR, LEVEL_FILTER_OPTIONS } from '../lib/levels'

const TOPIC_LABELS = {
  environment: 'Environment', business: 'Business',   travel:    'Travel',
  health:      'Health',      technology: 'Technology', culture:  'Culture',
  history:     'History',     sport:      'Sport',      food:     'Food',
  science:     'Science',     society:    'Society',    language: 'Language',
}

function readTime(wordCount) {
  return `${Math.max(1, Math.round((wordCount || 0) / 200))} min`
}

// ── Article card ──────────────────────────────────────────────────────────────

function LevelPill({ article: a }) {
  // Tiered article — show all three tiers as dots + "Easy · Medium · Advanced"
  if (a.tiers?.length > 1) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full border font-semibold bg-gray-100 text-gray-700 border-gray-200">
        Easy · Medium · Advanced
      </span>
    )
  }
  if (!a.level) return null
  const label = cefrToDisplay(a.level)
  if (!label) return null
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${levelPillClass(a.level)}`}>
      {label}
    </span>
  )
}

function TierDots({ tiers = [] }) {
  if (tiers.length < 2) return null
  return (
    <div className="flex items-center gap-1" title={`Available in ${tiers.length} levels`}>
      {['foundation','standard','advanced'].map(t => (
        <span key={t} className={`w-1.5 h-1.5 rounded-full ${
          tiers.includes(t)
            ? t === 'foundation' ? 'bg-orange-400'
            : t === 'standard'  ? 'bg-yellow-400'
            : 'bg-blue-400'
            : 'bg-gray-200'
        }`} />
      ))}
    </div>
  )
}

function ArticleCard({ article: a, featured = false }) {
  const href    = a.slug ? `/articles/${a.slug}` : `/articles/${a.id}`
  const excerpt = a.subtitle || (a.body_text || '').split('\n').find(p => p.trim().length > 20) || ''
  const short   = excerpt.length > 140 ? excerpt.slice(0, 140).trimEnd() + '…' : excerpt

  if (featured) {
    return (
      <Link to={href} className="group block rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
        <div className="sm:flex">
          <div className="sm:w-1/2 aspect-video sm:aspect-auto sm:min-h-[260px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0">
            {a.cover_image_url ? (
              <img src={a.cover_image_url} alt={a.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl opacity-20">📰</span>
              </div>
            )}
          </div>
          <div className="p-7 flex flex-col justify-center sm:w-1/2">
            <div className="flex items-center gap-2 mb-3">
              <LevelPill article={a} />
              <TierDots tiers={a.tiers || []} />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Featured</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-950 leading-tight mb-3 group-hover:text-blue-700 transition-colors">
              {a.title}
            </h2>
            {short && (
              <p className="text-gray-500 leading-relaxed mb-4 line-clamp-3">{short}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {(a.topic_tags || []).slice(0, 2).map(t => (
                <span key={t} className="capitalize">{TOPIC_LABELS[t] || t}</span>
              ))}
              {a.word_count && <span>{readTime(a.word_count)} read</span>}
              {!a.is_free && <span className="text-amber-600 font-medium">Subscriber</span>}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={href} className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all block">
      <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {a.cover_image_url ? (
          <img src={a.cover_image_url} alt={a.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-20">📰</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <LevelPill article={a} />
          <TierDots tiers={a.tiers || []} />
          {!a.is_free && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              Subscriber
            </span>
          )}
        </div>
        <h2 className="font-bold text-gray-900 leading-snug mb-1.5 group-hover:text-blue-700 transition-colors line-clamp-2">
          {a.title}
        </h2>
        {short && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{short}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(a.topic_tags || []).slice(0, 2).map(t => (
              <span key={t} className="text-xs text-gray-400 capitalize">{TOPIC_LABELS[t] || t}</span>
            ))}
          </div>
          {a.word_count && <span className="text-xs text-gray-300">{readTime(a.word_count)} read</span>}
        </div>
      </div>
    </Link>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ArticleList() {
  const [articles,     setArticles]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [levelFilter,  setLevelFilter]  = useState('all')
  const [topicFilter,  setTopicFilter]  = useState('all')
  const [allTopics,    setAllTopics]    = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug, subtitle, level, topic_tags, is_free, word_count, cover_image_url, published_at, body_text, article_tier, topic_group_id')
      .is('school_id', null)
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (data) {
      // For tiered article groups, show only the advanced tier as the card face.
      // Non-tiered articles (topic_group_id = null) are shown as-is.
      // Each card gets a `tiers` array of which tiers exist in its group.
      const groupMap = {}
      const ungrouped = []

      for (const a of data) {
        if (a.topic_group_id) {
          if (!groupMap[a.topic_group_id]) groupMap[a.topic_group_id] = []
          groupMap[a.topic_group_id].push(a)
        } else {
          ungrouped.push(a)
        }
      }

      const deduped = [...ungrouped]
      for (const group of Object.values(groupMap)) {
        // Pick the advanced tier as the card face; fall back to whatever exists
        const face = group.find(a => a.article_tier === 'advanced')
          || group.find(a => a.article_tier === 'standard')
          || group[0]
        const tiers = group.map(a => a.article_tier).filter(Boolean)
        deduped.push({ ...face, tiers })
      }

      // Restore publish date order after deduplication
      deduped.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))

      setArticles(deduped)
      const topics = [...new Set(deduped.flatMap(a => a.topic_tags || []))]
      setAllTopics(topics.filter(t => TOPIC_LABELS[t] || t))
    }
    setLoading(false)
  }

  const filtered = articles.filter(a => {
    // levelFilter is now 'all' | 'Easy' | 'Medium' | 'Advanced'
    const levelOk = levelFilter === 'all' || (() => {
      if (a.tiers?.length > 1) {
        // Tiered article covers all three levels — always matches any filter
        return true
      }
      return cefrToDisplay(a.level) === levelFilter
    })()
    const topicOk = topicFilter === 'all' || (a.topic_tags || []).includes(topicFilter)
    return levelOk && topicOk
  })

  const featured  = filtered[0] || null
  const rest      = filtered.slice(1)
  const isFiltered = levelFilter !== 'all' || topicFilter !== 'all'

  return (
    <div>
      <PageMeta
        title="Read English Articles"
        description="Real articles at every level — Easy, Medium, and Advanced. Read, learn vocabulary, and improve your English every day."
        canonical="/articles"
      />
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-950 tracking-tight leading-tight mb-4">
            Read the world.<br />
            <span className="text-gray-400 font-normal">Learn English.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
            Real articles on real topics — tap any word for an instant translation in your language.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4">
          {/* Level */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">Level</span>
            <FilterPill active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>All</FilterPill>
            {LEVEL_FILTER_OPTIONS.map(({ value, label, pillClass }) => (
              <FilterPill
                key={value}
                active={levelFilter === value}
                onClick={() => setLevelFilter(value === levelFilter ? 'all' : value)}
                colour={levelFilter === value ? pillClass : null}
              >
                {label}
              </FilterPill>
            ))}
          </div>

          {/* Topic */}
          {allTopics.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 font-medium mr-1">Topic</span>
              <FilterPill active={topicFilter === 'all'} onClick={() => setTopicFilter('all')}>All</FilterPill>
              {allTopics.map(topic => (
                <FilterPill
                  key={topic}
                  active={topicFilter === topic}
                  onClick={() => setTopicFilter(topic === topicFilter ? 'all' : topic)}
                >
                  {TOPIC_LABELS[topic] || topic}
                </FilterPill>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse h-64 bg-gray-50" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-50" />
                  <div className="p-5 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-500 mb-3">No articles match those filters yet.</p>
            {isFiltered && (
              <button onClick={() => { setLevelFilter('all'); setTopicFilter('all') }}
                className="text-sm text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && !isFiltered && (
              <ArticleCard article={featured} featured />
            )}

            {/* Grid */}
            {(isFiltered ? filtered : rest).length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(isFiltered ? filtered : rest).map(a => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}

            {/* Count */}
            <p className="text-xs text-gray-300 text-center pt-4">
              {filtered.length} article{filtered.length !== 1 ? 's' : ''}
              {isFiltered ? ' matching filters' : ' published'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, colour, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? colour || 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  )
}
