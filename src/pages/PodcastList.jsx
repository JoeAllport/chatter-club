import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageMeta from '../components/PageMeta'

const LEVEL_COLOURS = {
  A1: 'bg-pink-100 text-pink-700',
  A2: 'bg-orange-100 text-orange-700',
  B1: 'bg-yellow-100 text-yellow-800',
  B2: 'bg-green-100 text-green-800',
  C1: 'bg-blue-100 text-blue-800',
  C2: 'bg-purple-100 text-purple-800',
}

function formatDuration(seconds) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function PodcastList() {
  const [podcasts,  setPodcasts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [userId,    setUserId]    = useState(null)
  const [progress,  setProgress]  = useState({})  // podcast_id → progress row

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data } = await supabase
        .from('podcasts')
        .select('id, title, description, episode_number, duration_seconds, level, topic_tags, is_free, status, created_at')
        .eq('status', 'published')
        .order('episode_number', { ascending: false })

      setPodcasts(data || [])

      if (user?.id) {
        const { data: prog } = await supabase
          .from('user_podcast_progress')
          .select('podcast_id, position_seconds, completed')
          .eq('user_id', user.id)

        const map = {}
        ;(prog || []).forEach(p => { map[p.podcast_id] = p })
        setProgress(map)
      }

      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageMeta
        title="Podcast — Chatter Club"
        description="Listen to English language podcast episodes with interactive transcripts and tap-to-translate."
        canonical="/podcasts"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950 tracking-tight mb-2">Podcast</h1>
        <p className="text-gray-500 text-sm">
          Real English, real topics — with interactive transcripts and tap-to-translate.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-28 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : podcasts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎙️</p>
          <h2 className="text-lg font-bold text-gray-900 mb-2">First episode coming soon</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            New episodes drop every week — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {podcasts.map(podcast => {
            const prog      = progress[podcast.id]
            const completed = prog?.completed
            const started   = prog?.position_seconds > 0 && !completed
            const pct       = podcast.duration_seconds && prog
              ? Math.min(100, Math.round((prog.position_seconds / podcast.duration_seconds) * 100))
              : 0

            return (
              <Link
                key={podcast.id}
                to={`/podcasts/${podcast.id}`}
                className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Episode icon */}
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {completed
                      ? <span className="text-2xl">✅</span>
                      : <span className="text-2xl">🎙️</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {podcast.episode_number && (
                        <span className="text-xs text-gray-400">Ep. {podcast.episode_number}</span>
                      )}
                      {podcast.level && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLOURS[podcast.level] || 'bg-gray-100 text-gray-600'}`}>
                          {podcast.level}
                        </span>
                      )}
                      {!podcast.is_free && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Pro</span>
                      )}
                    </div>

                    <h2 className="font-bold text-gray-900 text-base leading-snug mb-1">
                      {podcast.title}
                    </h2>

                    {podcast.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 leading-snug">
                        {podcast.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      {podcast.duration_seconds && (
                        <span className="text-xs text-gray-400">{formatDuration(podcast.duration_seconds)}</span>
                      )}
                      {started && (
                        <span className="text-xs text-indigo-500">{pct}% listened</span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {started && (
                      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
