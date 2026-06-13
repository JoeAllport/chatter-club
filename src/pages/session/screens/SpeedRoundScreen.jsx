/**
 * SpeedRoundScreen — vocabulary consolidation step 3 of 3.
 *
 * Timed MCQ sprint: word appears, 4 definition options shown.
 * Student taps the correct definition before the timer runs out.
 * Each correct answer adds 1 second (bonus). Wrong = no penalty, just move on.
 * At end: score summary + all items reviewed.
 *
 * data.items    = [{ word, pos, definition, example, distractors? }]
 * data.duration = seconds per item (default 8)
 * data.mode     = 'word_to_def' | 'def_to_word' (default word_to_def)
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(items, currentIdx, n = 3) {
  const pool = items
    .filter((_, i) => i !== currentIdx)
    .map(it => it.definition)
  return shuffle(pool).slice(0, n)
}

const PER_ITEM_SEC = 8

export default function SpeedRoundScreen({ data, onNext }) {
  const { items = [], mode = 'word_to_def' } = data
  const shuffledItems = useMemo(() => shuffle(items), [items])

  const [phase, setPhase]         = useState('countdown') // countdown | playing | done
  const [countdown, setCountdown] = useState(3)
  const [itemIdx, setItemIdx]     = useState(0)
  const [timeLeft, setTimeLeft]   = useState(PER_ITEM_SEC)
  const [chosen, setChosen]       = useState(null)   // null | definition string
  const [result, setResult]       = useState(null)   // null | 'correct' | 'wrong' | 'timeout'
  const [history, setHistory]     = useState([])     // { word, result, correctDef }
  const [score, setScore]         = useState(0)

  const timerRef = useRef(null)

  const item = shuffledItems[itemIdx] || null

  // Build options for current item
  const options = useMemo(() => {
    if (!item) return []
    const idx = shuffledItems.indexOf(item)
    const supplied = item.distractors?.slice(0, 3) || []
    const fromSet  = pickDistractors(shuffledItems, idx, 3 - supplied.length)
    const wrong    = [...supplied, ...fromSet].slice(0, 3)
    if (mode === 'word_to_def') {
      return shuffle([item.definition, ...wrong])
    } else {
      // def_to_word: show definition, options are words
      const wordPool = shuffledItems
        .filter((_, i) => i !== idx)
        .map(it => it.word)
      const wrongWords = shuffle(wordPool).slice(0, 3)
      return shuffle([item.word, ...wrongWords])
    }
  }, [itemIdx, item, shuffledItems, mode])

  // ── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) { setPhase('playing'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // ── Per-item timer ─────────────────────────────────────────────────────────
  const startItemTimer = useCallback(() => {
    setTimeLeft(PER_ITEM_SEC)
    setChosen(null)
    setResult(null)
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || result !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          // Timeout — record miss, move on
          if (item) {
            setResult('timeout')
            setHistory(h => [...h, { word: item.word, result: 'timeout', correctDef: item.definition }])
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, result, itemIdx, item])

  // After result is set (correct/wrong/timeout), pause then advance
  useEffect(() => {
    if (result === null) return
    clearInterval(timerRef.current)
    const delay = result === 'correct' ? 600 : 1000
    const t = setTimeout(() => {
      if (itemIdx + 1 >= shuffledItems.length) {
        setPhase('done')
      } else {
        setItemIdx(i => i + 1)
        startItemTimer()
      }
    }, delay)
    return () => clearTimeout(t)
  }, [result, itemIdx, shuffledItems.length, startItemTimer])

  function handleTap(def) {
    if (result !== null || phase !== 'playing') return
    const isCorrect = mode === 'word_to_def'
      ? def === item.definition
      : def === item.word
    setChosen(def)
    if (isCorrect) {
      setResult('correct')
      setScore(s => s + 1)
      setHistory(h => [...h, { word: item.word, result: 'correct', correctDef: item.definition }])
    } else {
      setResult('wrong')
      setHistory(h => [...h, { word: item.word, result: 'wrong', correctDef: item.definition }])
    }
  }

  // ── Timer ring ─────────────────────────────────────────────────────────────
  const pct      = PER_ITEM_SEC > 0 ? timeLeft / PER_ITEM_SEC : 0
  const radius   = 20
  const circ     = 2 * Math.PI * radius
  const strokeDash = circ * pct
  const urgent   = timeLeft <= 3

  // ── Countdown screen ───────────────────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-6">
        <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wider">Speed Round</p>
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Tap the correct meaning — you have {PER_ITEM_SEC} seconds per word!
        </p>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black
          ${countdown > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-600'}`}>
          {countdown > 0 ? countdown : '🚀'}
        </div>
        <p className="text-xs text-gray-400">{shuffledItems.length} words to go</p>
      </div>
    )
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total  = shuffledItems.length
    const pctRight = total > 0 ? Math.round((score / total) * 100) : 0
    const emoji  = pctRight >= 80 ? '🔥' : pctRight >= 50 ? '💪' : '📚'
    const missed = history.filter(h => h.result !== 'correct')

    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-5xl">{emoji}</div>
          <p className="text-2xl font-black text-gray-900">Speed Round done!</p>

          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-black text-green-600">{score}</p>
              <p className="text-xs text-gray-500 mt-1">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-red-400">{total - score}</p>
              <p className="text-xs text-gray-500 mt-1">Missed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-indigo-600">{pctRight}%</p>
              <p className="text-xs text-gray-500 mt-1">Score</p>
            </div>
          </div>

          {/* Missed words recap */}
          {missed.length > 0 && (
            <div className="w-full">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Review these
              </p>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {missed.map((h, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-sm font-black text-red-700">{h.word}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-snug">{h.correctDef}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missed.length === 0 && (
            <div className="px-6 py-4 rounded-2xl bg-green-50 border border-green-200 text-center">
              <p className="text-green-700 font-semibold text-sm">Perfect round! 🌟</p>
            </div>
          )}
        </div>

        <button
          onClick={() => onNext(pctRight >= 50)}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all flex-shrink-0 mt-4"
        >
          Continue →
        </button>
      </div>
    )
  }

  // ── Playing screen ─────────────────────────────────────────────────────────
  if (!item) return null

  return (
    <div className="flex flex-col h-full px-6 py-6">

      {/* Timer + counter */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="52" height="52" className="-rotate-90">
            <circle cx="26" cy="26" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle
              cx="26" cy="26" r={radius}
              fill="none"
              stroke={urgent ? '#ef4444' : '#6366f1'}
              strokeWidth="4"
              strokeDasharray={`${strokeDash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s linear' }}
            />
          </svg>
          <span className={`text-2xl font-black tabular-nums ${urgent ? 'text-red-500' : 'text-gray-800'}`}>
            {timeLeft}
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">{itemIdx + 1} / {shuffledItems.length}</p>
          <p className="text-xs text-green-600 font-semibold mt-0.5">✓ {score}</p>
        </div>
      </div>

      {/* Word / Definition prompt */}
      <div className="flex-shrink-0 mb-5">
        <div className={`rounded-3xl border-2 px-6 py-6 text-center transition-all ${
          result === 'correct'
            ? 'border-green-400 bg-green-50'
            : result === 'wrong' || result === 'timeout'
              ? 'border-red-200 bg-red-50'
              : 'border-indigo-200 bg-indigo-50'
        }`}>
          {mode === 'word_to_def' ? (
            <>
              <p className="text-4xl font-black text-gray-900">{item.word}</p>
              {item.pos && <p className="text-sm text-gray-400 italic mt-1">{item.pos}</p>}
            </>
          ) : (
            <p className="text-base text-gray-700 leading-relaxed">{item.definition}</p>
          )}

          {result === 'correct' && item.example && (
            <p className="text-sm text-indigo-600 italic mt-3 border-l-2 border-indigo-200 pl-3 text-left">
              "{item.example}"
            </p>
          )}

          {(result === 'wrong' || result === 'timeout') && (
            <p className="text-xs text-gray-500 mt-3">
              <span className="font-semibold">Answer: </span>{item.definition}
            </p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 flex flex-col justify-center gap-2.5">
        {options.map((opt, i) => {
          const isAnswer  = mode === 'word_to_def' ? opt === item.definition : opt === item.word
          const isChosen  = opt === chosen
          let cls = 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 active:scale-95'

          if (result !== null) {
            if (isAnswer) {
              cls = 'border-green-400 bg-green-50 text-green-800'
            } else if (isChosen && result === 'wrong') {
              cls = 'border-red-400 bg-red-50 text-red-700'
            } else {
              cls = 'border-gray-100 bg-gray-50 text-gray-400'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(opt)}
              disabled={result !== null}
              className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all leading-snug ${cls}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
