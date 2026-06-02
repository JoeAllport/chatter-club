import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// TIER: admin (Joe only)

const LEVELS = ['A1','A2','A2+','B1','B1+','B2','B2+','C1','C2']

const WILD_CARD_LABELS = {
  word_formation: 'Word formation',
  odd_one_out:    'Odd one out',
  fill_gap:       'Fill the gap',
  speed_burst:    'Speed burst',
  translation:    'Translation',
}

const DOW_LABELS = ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const STATUS_COLOURS = {
  draft:              'bg-gray-700 text-gray-300',
  in_review:          'bg-yellow-900/50 text-yellow-300',
  changes_requested:  'bg-red-900/50 text-red-300',
  published:          'bg-green-900/50 text-green-300',
  archived:           'bg-gray-800 text-gray-500',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudioSeasons() {
  const [view,    setView]    = useState('list')  // list | create | detail
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadSeasons() }, [])

  async function loadSeasons() {
    setLoading(true)
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .order('starts_at', { ascending: false })
    setSeasons(data || [])
    setLoading(false)
  }

  if (view === 'create') {
    return <SeasonCreator onBack={() => { setView('list'); loadSeasons() }} />
  }

  if (view === 'detail' && selected) {
    return <SeasonDetail season={selected} onBack={() => { setView('list'); loadSeasons() }} />
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Seasons</h1>
          <p className="text-sm text-gray-500 mt-1">
            {seasons.filter(s => s.status === 'published').length} live ·{' '}
            {seasons.filter(s => s.status === 'draft').length} drafts
          </p>
        </div>
        <button
          onClick={() => setView('create')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New season
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-900 rounded-lg animate-pulse" />)}
        </div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-4">🗓</p>
          <p>No seasons yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {seasons.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelected(s); setView('detail') }}
              className="w-full flex items-center gap-4 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors text-left"
            >
              <span className="text-2xl">{s.emoji || '🗓'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(s.starts_at)} → {formatDate(s.ends_at)}
                  {s.level && <span className="ml-2 text-gray-600">· {s.level}</span>}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOURS[s.status] || STATUS_COLOURS.draft}`}>
                {s.status}
              </span>
              <span className="text-gray-600 text-sm">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Season creator ────────────────────────────────────────────────────────────

function SeasonCreator({ onBack }) {
  const [form, setForm] = useState({
    title: '', theme: '', description: '', emoji: '🌿',
    colour: '#22c55e', level: 'B1+',
    starts_at: '', ends_at: '',
  })
  const [generating, setGenerating] = useState(false)
  const [generated,  setGenerated]  = useState(null)  // { words, days }
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [reviewDay,  setReviewDay]  = useState(0)

  const durationDays = form.starts_at && form.ends_at
    ? daysBetween(form.starts_at, form.ends_at) + 1
    : 0

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleGenerate() {
    if (!form.title || !form.theme || !form.starts_at || !form.ends_at) {
      setError('Fill in title, theme and dates first.')
      return
    }
    setError('')
    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-season`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            theme:       form.theme,
            description: form.description,
            level:       form.level,
            starts_at:   form.starts_at,
            ends_at:     form.ends_at,
          }),
        }
      )
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setGenerated(json)
      setReviewDay(0)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Insert season
      const { data: season, error: seasonErr } = await supabase
        .from('seasons')
        .insert({
          title:       form.title,
          theme:       form.theme,
          description: form.description,
          emoji:       form.emoji,
          colour:      form.colour,
          level:       form.level,
          starts_at:   form.starts_at,
          ends_at:     form.ends_at,
          status:      'draft',
          created_by:  user?.id,
          school_id:   null,  // public content
        })
        .select()
        .single()

      if (seasonErr) throw new Error(seasonErr.message)

      // 2. Insert season words
      const wordRows = (generated.words || []).map(w => ({
        season_id:       season.id,
        word:            w.word,
        definition:      w.definition,
        ipa:             w.ipa || null,
        example:         w.example || null,
        part_of_speech:  w.part_of_speech || null,
        day_introduced:  w.day_introduced,
      }))

      const { data: insertedWords } = await supabase
        .from('season_words')
        .insert(wordRows)
        .select()

      // Build word index (day_introduced → id)
      const wordByDay = {}
      ;(insertedWords || []).forEach(w => { wordByDay[w.day_introduced] = w.id })

      // 3. Insert daily challenges
      for (const day of (generated.days || [])) {
        const wordId = day.word_index ? wordByDay[day.word_index] : null

        // Save comprehension questions as a content_set
        let passageSetId = null
        if (day.comprehension_questions?.length) {
          passageSetId = await saveQuestionSet(
            `${form.title} · Day ${day.day_number} comprehension`,
            day.comprehension_questions,
            user?.id,
            season.id
          )
        }

        // Save wild card questions as a content_set
        let wildCardSetId = null
        if (day.wild_card && day.wild_card_type === 'speed_burst' && day.wild_card.questions?.length) {
          wildCardSetId = await saveQuestionSet(
            `${form.title} · Day ${day.day_number} speed burst`,
            day.wild_card.questions,
            user?.id,
            season.id
          )
        }

        // Save weekend quiz questions
        let weekendSetId = null
        if (day.type === 'weekend_quiz') {
          const allQs = [...(day.gk_questions || []), ...(day.recap_questions || [])]
          if (allQs.length) {
            weekendSetId = await saveQuestionSet(
              `${form.title} · Weekend quiz (Day ${day.day_number})`,
              allQs,
              user?.id,
              season.id
            )
          }
        }

        await supabase.from('daily_challenges').insert({
          season_id:          season.id,
          challenge_date:     day.date,
          day_number:         day.day_number,
          challenge_type:     day.type || 'daily',
          title:              day.title,
          word_id:            wordId,
          passage_text:       day.passage || null,
          passage_set_id:     passageSetId,
          wild_card_type:     day.wild_card_type || null,
          wild_card_set_id:   wildCardSetId,
          weekend_quiz_set_id: weekendSetId,
          tomorrows_riddle:   day.tomorrows_riddle || null,
          status:             'draft',
          created_by:         user?.id,
        })
      }

      onBack()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-white">New season</h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ── Season details form ─────────────────────────────────────────────── */}
      {!generated && (
        <div className="space-y-6">

          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Season title</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. The Natural World"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
              />
            </div>

            {/* Theme */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Theme / topic brief</label>
              <input
                value={form.theme}
                onChange={e => set('theme', e.target.value)}
                placeholder="e.g. Oceans, ecosystems, wildlife migration, climate"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Description (shown to learners)</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                placeholder="A short season description..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-500 resize-none"
              />
            </div>

            {/* Emoji + colour */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Emoji</label>
              <input
                value={form.emoji}
                onChange={e => set('emoji', e.target.value)}
                placeholder="🌿"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.colour}
                  onChange={e => set('colour', e.target.value)}
                  className="h-10 w-16 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-gray-500">{form.colour}</span>
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Target level</label>
              <select
                value={form.level}
                onChange={e => set('level', e.target.value)}
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start date</label>
              <input
                type="date"
                value={form.starts_at}
                onChange={e => set('starts_at', e.target.value)}
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">End date</label>
              <input
                type="date"
                value={form.ends_at}
                onChange={e => set('ends_at', e.target.value)}
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-500"
              />
            </div>

            {durationDays > 0 && (
              <div className="col-span-2 text-xs text-gray-500">
                {durationDays} calendar days ·{' '}
                {Math.floor(durationDays * 5/7)} weekday challenges ·{' '}
                {Math.floor(durationDays / 7)} weekend quizzes
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !form.title || !form.theme || !form.starts_at || !form.ends_at}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating season… (this takes ~30 seconds)
              </>
            ) : (
              '✨ Generate season with AI'
            )}
          </button>
        </div>
      )}

      {/* ── Review generated content ────────────────────────────────────────── */}
      {generated && (
        <div className="space-y-6">

          {/* Season summary */}
          <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
            <span className="text-3xl">{form.emoji}</span>
            <div>
              <p className="font-semibold text-white">{form.title}</p>
              <p className="text-xs text-gray-500">
                {generated.words?.length} words · {generated.days?.length} challenge days ·{' '}
                {formatDate(form.starts_at)} → {formatDate(form.ends_at)}
              </p>
            </div>
            <button
              onClick={() => setGenerated(null)}
              className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Regenerate
            </button>
          </div>

          {/* Words list */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Vocabulary ({generated.words?.length} words)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(generated.words || []).map((w, i) => (
                <div key={i} className="px-3 py-2 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-white">{w.word}</span>
                    <span className="text-xs text-gray-600">Day {w.day_introduced}</span>
                  </div>
                  <p className="text-xs text-gray-500">{w.definition}</p>
                  {w.ipa && <p className="text-xs text-gray-700 font-mono mt-0.5">/{w.ipa}/</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Day-by-day review */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">
                Day {reviewDay + 1} of {generated.days?.length} — {generated.days?.[reviewDay]?.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReviewDay(d => Math.max(0, d - 1))}
                  disabled={reviewDay === 0}
                  className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-lg transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setReviewDay(d => Math.min((generated.days?.length || 1) - 1, d + 1))}
                  disabled={reviewDay >= (generated.days?.length || 1) - 1}
                  className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 rounded-lg transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Day navigator dots */}
            <div className="flex flex-wrap gap-1 mb-4">
              {(generated.days || []).map((d, i) => (
                <button
                  key={i}
                  onClick={() => setReviewDay(i)}
                  className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                    i === reviewDay
                      ? 'bg-blue-600 text-white'
                      : d.type === 'weekend_quiz'
                      ? 'bg-purple-900/50 text-purple-400 hover:bg-purple-800/50'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                  }`}
                  title={`Day ${d.day_number}: ${d.title}`}
                >
                  {d.day_number}
                </button>
              ))}
            </div>

            <DayReview day={generated.days?.[reviewDay]} words={generated.words} />
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : '💾 Save season as draft'}
            </button>
            <p className="text-xs text-gray-600">
              Saved as draft — submit for review before publishing.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Day review panel ──────────────────────────────────────────────────────────

function DayReview({ day, words }) {
  if (!day) return null

  const word = day.word_index ? words?.[day.word_index - 1] : null

  return (
    <div className="space-y-4">

      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          day.type === 'weekend_quiz'
            ? 'bg-purple-900/50 text-purple-300'
            : 'bg-blue-900/50 text-blue-300'
        }`}>
          {day.type === 'weekend_quiz' ? '🎉 Weekend quiz' : `📅 ${DOW_LABELS[day.dow] || 'Weekday'} · Daily challenge`}
        </span>
        <span className="text-xs text-gray-600">{day.date}</span>
      </div>

      {/* Word of the day */}
      {word && (
        <div className="p-4 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Word of the day</p>
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-bold text-white">{word.word}</span>
            <span className="text-xs text-gray-500">{word.part_of_speech}</span>
            {word.ipa && <span className="text-xs text-gray-600 font-mono">/{word.ipa}/</span>}
          </div>
          <p className="text-sm text-gray-400 mt-1">{word.definition}</p>
          {word.example && <p className="text-sm text-gray-600 italic mt-1">"{word.example}"</p>}
        </div>
      )}

      {/* Passage */}
      {day.passage && (
        <div className="p-4 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Mini passage</p>
          <p className="text-sm text-gray-300 leading-relaxed">{day.passage}</p>
        </div>
      )}

      {/* Comprehension questions */}
      {day.comprehension_questions?.length > 0 && (
        <div className="p-4 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-3">Comprehension ({day.comprehension_questions.length} questions)</p>
          <div className="space-y-3">
            {day.comprehension_questions.map((q, i) => (
              <QuestionPreview key={i} q={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Wild card */}
      {day.wild_card && (
        <div className="p-4 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">
            Wild card — {WILD_CARD_LABELS[day.wild_card_type] || day.wild_card_type}
          </p>
          <WildCardPreview type={day.wild_card_type} data={day.wild_card} />
        </div>
      )}

      {/* Weekend quiz */}
      {day.type === 'weekend_quiz' && (
        <div className="p-4 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-3">
            Weekend quiz ({(day.gk_questions?.length || 0) + (day.recap_questions?.length || 0)} questions)
          </p>
          <div className="space-y-3">
            {[...(day.gk_questions || []), ...(day.recap_questions || [])].map((q, i) => (
              <QuestionPreview key={i} q={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow's riddle */}
      {day.tomorrows_riddle && (
        <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Tomorrow's riddle</p>
          <p className="text-sm text-gray-400 italic">"{day.tomorrows_riddle}"</p>
        </div>
      )}
    </div>
  )
}

function QuestionPreview({ q, index }) {
  return (
    <div className="text-sm">
      <p className="text-gray-300 mb-1">
        <span className="text-gray-600 mr-2">{index + 1}.</span>
        {q.prompt}
      </p>
      <div className="ml-4 space-y-0.5">
        <p className="text-green-400 text-xs">✓ {q.answer}</p>
        {(q.distractors || []).map((d, i) => (
          <p key={i} className="text-gray-600 text-xs">✗ {d}</p>
        ))}
      </div>
      {q.explanation && (
        <p className="ml-4 mt-1 text-xs text-gray-600 italic">{q.explanation}</p>
      )}
    </div>
  )
}

function WildCardPreview({ type, data }) {
  if (!data) return null

  if (type === 'odd_one_out') return (
    <div className="text-sm">
      <div className="flex gap-2 flex-wrap mb-2">
        {(data.words || []).map((w, i) => (
          <span key={i} className={`px-2 py-1 rounded text-xs font-medium ${
            w === data.odd_one ? 'bg-red-900/50 text-red-300' : 'bg-gray-800 text-gray-300'
          }`}>{w}</span>
        ))}
      </div>
      <p className="text-xs text-gray-500">{data.explanation}</p>
    </div>
  )

  if (type === 'fill_gap') return (
    <div className="text-sm">
      <p className="text-gray-300 mb-1">{data.sentence_with_blank}</p>
      <p className="text-green-400 text-xs">✓ {data.answer}</p>
      {(data.distractors || []).map((d, i) => <p key={i} className="text-gray-600 text-xs">✗ {d}</p>)}
    </div>
  )

  if (type === 'word_formation') return (
    <div className="text-sm">
      <p className="text-gray-300 mb-1">{data.prompt}</p>
      <p className="text-xs text-gray-500">Root: <span className="text-white font-mono">{data.root_word}</span> → {data.target_pos}</p>
      <p className="text-green-400 text-xs mt-1">✓ {data.answer}</p>
    </div>
  )

  if (type === 'speed_burst') return (
    <div className="text-sm space-y-2">
      <p className="text-xs text-gray-500">{data.questions?.length} rapid questions</p>
      {(data.questions || []).slice(0, 3).map((q, i) => (
        <QuestionPreview key={i} q={q} index={i} />
      ))}
      {data.questions?.length > 3 && (
        <p className="text-xs text-gray-600">+{data.questions.length - 3} more…</p>
      )}
    </div>
  )

  if (type === 'translation') return (
    <div className="text-sm">
      <p className="text-gray-300">{data.native_hint}</p>
      <p className="text-green-400 text-xs mt-1">✓ {data.answer}</p>
    </div>
  )

  return <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
}

// ── Season detail view ────────────────────────────────────────────────────────

function SeasonDetail({ season, onBack }) {
  const [challenges, setChallenges] = useState([])
  const [words,      setWords]      = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('daily_challenges').select('*').eq('season_id', season.id).order('day_number'),
      supabase.from('season_words').select('*').eq('season_id', season.id).order('day_introduced'),
    ]).then(([{ data: c }, { data: w }]) => {
      setChallenges(c || [])
      setWords(w || [])
      setLoading(false)
    })
  }, [season.id])

  async function updateStatus(newStatus) {
    await supabase.from('seasons').update({ status: newStatus }).eq('id', season.id)
    onBack()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors text-sm">← Back</button>
        <span className="text-3xl">{season.emoji}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{season.title}</h1>
          <p className="text-sm text-gray-500">
            {formatDate(season.starts_at)} → {formatDate(season.ends_at)} · {season.level}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOURS[season.status] || STATUS_COLOURS.draft}`}>
          {season.status}
        </span>
      </div>

      {/* Status actions */}
      <div className="flex gap-2 mb-8">
        {season.status === 'draft' && (
          <button onClick={() => updateStatus('in_review')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-lg transition-colors">
            Submit for review
          </button>
        )}
        {season.status === 'in_review' && (
          <>
            <button onClick={() => updateStatus('published')}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">
              ✓ Approve + publish
            </button>
            <button onClick={() => updateStatus('changes_requested')}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
              Request changes
            </button>
          </>
        )}
        {season.status === 'published' && (
          <button onClick={() => updateStatus('archived')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors">
            Archive
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-900 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Words */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Words ({words.length})</h3>
            <div className="grid grid-cols-3 gap-2">
              {words.map(w => (
                <div key={w.id} className="px-3 py-2 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{w.word}</span>
                    <span className="text-xs text-gray-600">Day {w.day_introduced}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{w.definition}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge list */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Challenges ({challenges.length})</h3>
            <div className="space-y-1">
              {challenges.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2 bg-gray-900 rounded-lg text-sm">
                  <span className="text-gray-600 w-8">D{c.day_number}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    c.challenge_type === 'weekend_quiz'
                      ? 'bg-purple-900/40 text-purple-400'
                      : 'bg-blue-900/40 text-blue-400'
                  }`}>
                    {c.challenge_type === 'weekend_quiz' ? 'Weekend' : c.wild_card_type || 'Daily'}
                  </span>
                  <span className="text-gray-300 flex-1">{c.title}</span>
                  <span className="text-xs text-gray-600">{c.challenge_date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Save question set helper ──────────────────────────────────────────────────

async function saveQuestionSet(name, questions, userId, seasonId) {
  const { data: set } = await supabase
    .from('content_sets')
    .insert({
      name,
      school_id:  null,
      created_by: userId,
      status:     'draft',
    })
    .select()
    .single()

  if (!set) return null

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const { data: item } = await supabase
      .from('content_items')
      .insert({
        task_type:  q.type === 'true_false' ? 'true_false' : 'mcq',
        prompt:     q.prompt,
        answer:     q.answer,
        distractors: q.distractors || null,
        explanation: q.explanation || null,
      })
      .select()
      .single()

    if (item) {
      await supabase.from('content_set_items').insert({
        set_id:   set.id,
        item_id:  item.id,
        position: i,
      })
    }
  }

  return set.id
}
