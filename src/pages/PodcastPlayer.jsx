import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageMeta from '../components/PageMeta'

// ── Constants ─────────────────────────────────────────────────────────────────

const SPEEDS = [0.75, 1, 1.25, 1.5]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── WordPopup ─────────────────────────────────────────────────────────────────

function WordPopup({ word, context, onClose, onSave, saved }) {
  if (!word) return null

  return (
    <div className="fixed inset-x-4 bottom-24 sm:bottom-8 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xl font-bold text-gray-900">{word.surface_form}</p>
            {word.lemma && word.lemma !== word.surface_form && (
              <p className="text-xs text-gray-400">{word.lemma}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {word.definition && (
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{word.definition}</p>
        )}

        {word.translation && Object.keys(word.translation).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Object.entries(word.translation).map(([lang, trans]) => (
              <span key={lang} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                <span className="text-indigo-400 mr-1">{lang}</span>{trans}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => onSave(word)}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${
            saved
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {saved ? '✓ Saved to word bank' : 'Save to word bank'}
        </button>
      </div>
    </div>
  )
}

// ── TranscriptSegment ─────────────────────────────────────────────────────────

function TranscriptSegment({ segment, isActive, wordContexts, onWordTap }) {
  const words = segment.text.split(/(\s+)/)

  return (
    <p className={`text-base leading-relaxed mb-3 transition-colors duration-200 ${
      isActive ? 'text-gray-900' : 'text-gray-400'
    }`}>
      {words.map((token, i) => {
        const clean = token.toLowerCase().replace(/[^a-z']/g, '')
        const ctx   = wordContexts[clean]

        if (!clean || !ctx) {
          return <span key={i}>{token}</span>
        }

        return (
          <span
            key={i}
            onClick={() => onWordTap(ctx)}
            className={`cursor-pointer rounded px-0.5 transition-colors
              ${isActive
                ? 'text-indigo-600 hover:bg-indigo-50'
                : 'hover:text-gray-600'
              }`}
          >
            {token}
          </span>
        )
      })}
    </p>
  )
}

// ── PodcastPlayer ─────────────────────────────────────────────────────────────

export default function PodcastPlayer() {
  const { id }     = useParams()
  const audioRef   = useRef(null)
  const progressSaveTimer = useRef(null)
  const activeSegRef = useRef(null)

  const [podcast,      setPodcast]      = useState(null)
  const [userId,       setUserId]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [wordContexts, setWordContexts] = useState({})  // surface_form → row

  // Player state
  const [playing,      setPlaying]      = useState(false)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [speed,        setSpeed]        = useState(1)
  const [speedIdx,     setSpeedIdx]     = useState(1)

  // Transcript
  const [activeSegIdx, setActiveSegIdx] = useState(-1)

  // Word popup
  const [activeWord,   setActiveWord]   = useState(null)
  const [savedWords,   setSavedWords]   = useState(new Set())

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: pod, error: podErr } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', id)
        .single()

      if (podErr || !pod) {
        setError('Episode not found.')
        setLoading(false)
        return
      }

      setPodcast(pod)

      // Load word contexts
      const { data: wc } = await supabase
        .from('podcast_word_contexts')
        .select('surface_form, lemma, translation, definition')
        .eq('podcast_id', id)

      const wcMap = {}
      ;(wc || []).forEach(w => { wcMap[w.surface_form.toLowerCase()] = w })
      setWordContexts(wcMap)

      // Restore progress
      if (user?.id) {
        const { data: prog } = await supabase
          .from('user_podcast_progress')
          .select('position_seconds')
          .eq('user_id', user.id)
          .eq('podcast_id', id)
          .single()

        if (prog?.position_seconds && audioRef.current) {
          audioRef.current.currentTime = prog.position_seconds
          setCurrentTime(prog.position_seconds)
        }

        // Load saved words
        const { data: sw } = await supabase
          .from('saved_words')
          .select('lemma')
          .eq('user_id', user.id)

        setSavedWords(new Set((sw || []).map(w => w.lemma)))
      }

      setLoading(false)
    }
    load()
  }, [id])

  // ── Audio event handlers ───────────────────────────────────────────────────
  function onTimeUpdate() {
    const audio = audioRef.current
    if (!audio) return
    const t = audio.currentTime
    setCurrentTime(t)

    // Update active transcript segment
    if (podcast?.transcript?.segments) {
      const idx = podcast.transcript.segments.findIndex(
        (seg, i) => {
          const next = podcast.transcript.segments[i + 1]
          return t >= seg.start && (!next || t < next.start)
        }
      )
      if (idx !== activeSegIdx) setActiveSegIdx(idx)
    }

    // Auto-scroll active segment into view
    if (activeSegRef.current) {
      activeSegRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    // Save progress every 10 seconds
    clearTimeout(progressSaveTimer.current)
    progressSaveTimer.current = setTimeout(() => {
      saveProgress(t, false)
    }, 10000)
  }

  function onLoadedMetadata() {
    setDuration(audioRef.current?.duration || 0)
  }

  function onEnded() {
    setPlaying(false)
    saveProgress(duration, true)
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else         { audio.play();  setPlaying(true)  }
  }

  function seek(e) {
    const audio = audioRef.current
    if (!audio) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const pct   = (e.clientX - rect.left) / rect.width
    const t     = pct * duration
    audio.currentTime = t
    setCurrentTime(t)
  }

  function skip(secs) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + secs))
  }

  function cycleSpeed() {
    const nextIdx = (speedIdx + 1) % SPEEDS.length
    setSpeedIdx(nextIdx)
    setSpeed(SPEEDS[nextIdx])
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[nextIdx]
  }

  // ── Word tap ───────────────────────────────────────────────────────────────
  function handleWordTap(ctx) {
    setActiveWord(ctx)
  }

  async function handleSaveWord(ctx) {
    if (!userId || !podcast) return
    const lemma = ctx.lemma || ctx.surface_form
    if (savedWords.has(lemma)) return

    await supabase.from('saved_words').upsert({
      user_id:               userId,
      article_id:            null,
      lemma,
      surface_form:          ctx.surface_form,
      contextual_translation: Object.values(ctx.translation || {})[0] || '',
      context_sentence:      null,
    }, { onConflict: 'user_id,lemma' })

    setSavedWords(prev => new Set([...prev, lemma]))
  }

  // ── Save progress ──────────────────────────────────────────────────────────
  async function saveProgress(position, completed) {
    if (!userId) return
    await supabase
      .from('user_podcast_progress')
      .upsert({
        user_id:          userId,
        podcast_id:       id,
        position_seconds: Math.floor(position),
        completed,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'user_id,podcast_id' })
  }

  // Save on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && userId) {
        saveProgress(audioRef.current.currentTime, audioRef.current.ended)
      }
    }
  }, [userId])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">🎙️</p>
      <p className="text-gray-600 mb-6">{error}</p>
      <Link to="/podcasts" className="text-sm text-indigo-600 hover:text-indigo-800">← All episodes</Link>
    </div>
  )

  const segments   = podcast.transcript?.segments || []
  const pct        = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-48">
      <PageMeta
        title={`${podcast.title} — Chatter Club Podcast`}
        description={podcast.description || `Listen to episode ${podcast.episode_number} of the Chatter Club podcast.`}
        canonical={`/podcasts/${podcast.id}`}
      />

      {/* Back */}
      <Link to="/podcasts" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
        ← All episodes
      </Link>

      {/* Episode header */}
      <div className="mb-6">
        {podcast.episode_number && (
          <p className="text-xs text-gray-400 mb-1">Episode {podcast.episode_number}</p>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{podcast.title}</h1>
        {podcast.description && (
          <p className="text-gray-500 text-sm leading-relaxed">{podcast.description}</p>
        )}
      </div>

      {/* ── Audio player ──────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-2xl p-5 mb-8 sticky top-16 z-20 shadow-sm">

        {/* Hidden audio element */}
        {podcast.audio_url && (
          <audio
            ref={audioRef}
            src={podcast.audio_url}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
            preload="metadata"
          />
        )}

        {!podcast.audio_url && (
          <p className="text-center text-sm text-gray-400 py-2">Audio coming soon</p>
        )}

        {/* Progress bar */}
        <div
          className="h-2 bg-gray-200 rounded-full mb-4 cursor-pointer"
          onClick={seek}
        >
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Time */}
        <div className="flex justify-between text-xs text-gray-400 mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Skip back 10s */}
          <button
            onClick={() => skip(-10)}
            className="text-gray-500 hover:text-gray-900 transition-colors"
            title="Back 10s"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8V4m0 0L8 8m4-4l4 4M6.343 17.657A8 8 0 1117.657 6.343" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            disabled={!podcast.audio_url}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
          >
            {playing ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Skip forward 10s */}
          <button
            onClick={() => skip(10)}
            className="text-gray-500 hover:text-gray-900 transition-colors"
            title="Forward 10s"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8V4m0 0l4 4m-4-4L8 8m9.657 9.657A8 8 0 116.343 6.343" />
            </svg>
          </button>

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors w-10 text-center"
          >
            {speed}×
          </button>
        </div>
      </div>

      {/* ── Transcript ────────────────────────────────────────────────────────── */}
      {segments.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Transcript
          </h2>
          <div className="space-y-1">
            {segments.map((seg, i) => (
              <div
                key={i}
                ref={i === activeSegIdx ? activeSegRef : null}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = seg.start
                    setCurrentTime(seg.start)
                  }
                }}
              >
                <TranscriptSegment
                  segment={seg}
                  isActive={i === activeSegIdx}
                  wordContexts={wordContexts}
                  onWordTap={handleWordTap}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Transcript not yet available.</p>
        </div>
      )}

      {/* ── Word popup ────────────────────────────────────────────────────────── */}
      {activeWord && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveWord(null)}
          />
          <WordPopup
            word={activeWord}
            onClose={() => setActiveWord(null)}
            onSave={handleSaveWord}
            saved={savedWords.has(activeWord.lemma || activeWord.surface_form)}
          />
        </>
      )}
    </div>
  )
}
