/**
 * SpeedRoundScreen — 60-second vocabulary sprint.
 *
 * Shows word → student taps "Got it" or "Pass".
 * Counts how many they get through.
 * At time-up, shows their score and auto-advances.
 *
 * data.items = [{ word, definition, example, pos }]
 * data.duration = seconds (default 60)
 * data.mode = 'word_to_def' | 'def_to_word' (default word_to_def)
 */
import { useState, useEffect, useRef, useCallback } from 'react'

export default function SpeedRoundScreen({ data, onNext }) {
  const { items = [], duration = 60, mode = 'word_to_def' } = data

  const [phase, setPhase]       = useState('countdown') // countdown | playing | done
  const [countdown, setCountdown] = useState(3)
  const [itemIdx, setItemIdx]   = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [gotIt, setGotIt]       = useState(0)
  const [passed, setPassed]     = useState(0)
  const [history, setHistory]   = useState([]) // { word, result: 'got'|'pass' }

  const timerRef = useRef(null)

  // ── Countdown phase ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('playing')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // ── Timer during play ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  // ── End when all items exhausted ───────────────────────────────────────────
  useEffect(() => {
    if (phase === 'playing' && itemIdx >= items.length) {
      clearInterval(timerRef.current)
      setPhase('done')
    }
  }, [itemIdx, items.length, phase])

  const currentItem = items[itemIdx] || null

  const advance = useCallback((result) => {
    if (!currentItem) return
    setHistory(h => [...h, { word: currentItem.word, result }])
    if (result === 'got') setGotIt(n => n + 1)
    else setPassed(n => n + 1)
    setRevealed(false)
    setItemIdx(i => i + 1)
  }, [currentItem])

  // ── Timer ring helpers ─────────────────────────────────────────────────────
  const pct = duration > 0 ? timeLeft / duration : 0
  const radius = 20
  const circ = 2 * Math.PI * radius
  const strokeDash = circ * pct
  const urgent = timeLeft <= 10

  // ── Countdown screen ───────────────────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-6">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Speed Round</p>
        <p className="text-xs text-gray-400 text-center max-w-xs">
          See the word, recall the meaning — "Got it" or "Pass"
        </p>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black
          ${countdown > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-600'}`}>
          {countdown > 0 ? countdown : '🚀'}
        </div>
        <p className="text-xs text-gray-400">{duration} seconds · {items.length} words</p>
      </div>
    )
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total = gotIt + passed
    const pctRight = total > 0 ? Math.round((gotIt / items.length) * 100) : 0
    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-5xl">
            {pctRight >= 80 ? '🔥' : pctRight >= 50 ? '💪' : '📚'}
          </div>
          <p className="text-2xl font-black text-gray-900">Speed Round done!</p>

          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-black text-green-600">{gotIt}</p>
              <p className="text-xs text-gray-500 mt-1">Got it</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-gray-400">{passed}</p>
              <p className="text-xs text-gray-500 mt-1">Passed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-indigo-600">{pctRight}%</p>
              <p className="text-xs text-gray-500 mt-1">Score</p>
            </div>
          </div>

          {/* Word recap */}
          {history.length > 0 && (
            <div className="w-full mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Your round
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                    h.result === 'got'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-gray-50 text-gray-500'
                  }`}>
                    <span>{h.result === 'got' ? '✓' : '—'}</span>
                    <span className="font-medium">{h.word}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onNext(pctRight >= 50)}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all flex-shrink-0"
        >
          Continue →
        </button>
      </div>
    )
  }

  // ── Playing screen ─────────────────────────────────────────────────────────
  if (!currentItem) return null

  return (
    <div className="flex flex-col h-full px-6 py-6">

      {/* Timer + counter */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Circular timer */}
          <svg width="52" height="52" className="-rotate-90">
            <circle cx="26" cy="26" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle
              cx="26" cy="26" r={radius}
              fill="none"
              stroke={urgent ? '#ef4444' : '#6366f1'}
              strokeWidth="4"
              strokeDasharray={`${strokeDash} ${circ}`}
              strokeLinecap="round"
              className="transition-all duration-1000 linear"
            />
          </svg>
          <span className={`text-2xl font-black tabular-nums ${urgent ? 'text-red-500' : 'text-gray-800'}`}>
            {timeLeft}
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">
            {itemIdx + 1} of {items.length}
          </p>
          <div className="flex items-center gap-2 mt-0.5 justify-end">
            <span className="text-xs text-green-600 font-semibold">✓ {gotIt}</span>
            <span className="text-xs text-gray-400">— {passed}</span>
          </div>
        </div>
      </div>

      {/* Word card */}
      <div className="flex-1 flex flex-col justify-center">
        <div className={`rounded-3xl border-2 p-8 text-center transition-all duration-300 ${
          revealed ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white shadow-sm'
        }`}>
          {mode === 'word_to_def' ? (
            <>
              <p className="text-4xl font-black text-gray-900 mb-1">{currentItem.word}</p>
              {currentItem.pos && (
                <p className="text-sm text-gray-400 italic mb-4">{currentItem.pos}</p>
              )}
            </>
          ) : (
            <p className="text-base text-gray-700 leading-relaxed">{currentItem.definition}</p>
          )}

          {!revealed && (
            <p className="text-xs text-gray-300 mt-6">Tap to peek at definition</p>
          )}

          {revealed && (
            <div className="mt-4 space-y-2 text-left">
              {mode === 'word_to_def' ? (
                <p className="text-base text-gray-800 leading-relaxed">{currentItem.definition}</p>
              ) : (
                <p className="text-3xl font-black text-gray-900">{currentItem.word}</p>
              )}
              {currentItem.example && (
                <p className="text-sm text-indigo-600 italic border-l-2 border-indigo-200 pl-3">
                  "{currentItem.example}"
                </p>
              )}
            </div>
          )}
        </div>

        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="mt-4 w-full py-3 border-2 border-gray-200 text-gray-600 font-medium rounded-2xl text-sm hover:border-indigo-300 hover:text-indigo-600 active:scale-95 transition-all"
          >
            Peek at definition
          </button>
        )}
      </div>

      {/* Got it / Pass — always visible so they can answer without peeking */}
      <div className="flex gap-3 flex-shrink-0 pt-4">
        <button
          onClick={() => advance('pass')}
          className="flex-1 py-4 border-2 border-gray-200 text-gray-500 font-semibold rounded-2xl text-sm hover:border-red-200 hover:text-red-500 active:scale-95 transition-all"
        >
          Pass
        </button>
        <button
          onClick={() => advance('got')}
          className="flex-1 py-4 bg-green-500 text-white font-semibold rounded-2xl text-sm hover:bg-green-600 active:scale-95 transition-all"
        >
          Got it ✓
        </button>
      </div>
    </div>
  )
}
