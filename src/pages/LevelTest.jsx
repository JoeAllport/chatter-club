import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAdaptiveTest, LEVELS } from '../hooks/useAdaptiveTest'
import PageMeta from '../components/PageMeta'

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_TEST_SET_NAME = 'Level Test Items'

const LEVEL_COLOURS = {
  A1:   { bg: 'bg-pink-500',   text: 'text-pink-500',   ring: 'ring-pink-200',   label: 'bg-pink-100 text-pink-800' },
  A2:   { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-200', label: 'bg-orange-100 text-orange-800' },
  B1:   { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-200', label: 'bg-yellow-100 text-yellow-800' },
  'B1+':{ bg: 'bg-yellow-500', text: 'text-yellow-700', ring: 'ring-yellow-300', label: 'bg-yellow-100 text-yellow-900' },
  B2:   { bg: 'bg-green-500',  text: 'text-green-600',  ring: 'ring-green-200',  label: 'bg-green-100 text-green-800' },
  'B2+':{ bg: 'bg-green-600',  text: 'text-green-700',  ring: 'ring-green-300',  label: 'bg-green-100 text-green-900' },
  C1:   { bg: 'bg-blue-500',   text: 'text-blue-600',   ring: 'ring-blue-200',   label: 'bg-blue-100 text-blue-800' },
  C2:   { bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-200', label: 'bg-purple-100 text-purple-800' },
}

const LEVEL_DESCRIPTIONS = {
  A1:   'Beginner',
  A2:   'Elementary',
  B1:   'Intermediate',
  'B1+':'Upper-Intermediate (lower)',
  B2:   'Upper-Intermediate',
  'B2+':'Advanced (lower)',
  C1:   'Advanced',
  C2:   'Proficiency',
}

const SKILL_LABELS = {
  vocabulary: { label: 'Vocabulary', emoji: '📖' },
  usage:      { label: 'Language use', emoji: '✍️' },
  grammar:    { label: 'Grammar', emoji: '🔧' },
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LevelTest() {
  const navigate = useNavigate()
  const [items,    setItems]    = useState(null)   // null = loading, [] = error
  const [started,  setStarted]  = useState(false)
  const [loadErr,  setLoadErr]  = useState('')

  const test = useAdaptiveTest(items || [])

  // ── Load all level-test items via join table ──────────────────────────────
  useEffect(() => {
    async function load() {
      // 1. Find the content set by name
      const { data: set, error: setErr } = await supabase
        .from('content_sets')
        .select('id')
        .eq('name', LEVEL_TEST_SET_NAME)
        .maybeSingle()

      if (setErr || !set) {
        setLoadErr(setErr?.message || 'Level test content set not found. Run migration 034b first.')
        setItems([])
        return
      }

      // 2. Load items via join table
      const { data, error } = await supabase
        .from('content_set_items')
        .select('item:content_items(id, task_type, prompt, answer, distractors, level, tags)')
        .eq('set_id', set.id)

      if (error) { setLoadErr(error.message); setItems([]); return }
      setItems((data || []).map(row => row.item).filter(Boolean))
    }
    load()
  }, [])

  // ── Start the test ────────────────────────────────────────────────────────
  function handleStart() {
    if (!items?.length) return
    test.init(items)
    setStarted(true)
  }

  // ── Answer forwarded from renderer ────────────────────────────────────────
  function handleAnswer(correct, given) {
    test.answer(correct, given, items)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (items === null) {
    return (
      <PageShell>
        <PageMeta
          title="English Level Test"
          description="Find your CEFR level in 10 minutes. Adaptive test from A1 to C2 — no sign-up required."
          canonical="/level-test"
        />
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-sm text-gray-400 animate-pulse">Loading questions…</p>
        </div>
      </PageShell>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (loadErr) {
    return (
      <PageShell>
        <div className="text-center py-16">
          <p className="text-sm text-red-500 mb-4">{loadErr}</p>
          <Link to="/articles" className="text-sm text-gray-400 hover:text-gray-700">← Back to articles</Link>
        </div>
      </PageShell>
    )
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (test.isDone && test.result) {
    return (
      <PageShell minimal>
        <ResultScreen
          result={test.result}
          onRetake={() => { test.restart(items) }}
          onSignUp={() => navigate('/join')}
        />
      </PageShell>
    )
  }

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <PageShell>
        <IntroScreen onStart={handleStart} itemCount={items.length} />
      </PageShell>
    )
  }

  // ── Active test ───────────────────────────────────────────────────────────
  return (
    <PageShell minimal>
      <ActiveTest
        item={test.currentItem}
        progress={test.progress}
        onAnswer={handleAnswer}
      />
    </PageShell>
  )
}

// ── PageShell ─────────────────────────────────────────────────────────────────

function PageShell({ children, minimal = false }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!minimal && (
        <header className="border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link to="/articles" className="text-lg font-bold text-gray-950 tracking-tight">
              Chatter Club
            </Link>
            <Link to="/join" className="text-sm px-3.5 py-1.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
              Join free
            </Link>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}

// ── Intro screen ──────────────────────────────────────────────────────────────

function IntroScreen({ onStart, itemCount }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="text-6xl mb-6">🎓</div>
      <h1 className="text-3xl font-bold text-gray-950 mb-3">What's your English level?</h1>
      <p className="text-gray-500 mb-8 leading-relaxed">
        Answer a short series of questions. The test adapts to your answers — harder if you're doing well, easier if you need more support. Takes about 5 minutes.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-10 text-left">
        {[
          { icon: '⚡', title: '5 minutes', desc: 'Short adaptive test' },
          { icon: '🎯', title: 'Accurate', desc: 'Adjusts to your level' },
          { icon: '📊', title: 'Breakdown', desc: 'Vocab, grammar & usage' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="text-sm font-semibold text-gray-900">{f.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{f.desc}</div>
          </div>
        ))}
      </div>

      {itemCount < 5 && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          ⚠️ Not enough test items loaded. Please run the seed migration first.
        </div>
      )}

      <button
        onClick={onStart}
        disabled={itemCount < 5}
        className="w-full h-14 bg-gray-900 text-white rounded-2xl text-base font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
      >
        Start the test →
      </button>

      <p className="text-xs text-gray-400">
        No account needed. Results are saved if you sign up.
      </p>
    </div>
  )
}

// ── Active test ───────────────────────────────────────────────────────────────

function ActiveTest({ item, progress, onAnswer }) {
  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">Loading next question…</p>
      </div>
    )
  }

  const pct = Math.round((progress.answered / progress.total) * 100)

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-1 bg-gray-900 transition-all duration-500"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>

      {/* Counter */}
      <div className="max-w-xl mx-auto w-full px-6 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">Question {progress.answered + 1}</span>
        <span className="text-xs text-gray-300">~{progress.total} total</span>
      </div>

      {/* Question card */}
      <div className="flex-1 flex items-start justify-center pb-16 pt-4">
        <div className="w-full max-w-xl px-2">
          <QuestionRenderer item={item} onAnswer={onAnswer} key={item.id} />
        </div>
      </div>
    </div>
  )
}

// ── Question renderer dispatcher ──────────────────────────────────────────────
// Inline slim renderers — only the 4 task types used in the level test.
// Run in "exam" mode so answers are immediate (no self-reveal feedback).

function QuestionRenderer({ item, onAnswer }) {
  switch (item.task_type) {
    case 'mcq':
      return <LevelMCQ item={item} onAnswer={onAnswer} />
    case 'true_false_ng':
      return <LevelTFNG item={item} onAnswer={onAnswer} />
    case 'collocation':
      return <LevelCollocation item={item} onAnswer={onAnswer} />
    case 'error_correction':
      return <LevelErrorCorrection item={item} onAnswer={onAnswer} />
    default:
      return <LevelMCQ item={item} onAnswer={onAnswer} />
  }
}

// ── MCQ renderer ──────────────────────────────────────────────────────────────

function LevelMCQ({ item, onAnswer }) {
  const [options] = useState(() => shuffle([item.answer, ...(item.distractors || [])].slice(0, 4)))

  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-2">
        <p className="text-base font-medium text-gray-900 leading-relaxed">{item.prompt}</p>
      </div>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onAnswer(opt === item.answer, opt)}
          className="w-full text-left px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ── True / False / Not Given renderer ────────────────────────────────────────

function LevelTFNG({ item, onAnswer }) {
  const OPTIONS = ['True', 'False', 'Not Given']
  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Is this statement True, False, or Not Given?</p>
        <p className="text-base font-medium text-gray-900 leading-relaxed">{item.prompt}</p>
      </div>
      {OPTIONS.map(opt => (
        <button
          key={opt}
          onClick={() => onAnswer(opt === item.answer, opt)}
          className="w-full py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ── Collocation renderer ──────────────────────────────────────────────────────

function LevelCollocation({ item, onAnswer }) {
  const [options] = useState(() => shuffle([item.answer, ...(item.distractors || [])].slice(0, 4)))
  const parts = item.prompt.split('___')

  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-2 text-center">
        <p className="text-base font-semibold text-gray-900 leading-8">
          {parts[0]}
          <span className="inline-block mx-1 px-3 py-0.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-400">
            ___
          </span>
          {parts[1]}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAnswer(opt === item.answer, opt)}
            className="py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Error correction renderer ─────────────────────────────────────────────────

function LevelErrorCorrection({ item, onAnswer }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  function check() {
    if (!value.trim()) return
    const isCorrect = value.trim().toLowerCase() === item.answer.trim().toLowerCase()
    onAnswer(isCorrect, value.trim())
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-1">
        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
          Find and correct the error
        </p>
        <p className="text-base font-medium text-gray-900 leading-relaxed">{item.prompt}</p>
        {(item.distractors || [])[0] && (
          <p className="text-xs text-amber-600 mt-2">Hint: {item.distractors[0]}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && check()}
        placeholder="Type the corrected sentence…"
        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
      />
      <button
        onClick={check}
        disabled={!value.trim()}
        className="w-full py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit →
      </button>
    </div>
  )
}

// ── Result screen ─────────────────────────────────────────────────────────────

function ResultScreen({ result, onRetake, onSignUp }) {
  const { level, skillScores, log } = result
  const colours = LEVEL_COLOURS[level] || LEVEL_COLOURS['B1']

  const [email,    setEmail]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [saveErr,  setSaveErr]  = useState('')
  const [copied,   setCopied]   = useState(false)
  const [userId,   setUserId]   = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id || null
      setUserId(uid)
      if (uid) {
        // Auto-save result + update cefr_level
        saveResult(uid)
      }
    })
  }, [])

  async function saveResult(uid) {
    const token = Math.random().toString(36).slice(2, 10)
    await Promise.all([
      supabase.from('level_test_results').insert({
        user_id:          uid || null,
        session_token:    token,
        determined_level: level,
        skill_scores:     skillScores,
        answer_log:       log,
        questions_asked:  log.length,
      }),
      uid && supabase.from('user_profiles').upsert({
        user_id:    uid,
        cefr_level: level,
      }, { onConflict: 'user_id' }),
    ])
  }

  async function handleSaveEmail(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSaveErr('')
    setSending(true)

    // Send magic link — on sign-up, cefr_level passed as metadata
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
        data: { cefr_level: level }, // stored in user_metadata
      },
    })

    setSending(false)
    if (error) {
      setSaveErr(error.message)
    } else {
      // Also save anonymous result with their email for linking later
      await saveResult(null)
      setSent(true)
    }
  }

  function handleShare() {
    const text = `I just took the Chatter Club English Level Test and scored ${level} (${LEVEL_DESCRIPTIONS[level]})! 🎓 Find out your level:`
    const url  = `${window.location.origin}/level-test`
    if (navigator.share) {
      navigator.share({ title: 'My English Level', text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  const correctCount = log.filter(e => e.correct).length

  return (
    <div className="max-w-lg mx-auto px-6 py-10">

      {/* ── Level badge ─────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full ${colours.bg} ring-8 ${colours.ring} mb-5`}>
          <span className="text-4xl font-black text-white tracking-tight">{level}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-950 mb-1">
          Your level is <span className={colours.text}>{level}</span>
        </h1>
        <p className="text-gray-400 text-sm">{LEVEL_DESCRIPTIONS[level]}</p>
        <p className="text-xs text-gray-300 mt-1">
          {correctCount} of {log.length} questions correct
        </p>
      </div>

      {/* ── Skill breakdown ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your skill breakdown</h2>
        <div className="flex flex-col gap-3">
          {Object.entries(SKILL_LABELS).map(([key, { label, emoji }]) => {
            const score = skillScores?.[key]
            if (score === null || score === undefined) return null
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{emoji} {label}</span>
                  <span className="text-sm font-bold text-gray-900">{score}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      score >= 70 ? 'bg-green-500' :
                      score >= 45 ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CEFR scale ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Where you sit on the CEFR scale</h2>
        <div className="flex items-end gap-1">
          {LEVELS.map((l, i) => {
            const isYou = l === level
            const col   = LEVEL_COLOURS[l] || LEVEL_COLOURS['B1']
            const height = [20, 28, 36, 42, 52, 60, 72, 88][i] || 36
            return (
              <div key={l} className="flex flex-col items-center flex-1 gap-1">
                <div
                  className={`w-full rounded-t-lg transition-all ${isYou ? col.bg : 'bg-gray-100'}`}
                  style={{ height: `${height}px` }}
                />
                <span className={`text-[10px] font-bold ${isYou ? col.text : 'text-gray-300'}`}>{l}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Save / sign-up ───────────────────────────────────────────────── */}
      {!userId && !sent && (
        <div className="bg-gray-950 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-base font-bold mb-1">Save your result 📬</h2>
          <p className="text-sm text-gray-400 mb-4">
            Get articles matched to your level. We'll send a sign-in link — no password needed.
          </p>
          {saveErr && (
            <p className="text-xs text-red-400 mb-3">{saveErr}</p>
          )}
          <form onSubmit={handleSaveEmail} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="h-11 px-5 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {sending ? '…' : 'Save →'}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Already have an account?{' '}
            <button onClick={onSignUp} className="underline hover:text-gray-300">Sign in</button>
          </p>
        </div>
      )}

      {sent && (
        <div className="bg-gray-950 rounded-2xl p-6 mb-6 text-white text-center">
          <div className="text-3xl mb-2">📬</div>
          <p className="text-sm font-semibold mb-1">Check your inbox!</p>
          <p className="text-xs text-gray-400">
            We've sent a sign-in link to <strong>{email}</strong>. Click it to create your account and save your {level} result.
          </p>
        </div>
      )}

      {userId && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-6 text-center">
          <p className="text-sm font-semibold text-green-800">✓ Result saved to your account</p>
          <p className="text-xs text-green-600 mt-0.5">Your feed is now calibrated to {level}</p>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="w-full h-12 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          {copied ? '✓ Copied to clipboard!' : '🔗 Share your result'}
        </button>
        <Link
          to="/articles"
          className="w-full h-12 bg-gray-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
        >
          Read articles at your level →
        </Link>
        <button
          onClick={onRetake}
          className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-2"
        >
          Retake the test
        </button>
      </div>

    </div>
  )
}
