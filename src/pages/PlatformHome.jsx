// PlatformHome.jsx — Hub dashboard (/home)
// Layout:
//   1. Auto-scrolling tile strip — all sections/features, loops continuously
//   2. "This week" — latest Article, Podcast, Daily Challenge
//   3. "Games & Puzzles" — 5 puzzle tiles

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageMeta from '../components/PageMeta'

// ── Section / feature tile definitions ───────────────────────────────────────
// Each tile: the section or feature it represents, its colour, emoji placeholder
// Illustrations slot in via `illustration` field when ready.

const SECTION_TILES = [
  { label: 'articles',        to: '/articles',   colour: '#4b7fc1', bg: '#eef3fb', emoji: '📖' },
  { label: 'daily challenge', to: '/challenge',  colour: '#f4bb59', bg: '#fffbee', emoji: '⚡' },
  { label: 'games',           to: '/puzzles',    colour: '#f76639', bg: '#fff1ed', emoji: '🎲' },
  { label: 'podcast',         to: '/podcasts',   colour: '#f4bb59', bg: '#fffbee', emoji: '🎧' },
  { label: 'exam prep',       to: '/exam',       colour: '#4b7fc1', bg: '#eef3fb', emoji: '📝' },
  { label: 'courses',         to: '/courses',    colour: '#72c09e', bg: '#edf8f3', emoji: '🎓' },
  { label: 'word bank',       to: '/words',      colour: '#c2bdf5', bg: '#f4f3ff', emoji: '💬' },
  { label: 'level test',      to: '/level-test', colour: '#ffb1c1', bg: '#fff0f3', emoji: '📊' },
]

const PUZZLE_TILES = [
  { label: 'wordup',      to: '/puzzles/wordle',      colour: '#f4bb59', bg: '#fffbee', emoji: '🟩', name: 'WordUp' },
  { label: 'clusters',    to: '/puzzles/connections',  colour: '#c2bdf5', bg: '#f4f3ff', emoji: '🟣', name: 'Clusters' },
  { label: 'word ladder', to: '/puzzles/ladder',       colour: '#63c7ec', bg: '#edf8fd', emoji: '🪜', name: 'Word Ladder' },
  { label: 'letter hive', to: '/puzzles/hive',         colour: '#f4bb59', bg: '#fffbee', emoji: '🐝', name: 'Letter Hive' },
  { label: 'crossword',   to: '/puzzles/crossword',    colour: '#72c09e', bg: '#edf8f3', emoji: '✏️', name: 'Crossword' },
]

// ── Auto-scrolling tile strip ─────────────────────────────────────────────────
// Duplicates the tile array to create a seamless loop.

function ScrollingTileStrip() {
  // Duplicate so the loop is seamless
  const tiles = [...SECTION_TILES, ...SECTION_TILES]

  return (
    <div className="overflow-hidden w-full mb-10 select-none">
      <div className="flex gap-4 w-max animate-scroll-tiles">
        {tiles.map((tile, i) => (
          <Link
            key={i}
            to={tile.to}
            className="flex flex-col items-center gap-2 group flex-shrink-0"
            tabIndex={i >= SECTION_TILES.length ? -1 : 0} // only first set is focusable
            aria-hidden={i >= SECTION_TILES.length}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-105"
              style={{ backgroundColor: tile.bg, border: `2px solid ${tile.colour}20` }}
            >
              {tile.emoji}
            </div>
            <span className="tile-label" style={{ color: tile.colour === '#fffbee' ? '#d9a030' : tile.colour }}>
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Square tile (used for puzzles) ────────────────────────────────────────────

function PuzzleTile({ tile }) {
  return (
    <Link
      to={tile.to}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className="w-full aspect-square rounded-2xl flex items-center justify-center text-4xl transition-transform group-hover:scale-105"
        style={{ backgroundColor: tile.bg, border: `2px solid ${tile.colour}30` }}
      >
        {tile.emoji}
      </div>
      <span className="tile-label text-center" style={{ color: tile.colour }}>
        {tile.label}
      </span>
    </Link>
  )
}

// ── "This week" content card ───────────────────────────────────────────────────

function WeekCard({ colour, bg, label, emoji, title, subtitle, to, loading }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl overflow-hidden border-2 transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: `${colour}30`, backgroundColor: bg }}
    >
      {/* Coloured header strip */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: colour }}
      >
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-white/90" style={{ fontFamily: "'League Spartan', sans-serif" }}>
          {label}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-4 flex-1 flex flex-col justify-between">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ) : (
          <>
            <div>
              <p className="font-700 text-gray-900 leading-snug text-sm line-clamp-2 mb-1 font-bold">
                {title || 'Coming soon'}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{subtitle}</p>
              )}
            </div>
            <p
              className="mt-3 text-xs font-bold group-hover:underline"
              style={{ color: colour === '#f4bb59' ? '#d9a030' : colour }}
            >
              {label === 'daily challenge' ? 'Start today →' : 'Read now →'}
            </p>
          </>
        )}
      </div>
    </Link>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-6 uppercase" style={{ fontFamily: "'League Spartan', sans-serif", letterSpacing: '-0.02em' }}>
      {children}
    </h2>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlatformHome() {
  const navigate = useNavigate()

  const [loading,   setLoading]   = useState(true)
  const [article,   setArticle]   = useState(null)
  const [podcast,   setPodcast]   = useState(null)
  const [userId,    setUserId]    = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (!user) {
        navigate('/', { replace: true })
        return
      }
      setUserId(user.id)

      // Profile check for onboarding
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('display_name, learning_goal')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!mounted) return
      if (!prof?.display_name || !prof?.learning_goal) {
        navigate('/onboarding', { replace: true })
        return
      }

      // Latest article + podcast in parallel
      const [{ data: latestArticle }, { data: latestPodcast }] = await Promise.all([
        supabase
          .from('articles')
          .select('id, title, slug, subtitle, level')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('podcasts')
          .select('id, title, description')
          .eq('status', 'published')
          .order('episode_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (!mounted) return
      setArticle(latestArticle)
      setPodcast(latestPodcast)
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const articleHref = article ? (article.slug ? `/articles/${article.slug}` : `/articles/${article.id}`) : '/articles'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <PageMeta
        title="Home — Chatter Club"
        description="Your daily English practice hub."
        canonical="/home"
      />

      {/* ── 1. Scrolling tile strip ─────────────────────────────────────── */}
      <ScrollingTileStrip />

      {/* ── 2. This week ────────────────────────────────────────────────── */}
      <section className="mb-14">
        <SectionHeading>This week.</SectionHeading>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <WeekCard
            colour="#4b7fc1"
            bg="#eef3fb"
            label="article"
            emoji="📖"
            title={article?.title}
            subtitle={article?.subtitle || (article?.level ? `Level ${article.level}` : null)}
            to={articleHref}
            loading={false}
          />
          <WeekCard
            colour="#f4bb59"
            bg="#fffbee"
            label="podcast"
            emoji="🎧"
            title={podcast?.title}
            subtitle={podcast?.description?.slice(0, 80) + (podcast?.description?.length > 80 ? '…' : '')}
            to="/podcasts"
            loading={false}
          />
          <WeekCard
            colour="#f76639"
            bg="#fff1ed"
            label="daily challenge"
            emoji="⚡"
            title="Today's challenge"
            subtitle="5 steps · builds your streak · 10 minutes"
            to="/challenge"
            loading={false}
          />
        </div>
      </section>

      {/* ── 3. Games & Puzzles ──────────────────────────────────────────── */}
      <section>
        <SectionHeading>Games & puzzles.</SectionHeading>

        <div className="grid grid-cols-5 gap-4 sm:gap-6">
          {PUZZLE_TILES.map(tile => (
            <PuzzleTile key={tile.to} tile={tile} />
          ))}
        </div>
      </section>
    </div>
  )
}
