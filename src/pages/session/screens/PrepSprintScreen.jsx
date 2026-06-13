/**
 * PrepSprintScreen — Preposition Sprint game.
 *
 * Shows a verb or adjective with the preposition removed.
 * Student taps the correct preposition from 4 options.
 * Instant feedback, auto-advance, no timer — pure volume drill.
 *
 * data.items = [
 *   {
 *     stem:        "spend",          // verb/adj without preposition
 *     preposition: "on",             // correct answer
 *     example:     "She spends too much ___ clothes she rarely wears.",
 *     distractors: ["for","in","with"] // 3 wrong options
 *   }
 * ]
 * data.title = optional heading
 *
 * Block type: 'prep_sprint'
 * content shape: { items: [...], title: '' }
 *
 * onNext(correct) — passes overall score ≥ 60% as correct
 */
import { useState, useCallback } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PrepSprintScreen({ data, onNext }) {
  const { items = [], title = 'Preposition Sprint' } = data

  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState(null)   // the tapped option
  const [results, setResults]   = useState([])      // { correct: bool }
  const [done, setDone]         = useState(false)

  const current = items[idx]

  // Build shuffled options for current item
  const options = current
    ? shuffle([current.preposition, ...current.distractors])
    : []

  const handleTap = useCallback((opt) => {
    if (selected) return // already answered this one
    const correct = opt === current.preposition
    setSelected(opt)

    setTimeout(() => {
      const newResults = [...results, { correct }]
      setResults(newResults)

      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
      }
    }, correct ? 800 : 1400)
  }, [selected, current, idx, items.length, results])

  // ── Results ───────────────────────────────────────────────────────────────
  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct = Math.round((correct / items.length) * 100)

    return (
      <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-6">
        <div className="text-5xl">
          {pct >= 90 ? '🎯' : pct >= 70 ? '💪' : '📚'}
        </div>
        <p className="text-2xl font-black text-gray-900">Sprint complete!</p>

        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-black text-green-600">{correct}</p>
            <p className="text-xs text-gray-500 mt-1">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-red-400">{items.length - correct}</p>
            <p className="text-xs text-gray-500 mt-1">Wrong</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-indigo-600">{pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
        </div>

        {/* Item recap — show wrong ones */}
        {results.some(r => !r.correct) && (
          <div className="w-full mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Review these
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item, i) => !results[i]?.correct && (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 text-sm">
                  <span className="text-red-400 font-bold flex-shrink-0">✗</span>
                  <div>
                    <span className="font-semibold text-gray-800">{item.stem}</span>
                    <span className="text-indigo-600 font-bold"> {item.preposition} </span>
                    {item.example && (
                      <span className="text-gray-500 text-xs block mt-0.5 italic">
                        {item.example.replace('___', `[${item.preposition}]`)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => onNext(pct >= 60)}
          className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Continue →
        </button>
      </div>
    )
  }

  if (!current) return null

  // ── Game ──────────────────────────────────────────────────────────────────
  const progress = idx / items.length

  return (
    <div className="flex flex-col h-full px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{idx + 1} of {items.length}</p>
        </div>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < idx
                ? results[i]?.correct ? 'bg-green-400' : 'bg-red-300'
                : i === idx ? 'bg-indigo-500' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center gap-6">

        {/* Stem */}
        <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-sm p-8 text-center">
          <p className="text-4xl font-black text-gray-900 mb-3">
            {current.stem}
            <span className="text-indigo-300"> ___</span>
          </p>
          {current.example && (
            <p className="text-sm text-gray-500 italic leading-relaxed">
              {current.example}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => {
            const isCorrect = opt === current.preposition
            const isSelected = opt === selected

            let cls = 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50'
            if (selected) {
              if (isCorrect) cls = 'border-green-400 bg-green-50 text-green-800'
              else if (isSelected) cls = 'border-red-300 bg-red-50 text-red-700'
              else cls = 'border-gray-100 bg-gray-50 text-gray-300'
            }

            return (
              <button
                key={opt}
                onClick={() => handleTap(opt)}
                disabled={!!selected}
                className={`
                  py-5 rounded-2xl border-2 font-bold text-xl
                  transition-all duration-150 active:scale-95
                  ${cls}
                `}
              >
                {opt}
                {selected && isCorrect && <span className="ml-1 text-base">✓</span>}
                {selected && isSelected && !isCorrect && <span className="ml-1 text-base">✗</span>}
              </button>
            )
          })}
        </div>

        {/* Wrong answer: show correct + example */}
        {selected && selected !== current.preposition && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700 text-center">
            <span className="font-bold">{current.stem} <span className="text-indigo-600">{current.preposition}</span></span>
            {current.example && (
              <p className="text-red-500 text-xs mt-1 italic">
                {current.example.replace('___', current.preposition)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
