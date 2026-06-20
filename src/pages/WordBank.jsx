import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cefrToDisplay, levelPillClass } from '../lib/levels'

// ── Flashcard component ────────────────────────────────────────────────────────

function Flashcard({ word, onNext, onRemove, total, current }) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() { setFlipped(p => !p) }

  return (
    <div className="flex flex-col items-center">
      {/* Progress */}
      <p className="text-xs text-gray-400 mb-6">{current} of {total}</p>

      {/* Card */}
      <div
        onClick={handleFlip}
        className="w-full max-w-sm cursor-pointer select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          {/* Front — English */}
          <div
            className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-3xl font-bold text-gray-900 text-center mb-2">{word.surface_form || word.lemma}</p>
            {word.surface_form && word.surface_form !== word.lemma && (
              <p className="text-sm text-gray-400">({word.lemma})</p>
            )}
            <p className="text-xs text-gray-300 mt-6">Tap to reveal</p>
          </div>

          {/* Back — Translation */}
          <div
            className="absolute inset-0 bg-blue-600 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-3xl font-bold text-white text-center mb-3">{word.contextual_translation}</p>
            {word.context_sentence && (
              <p className="text-sm text-blue-200 text-center leading-relaxed mt-2 italic">
                "{word.context_sentence.length > 100
                  ? word.context_sentence.slice(0, 100) + '…'
                  : word.context_sentence}"
              </p>
            )}
            <p className="text-xs text-blue-300 mt-6">Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onRemove}
          className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Remove
        </button>
        <button
          onClick={() => { setFlipped(false); onNext() }}
          className="px-6 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WordBank() {
  const navigate  = useNavigate()

  const [words,    setWords]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [userId,   setUserId]   = useState(null)
  const [notAuthed, setNotAuthed] = useState(false)

  // View: 'list' | 'review'
  const [view,     setView]     = useState('list')

  // Filters
  const [groupBy,  setGroupBy]  = useState('article')   // 'article' | 'date'
  const [search,   setSearch]   = useState('')

  // Review mode
  const [reviewWords,   setReviewWords]   = useState([])
  const [reviewIndex,   setReviewIndex]   = useState(0)
  const [reviewDone,    setReviewDone]    = useState(false)

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { setNotAuthed(true); setLoading(false); return }
      setUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    if (userId) load()
  }, [userId])

  // ── Load saved words ────────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('saved_words')
      .select(`
        id, lemma, surface_form, context_sentence, contextual_translation, saved_at,
        article:article_id ( id, title, slug, level )
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
    setWords(data || [])
    setLoading(false)
  }

  // ── Remove word ─────────────────────────────────────────────────────────────
  async function removeWord(wordId) {
    await supabase.from('saved_words').delete().eq('id', wordId).eq('user_id', userId)
    setWords(prev => prev.filter(w => w.id !== wordId))
  }

  // ── Start review ────────────────────────────────────────────────────────────
  function startReview(subset = null) {
    const toReview = subset || filtered
    if (!toReview.length) return
    // Shuffle
    const shuffled = [...toReview].sort(() => Math.random() - 0.5)
    setReviewWords(shuffled)
    setReviewIndex(0)
    setReviewDone(false)
    setView('review')
  }

  function nextReviewWord() {
    if (reviewIndex + 1 >= reviewWords.length) {
      setReviewDone(true)
    } else {
      setReviewIndex(i => i + 1)
    }
  }

  async function removeAndNext(word) {
    await removeWord(word.id)
    setReviewWords(prev => prev.filter(w => w.id !== word.id))
    if (reviewIndex >= reviewWords.length - 1) {
      setReviewDone(true)
    }
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = words.filter(w => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      w.lemma?.toLowerCase().includes(q) ||
      w.surface_form?.toLowerCase().includes(q) ||
      w.contextual_translation?.toLowerCase().includes(q)
    )
  })

  // ── Group ───────────────────────────────────────────────────────────────────
  function groupWords(words) {
    if (groupBy === 'article') {
      const groups = {}
      words.forEach(w => {
        const key   = w.article?.id || 'unknown'
        const label = w.article?.title || 'Unknown article'
        if (!groups[key]) groups[key] = { label, level: w.article?.level, slug: w.article?.slug || w.article?.id, words: [] }
        groups[key].words.push(w)
      })
      return Object.values(groups)
    } else {
      // Group by week
      const groups = {}
      words.forEach(w => {
        const date  = new Date(w.saved_at)
        const week  = getWeekLabel(date)
        if (!groups[week]) groups[week] = { label: week, words: [] }
        groups[week].words.push(w)
      })
      return Object.values(groups)
    }
  }

  function getWeekLabel(date) {
    const now   = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays < 7)  return 'This week'
    if (diffDays < 14) return 'Last week'
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }

  const groups = groupWords(filtered)

  // ── Not authenticated ───────────────────────────────────────────────────────
  if (notAuthed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">📚</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Your word bank</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to save and review words from articles.</p>
          <Link to="/login" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Review mode ─────────────────────────────────────────────────────────────
  if (view === 'review') {
    if (reviewDone || reviewWords.length === 0) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">All done!</h2>
            <p className="text-sm text-gray-500 mb-8">
              You reviewed {reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''}.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startReview()}
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700"
              >
                Review again
              </button>
              <button
                onClick={() => setView('list')}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50"
              >
                Back to word bank
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-6 h-14 flex items-center justify-between">
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-900">
              ← Word bank
            </button>
            <p className="text-sm font-semibold text-gray-700">Review</p>
            <div className="w-16" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-6 pt-12">
          <Flashcard
            word={reviewWords[reviewIndex]}
            total={reviewWords.length}
            current={reviewIndex + 1}
            onNext={nextReviewWord}
            onRemove={() => removeAndNext(reviewWords[reviewIndex])}
          />
        </div>
      </div>
    )
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/articles" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Articles
          </Link>
          <h1 className="text-sm font-bold text-gray-900">Word bank</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : words.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📖</p>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No saved words yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Tap any word while reading an article to see its translation and save it here.
            </p>
            <Link to="/articles"
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Browse articles
            </Link>
          </div>
        ) : (
          <>
            {/* Stats + actions bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-lg font-bold text-gray-900">{words.length} words saved</p>
                <p className="text-xs text-gray-400 mt-0.5">across {groups.length} {groupBy === 'article' ? 'article' : 'period'}{groups.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => startReview()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Review all
              </button>
            </div>

            {/* Search + group toggle */}
            <div className="flex gap-3 mb-6">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search words…"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-300"
              />
              <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
                {[['article', 'By article'], ['date', 'By date']].map(([val, label]) => (
                  <button key={val} onClick={() => setGroupBy(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      groupBy === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Word groups */}
            <div className="space-y-6">
              {groups.map((group, gi) => (
                <div key={gi}>
                  {/* Group header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {group.level && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${levelPillClass(group.level)}`}>
                          {cefrToDisplay(group.level)}
                        </span>
                      )}
                      {group.slug ? (
                        <Link
                          to={`/articles/${group.slug}`}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {group.label}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                      )}
                      <span className="text-xs text-gray-400">{group.words.length} word{group.words.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => startReview(group.words)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Review →
                    </button>
                  </div>

                  {/* Words in this group */}
                  <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {group.words.map(word => (
                      <div key={word.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {word.surface_form || word.lemma}
                            </span>
                            {word.surface_form && word.surface_form !== word.lemma && (
                              <span className="text-xs text-gray-400">({word.lemma})</span>
                            )}
                            <span className="text-sm text-blue-600 ml-1">
                              {word.contextual_translation}
                            </span>
                          </div>
                          {word.context_sentence && (
                            <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">
                              "{word.context_sentence.length > 90
                                ? word.context_sentence.slice(0, 90) + '…'
                                : word.context_sentence}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeWord(word.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5 p-0.5"
                          title="Remove from word bank"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
