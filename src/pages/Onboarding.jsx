import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPPORTED_LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'pl', flag: '🇵🇱', label: 'Polish' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'it', flag: '🇮🇹', label: 'Italian' },
  { code: 'pt', flag: '🇧🇷', label: 'Portuguese' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic' },
]

const GOALS = [
  {
    value: 'general',
    emoji: '📖',
    label: 'General English',
    description: 'Improve everyday reading, vocabulary, and comprehension',
  },
  {
    value: 'cambridge_b2',
    emoji: '🎓',
    label: 'Cambridge B2 First',
    description: 'Prepare for the Cambridge B2 First (FCE) exam',
  },
  {
    value: 'business',
    emoji: '💼',
    label: 'Business English',
    description: 'Professional vocabulary for the workplace',
  },
  {
    value: 'travel',
    emoji: '✈️',
    label: 'Travel & Culture',
    description: 'Real-world English for trips, conversations, and culture',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate()

  const [step,       setStep]       = useState(1) // 1 = name, 2 = language, 3 = goal, 4 = level test offer
  const [userId,     setUserId]     = useState(null)
  const [checking,   setChecking]   = useState(true)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [nativeLang,  setNativeLang]  = useState('')
  const [goal,        setGoal]        = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id || null
      if (!uid) {
        navigate('/join', { replace: true })
        return
      }
      setUserId(uid)

      // Pre-fill display name from Google profile if available
      const name = data.user?.user_metadata?.full_name
        || data.user?.user_metadata?.name
        || ''
      setDisplayName(name)

      setChecking(false)
    })
  }, [navigate])

  // ── Save to Supabase then advance to level test offer ─────────────────────
  async function handleFinishStep3() {
    if (!goal) return
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('user_profiles').upsert({
      user_id:       userId,
      display_name:  displayName.trim() || 'Learner',
      native_lang:   nativeLang || null,
      learning_goal: goal,
    }, { onConflict: 'user_id' })

    setSaving(false)

    if (err) {
      setError(err.message)
    } else {
      setStep(4) // show level test offer
    }
  }

  // ── Guard: still checking session ──────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
      </div>
    )
  }

  const totalSteps = 3
  const progress   = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-gray-900 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* ── Step 1: Display name ─────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="mb-8 text-center">
                <div className="text-4xl mb-3">👋</div>
                <h1 className="text-2xl font-bold text-gray-950 mb-2">What should we call you?</h1>
                <p className="text-sm text-gray-500">
                  This is how you'll appear on Chatter Club.
                </p>
              </div>

              <input
                type="text"
                placeholder="Your name or nickname"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                autoFocus
                maxLength={40}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition mb-4"
              />

              <button
                onClick={() => setStep(2)}
                disabled={!displayName.trim()}
                className="w-full h-11 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>

              <button
                onClick={() => { setDisplayName('Learner'); setStep(2) }}
                className="w-full mt-3 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* ── Step 2: Native language ──────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="mb-8 text-center">
                <div className="text-4xl mb-3">🌍</div>
                <h1 className="text-2xl font-bold text-gray-950 mb-2">What's your native language?</h1>
                <p className="text-sm text-gray-500">
                  We'll translate words into your language when you tap them.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {SUPPORTED_LANGS.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setNativeLang(lang.code)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      nativeLang === lang.code
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg leading-none">{lang.flag}</span>
                    {lang.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!nativeLang}
                className="w-full h-11 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-3"
              >
                Continue
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Learning goal ─────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="mb-8 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h1 className="text-2xl font-bold text-gray-950 mb-2">What's your goal?</h1>
                <p className="text-sm text-gray-500">
                  We'll personalise your experience to match.
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`flex items-start gap-4 px-4 py-4 rounded-xl border text-left transition-all ${
                      goal === g.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl leading-none mt-0.5">{g.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold">{g.label}</div>
                      <div className={`text-xs mt-0.5 ${goal === g.value ? 'text-gray-300' : 'text-gray-400'}`}>
                        {g.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleFinishStep3}
                disabled={!goal || saving}
                className="w-full h-11 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-3"
              >
                {saving ? 'Setting up your account…' : 'Continue →'}
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Step 4: Level test offer ──────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎓</div>
              <h1 className="text-2xl font-bold text-gray-950 mb-2">
                Want to know your exact level?
              </h1>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Take our 5-minute adaptive test. We'll calibrate your article feed to the right level and give you a shareable result.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  to="/level-test"
                  className="w-full h-12 bg-gray-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                >
                  Take the level test →
                </Link>
                <button
                  onClick={() => navigate('/home', { replace: true })}
                  className="w-full h-12 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Skip — start reading
                </button>
              </div>

              <p className="mt-5 text-xs text-gray-400">
                You can always take the level test later from your profile.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
