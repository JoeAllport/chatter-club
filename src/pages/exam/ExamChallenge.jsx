// ExamChallenge.jsx — Daily Exam Challenge (/exam/challenge)
// Option C: skills-first, Cambridge-anchored, difficulty-selectable
// 5 questions per day: one per skill type, seeded by date (same Qs all day for everyone)
// Difficulty: B1 (PET) / B2 (FCE) / C1 (CAE) — stored in localStorage
// Streak: stored in localStorage

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PageMeta from '../../components/PageMeta'

// ── Constants ─────────────────────────────────────────────────────────────────

const SKILL_SLOTS = [
  { key: 'open_cloze',     types: ['open_cloze', 'fill_in'],   label: 'Open Cloze',            part: 'Part 2', partNum: 2, icon: '✏️',  desc: 'Write the missing word.' },
  { key: 'mcq',            types: ['mcq'],                     label: 'Multiple Choice',        part: 'Part 1', partNum: 1, icon: '💬',  desc: 'Choose the word that best fits.' },
  { key: 'word_formation', types: ['word_formation'],          label: 'Word Formation',         part: 'Part 3', partNum: 3, icon: '📝',  desc: 'Change the word in capitals.' },
  { key: 'transformation', types: ['transformation'],          label: 'Key Word',               part: 'Part 4', partNum: 4, icon: '🔑',  desc: 'Rewrite using the key word.' },
  { key: 'fill_cloze',     types: ['open_cloze', 'fill_in', 'mcq'], label: 'Use of English',   part: 'Part 2', partNum: 2, icon: '⚡',  desc: 'Complete the sentence.' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'B1', label: 'B1',  exam: 'Cambridge B1 Preliminary', colour: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'B2', label: 'B2',  exam: 'Cambridge B2 First',       colour: 'bg-blue-100 text-blue-700 border-blue-200'   },
  { value: 'C1', label: 'C1',  exam: 'Cambridge C1 Advanced',    colour: 'bg-violet-100 text-violet-800 border-violet-200' },
]

const PART_COLOURS = {
  1: 'bg-blue-50 text-blue-700 border-blue-200',
  2: 'bg-violet-50 text-violet-700 border-violet-200',
  3: 'bg-orange-50 text-orange-700 border-orange-200',
  4: 'bg-rose-50 text-rose-700 border-rose-200',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10)  // "2026-06-20"
}

function seededShuffle(arr, seed) {
  // Deterministic Fisher-Yates using a simple LCG seeded by date string
  let s = [...arr]
  let rng = seed
  for (let i = s.length - 1; i > 0; i--) {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(rng) % (i + 1);
    [s[i], s[j]] = [s[j], s[i]]
  }
  return s
}

function dateSeed() {
  const d = todayKey()
  return d.split('-').reduce((acc, n) => acc * 31 + parseInt(n), 7)
}

function getStreak() {
  try {
    const raw = localStorage.getItem('exam_challenge_streak')
    return raw ? JSON.parse(raw) : { count: 0, lastDate: null }
  } catch { return { count: 0, lastDate: null } }
}

function updateStreak(completedDate) {
  const { count, lastDate } = getStreak()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yKey = yesterday.toISOString().slice(0, 10)

  let newCount = 1
  if (lastDate === yKey) newCount = count + 1       // continued streak
  else if (lastDate === completedDate) newCount = count  // already done today

  const next = { count: newCount, lastDate: completedDate }
  localStorage.setItem('exam_challenge_streak', JSON.stringify(next))
  return next
}

function getDoneToday() {
  try {
    const raw = localStorage.getItem(`exam_challenge_done_${todayKey()}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDoneToday(answers, items) {
  const result = { answers, score: 0 }
  items.forEach(item => {
    const a = answers[item.id]
    if (a !== undefined && a.toLowerCase() === (item.answer || '').toLowerCase()) {
      result.score++
    }
  })
  localStorage.setItem(`exam_challenge_done_${todayKey()}`, JSON.stringify(result))
  return result
}

// ── Score message ─────────────────────────────────────────────────────────────

function scoreMessage(score, total) {
  const pct = score / total
  if (pct === 1)   return { emoji: '🏆', msg: 'Perfect score! Exceptional work.' }
  if (pct >= 0.8)  return { emoji: '⭐', msg: 'Excellent — almost perfect.' }
  if (pct >= 0.6)  return { emoji: '✅', msg: 'Good work — keep it up.' }
  if (pct >= 0.4)  return { emoji: '📚', msg: 'Not bad — review your weak spots.' }
  return                  { emoji: '💪', msg: 'Keep practising — it adds up.' }
}

// ── Exercise renderers ────────────────────────────────────────────────────────

function MCQStep({ item, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const options = item.options || []

  function pick(opt) {
    if (selected !== null) return
    setSelected(opt)
    setTimeout(() => onAnswer(item.id, opt), 700)
  }

  const isAnswered = selected !== null

  return (
    <div>
      <p className="text-base text-gray-800 font-medium leading-relaxed mb-5">{item.content}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const letter    = ['A', 'B', 'C', 'D'][i]
          const isCorrect = opt === item.answer
          const isSelected= selected === opt
          return (
            <button
              key={i}
              onClick={() => pick(opt)}
              disabled={isAnswered}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                isAnswered
                  ? isCorrect
                    ? 'bg-green-100 border-green-400 text-green-800 font-semibold'
                    : isSelected
                      ? 'bg-red-100 border-red-400 text-red-800'
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <span className="font-bold mr-2">{letter}.</span>{opt}
            </button>
          )
        })}
      </div>
      {isAnswered && item.explanation && (
        <p className="mt-4 text-sm text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          💡 {item.explanation}
        </p>
      )}
    </div>
  )
}

function ClozeStep({ item, onAnswer }) {
  const [input,     setInput]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const isCorrect = submitted && input.trim().toLowerCase() === (item.answer || '').toLowerCase()

  function check() {
    if (!input.trim() || submitted) return
    setSubmitted(true)
    setTimeout(() => onAnswer(item.id, input.trim().toLowerCase()), 800)
  }

  return (
    <div>
      <p className="text-base text-gray-800 font-medium leading-relaxed mb-5">{item.content}</p>
      <div className={`flex gap-2 rounded-xl border p-1 transition-all ${
        submitted
          ? isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}>
        <input
          autoFocus
          type="text"
          value={input}
          onChange={e => !submitted && setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          disabled={submitted}
          placeholder="Type your answer…"
          className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none disabled:text-gray-500"
        />
        {!submitted && (
          <button
            onClick={check}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            Check
          </button>
        )}
      </div>
      {submitted && (
        <div className="mt-3 text-sm">
          {isCorrect
            ? <p className="text-green-700 font-semibold">✓ Correct!</p>
            : <p className="text-red-700">Correct answer: <strong>{item.answer}</strong></p>
          }
          {item.explanation && (
            <p className="mt-2 text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              💡 {item.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Transformation — show key word, two blanks to fill
function TransformStep({ item, onAnswer }) {
  const [input,     setInput]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  // answer may be "2–5 words including key word" — check loosely
  const normalise = s => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const isCorrect = submitted && normalise(input) === normalise(item.answer || '')

  function check() {
    if (!input.trim() || submitted) return
    setSubmitted(true)
    setTimeout(() => onAnswer(item.id, normalise(input)), 800)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">Rewrite the sentence using the key word. Do not change the key word.</p>
      <p className="text-base text-gray-800 font-medium leading-relaxed mb-4">{item.content}</p>
      {item.options?.[0] && (
        <div className="inline-block bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold px-3 py-1.5 rounded-lg mb-4 uppercase tracking-wide">
          {item.options[0]}
        </div>
      )}
      <div className={`flex gap-2 rounded-xl border p-1 transition-all ${
        submitted
          ? isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}>
        <input
          autoFocus
          type="text"
          value={input}
          onChange={e => !submitted && setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          disabled={submitted}
          placeholder="2–5 words including the key word…"
          className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none disabled:text-gray-500"
        />
        {!submitted && (
          <button
            onClick={check}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            Check
          </button>
        )}
      </div>
      {submitted && (
        <div className="mt-3 text-sm">
          {isCorrect
            ? <p className="text-green-700 font-semibold">✓ Correct!</p>
            : <p className="text-red-700">Model answer: <strong>{item.answer}</strong></p>
          }
          {item.explanation && (
            <p className="mt-2 text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              💡 {item.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StepRenderer({ item, slot, onAnswer }) {
  if (!item) return null
  if (slot.key === 'mcq') return <MCQStep item={item} onAnswer={onAnswer} />
  if (slot.key === 'transformation') return <TransformStep item={item} onAnswer={onAnswer} />
  return <ClozeStep item={item} onAnswer={onAnswer} />
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            i < current ? 'bg-amber-400' : i === current ? 'bg-amber-200' : 'bg-gray-100'
          }`}
        />
      ))}
    </div>
  )
}

// ── Results screen ────────────────────────────────────────────────────────────

function ResultsScreen({ items, answers, difficulty, streak }) {
  const total   = items.length
  const correct = items.filter(item => {
    const a = answers[item.id]
    return a !== undefined && a.toLowerCase() === (item.answer || '').toLowerCase()
  }).length
  const { emoji, msg } = scoreMessage(correct, total)
  const diffMeta = DIFFICULTY_OPTIONS.find(d => d.value === difficulty)

  return (
    <div className="animate-in fade-in duration-300">
      {/* Score */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{emoji}</div>
        <div className="text-4xl font-bold text-gray-950 mb-1">{correct}/{total}</div>
        <p className="text-gray-500 text-sm">{msg}</p>
        {streak.count > 1 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full">
            🔥 {streak.count}-day streak
          </div>
        )}
      </div>

      {/* Review */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Review</h2>
        <div className="space-y-3">
          {items.map((item, i) => {
            const slot      = SLOT_BY_INDEX[i]
            const given     = answers[item.id]
            const isCorrect = given !== undefined && given.toLowerCase() === (item.answer || '').toLowerCase()
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${PART_COLOURS[slot.partNum] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {slot.part}
                  </span>
                  <span className={`text-xs font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">{item.content}</p>
                {!isCorrect && (
                  <p className="text-xs text-gray-500">
                    Your answer: <span className="text-red-600 font-medium">{given || '—'}</span>
                    {' · '}Correct: <span className="text-green-700 font-medium">{item.answer}</span>
                  </p>
                )}
                {item.explanation && (
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">💡 {item.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Next actions */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <Link
          to="/exam/grammar"
          className="block text-center px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
        >
          Grammar reference →
        </Link>
        <Link
          to="/exam"
          className="block text-center px-5 py-3 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors"
        >
          Back to Exam Centre
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400">
        Come back tomorrow for a new challenge.
      </p>
    </div>
  )
}

// Keep a slot-by-index lookup for results screen
const SLOT_BY_INDEX = SKILL_SLOTS

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="space-y-2 mt-6">
        {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl border border-gray-100" />)}
      </div>
    </div>
  )
}

// ── Already done screen ───────────────────────────────────────────────────────

function AlreadyDoneScreen({ result, streak, difficulty, onRedo }) {
  const { emoji, msg } = scoreMessage(result.score, 5)
  return (
    <div className="text-center py-6">
      <div className="text-4xl mb-3">{emoji}</div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">You've done today's challenge</h2>
      <p className="text-gray-500 text-sm mb-2">{result.score}/5 correct — {msg}</p>
      {streak.count > 0 && (
        <div className="my-4 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full">
          🔥 {streak.count}-day streak
        </div>
      )}
      <p className="text-xs text-gray-400 mb-6">Come back tomorrow for a new challenge.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRedo}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Practice again (unscored)
        </button>
        <Link
          to="/exam/grammar"
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
        >
          Grammar reference →
        </Link>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExamChallenge() {
  const [difficulty, setDifficulty] = useState(() => {
    try { return localStorage.getItem('exam_challenge_difficulty') || 'B2' } catch { return 'B2' }
  })
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [step,       setStep]       = useState(0)          // 0–4 = questions, 5 = results
  const [answers,    setAnswers]    = useState({})
  const [streak,     setStreak]     = useState(() => getStreak())
  const [doneToday,  setDoneToday]  = useState(() => getDoneToday())
  const [redo,       setRedo]       = useState(false)      // allow re-practice unscored

  const diffMeta = DIFFICULTY_OPTIONS.find(d => d.value === difficulty) || DIFFICULTY_OPTIONS[1]

  // Load questions for today's challenge
  const loadQuestions = useCallback(async (diff) => {
    setLoading(true)
    setStep(0)
    setAnswers({})

    const seed = dateSeed()
    const selected = []

    // Fetch a pool per slot, then pick one from each via seeded shuffle
    for (let i = 0; i < SKILL_SLOTS.length; i++) {
      const slot = SKILL_SLOTS[i]
      const { data } = await supabase
        .from('grammar_items')
        .select('id, content, answer, options, explanation, skill_type, difficulty, grammar_point')
        .in('skill_type', slot.types)
        .eq('difficulty', diff)
        .limit(50)

      if (data && data.length > 0) {
        // Seed shuffle so same questions appear all day
        const shuffled = seededShuffle(data, seed + i * 999)
        selected.push(shuffled[0])
      }
    }

    setItems(selected)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadQuestions(difficulty)
  }, [difficulty, loadQuestions])

  function handleDifficulty(val) {
    setDifficulty(val)
    setDoneToday(getDoneToday())  // re-check (different date key doesn't matter, same day)
    localStorage.setItem('exam_challenge_difficulty', val)
  }

  function handleAnswer(id, value) {
    const next = { ...answers, [id]: value }
    setAnswers(next)

    // Auto-advance after a short pause
    setTimeout(() => {
      if (step < items.length - 1) {
        setStep(s => s + 1)
      } else {
        // All done
        if (!redo) {
          const result = saveDoneToday(next, items)
          const newStreak = updateStreak(todayKey())
          setStreak(newStreak)
          setDoneToday(result)
        }
        setStep(items.length)
      }
    }, 900)
  }

  const isComplete = step >= items.length && items.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <PageMeta
        title="Daily Exam Challenge — Cambridge Grammar Practice"
        description="Five Cambridge-format questions every day — open cloze, multiple choice, word formation, key word transformation. Free, no sign-up. B1, B2, C1."
        canonical="/exam/challenge"
      />

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Daily challenge · Free</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-3">Daily Exam Challenge</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Five Cambridge-format questions — one for each core skill. A new set every day.
        </p>
      </div>

      {/* Difficulty selector */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-xs text-gray-400 font-medium mr-1">Level</span>
        {DIFFICULTY_OPTIONS.map(d => (
          <button
            key={d.value}
            onClick={() => handleDifficulty(d.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              difficulty === d.value
                ? d.colour
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
            }`}
          >
            {d.label}
          </button>
        ))}
        <span className="text-xs text-gray-400 hidden sm:inline">{diffMeta.exam}</span>
      </div>

      {/* Already done today */}
      {doneToday && !redo && !isComplete ? (
        <AlreadyDoneScreen
          result={doneToday}
          streak={streak}
          difficulty={difficulty}
          onRedo={() => { setRedo(true); setStep(0); setAnswers({}) }}
        />
      ) : (
        <>
          {/* Progress */}
          {!isComplete && items.length > 0 && (
            <ProgressBar current={step} total={items.length} />
          )}

          {/* Step indicator */}
          {!isComplete && items.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              {(() => {
                const slot = SKILL_SLOTS[step]
                return (
                  <>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${PART_COLOURS[slot.partNum] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {slot.part}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{slot.label}</span>
                    <span className="text-xs text-gray-400">· {slot.desc}</span>
                  </>
                )
              })()}
              <span className="ml-auto text-xs text-gray-400">{step + 1} of {items.length}</span>
            </div>
          )}

          {/* Content area */}
          {loading ? (
            <LoadingSkeleton />
          ) : items.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-4">📚</p>
              <h2 className="text-lg font-bold text-gray-800 mb-2">No questions yet for {difficulty}</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                We're adding more questions to the bank every week.
                Try a different level or check back soon.
              </p>
              <div className="flex gap-2 justify-center">
                {DIFFICULTY_OPTIONS.filter(d => d.value !== difficulty).map(d => (
                  <button
                    key={d.value}
                    onClick={() => handleDifficulty(d.value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${d.colour}`}
                  >
                    Try {d.label}
                  </button>
                ))}
              </div>
            </div>
          ) : isComplete ? (
            <ResultsScreen
              items={items}
              answers={answers}
              difficulty={difficulty}
              streak={streak}
            />
          ) : (
            <div key={step} className="animate-in fade-in duration-200">
              <StepRenderer
                item={items[step]}
                slot={SKILL_SLOTS[step]}
                onAnswer={handleAnswer}
              />
            </div>
          )}
        </>
      )}

      {/* What to expect — shown before starting */}
      {!loading && !isComplete && !doneToday && step === 0 && items.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Today's 5 skills</h2>
          <div className="space-y-2">
            {SKILL_SLOTS.map((slot, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 ${PART_COLOURS[slot.partNum] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {slot.part}
                </span>
                <span className="font-medium text-gray-700">{slot.label}</span>
                <span className="text-gray-400 text-xs">{slot.desc}</span>
              </div>
            ))}
          </div>

          {streak.count > 0 && (
            <div className="mt-6 flex items-center gap-2 text-sm text-amber-600">
              <span className="text-lg">🔥</span>
              <span className="font-semibold">{streak.count}-day streak</span>
              <span className="text-gray-400">— keep it going</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
