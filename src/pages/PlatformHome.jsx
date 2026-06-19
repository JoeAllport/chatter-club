import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_COLOURS = {
  A1:   'bg-pink-100 text-pink-800',
  A2:   'bg-orange-100 text-orange-800',
  B1:   'bg-yellow-100 text-yellow-800',
  'B1+':'bg-yellow-100 text-yellow-900',
  B2:   'bg-green-100 text-green-800',
  'B2+':'bg-green-100 text-green-900',
  C1:   'bg-blue-100 text-blue-800',
  C2:   'bg-purple-100 text-purple-800',
}

const GOAL_LABELS = {
  general:      'General English',
  cambridge_b2: 'Cambridge B2',
  business:     'Business English',
  travel:       'Travel & Culture',
}

function readTime(wordCount) {
  return `${Math.max(1, Math.round((wordCount || 0) / 200))} min read`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlatformHome() {
  const navigate = useNavigate()

  const [profile,  setProfile]  = useState(null)
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [userId,   setUserId]   = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      // Auth check
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (!user) {
        navigate('/', { replace: true })
        return
      }
      setUserId(user.id)

      // Profile + articles in parallel
      const [{ data: prof }, { data: arts }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('display_name, native_lang, learning_goal, cefr_level')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('articles')
          .select('id, title, slug, subtitle, level, topic_tags, word_count, cover_image_url, published_at, body_text')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(12),
      ])

      if (!mounted) return

      // If no profile / incomplete onboarding, redirect
      if (!prof?.display_name || !prof?.learning_goal) {
        navigate('/onboarding', { replace: true })
        return
      }

      setProfile(prof)
      setArticles(arts || [])
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">Loading your feed…</p>
      </div>
    )
  }

  const firstName = profile?.display_name?.split(' ')[0] || 'there'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* ── Welcome bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">
            {greeting()}, {firstName} 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {profile.learning_goal && (
              <p className="text-sm text-gray-400">
                Goal: <span className="text-gray-600 font-medium">{GOAL_LABELS[profile.learning_goal]}</span>
              </p>
            )}
            {profile.cefr_level ? (
              <Link
                to="/level-test"
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors font-medium"
              >
                Level: {profile.cefr_level}
              </Link>
            ) : (
              <Link
                to="/level-test"
                className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors font-medium"
              >
                🎓 Find your level
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/words"
            className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📚 Word bank
          </Link>
          <Link
            to="/articles"
            className="text-sm px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
          >
            Browse all
          </Link>
        </div>
      </div>

      {/* ── Daily challenge placeholder ─────────────────────────────────────── */}
      <DailyChallengeCard />

      {/* ── Latest articles ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Latest articles</h2>

        {articles.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📰</div>
            <p className="text-sm text-gray-400">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Daily challenge card ───────────────────────────────────────────────────────
// Placeholder — wired up properly when daily_challenges table is built

function DailyChallengeCard() {
  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 text-white overflow-hidden">
      <div className="px-6 py-5 sm:flex sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Daily Challenge
            </span>
          </div>
          <p className="text-lg font-bold leading-snug">
            Coming soon 🌟
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Daily challenges are launching soon. In the meantime, browse the latest articles below.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex-shrink-0">
          <Link
            to="/articles"
            className="inline-block text-sm px-5 py-2.5 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Browse articles →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Article card ───────────────────────────────────────────────────────────────

function ArticleCard({ article: a }) {
  const href    = a.slug ? `/articles/${a.slug}` : `/articles/${a.id}`
  const excerpt = a.subtitle
    || (a.body_text || '').split('\n').find(p => p.trim().length > 20)
    || ''
  const short = excerpt.length > 100 ? excerpt.slice(0, 100).trimEnd() + '…' : excerpt

  return (
    <Link
      to={href}
      className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all"
    >
      {/* Cover */}
      <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0">
        {a.cover_image_url ? (
          <img
            src={a.cover_image_url}
            alt={a.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">📰</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Level + tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {a.level && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLOURS[a.level] || 'bg-gray-100 text-gray-700'}`}>
              {a.level}
            </span>
          )}
          {(a.topic_tags || []).slice(0, 2).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1 group-hover:text-gray-600 transition-colors line-clamp-2">
          {a.title}
        </h3>

        {/* Excerpt */}
        {short && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">
            {short}
          </p>
        )}

        {/* Meta */}
        <div className="mt-3 text-xs text-gray-400">
          {readTime(a.word_count)}
        </div>
      </div>
    </Link>
  )
}
