/**
 * CollocationSnapScreen — Collocation Snap game.
 *
 * Shows the fixed part of a collocation (noun/verb/adj).
 * Student taps the correct collocating word from 4 options.
 * Distractors are always from the same semantic field —
 * exactly the Part 1 distractor pattern.
 *
 * data.items = [
 *   {
 *     prompt:     "a ___ range",        // the fixed part with gap
 *     answer:     "wide",               // correct collocating word
 *     distractors:["broad","large","big"], // 3 wrong options (same field)
 *     explanation:"wide range is fixed; large range is unnatural"
 *   }
 * ]
 * data.title = optional heading
 *
 * onNext(correct) — passes overall score ≥ 60%
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

export default function CollocationSnapScreen({ data, onNext }) {
  const { items = [], title = 'Collocation Snap' } = data

  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState(null)
  const [results, setResults]   = useState([])
  const [done, setDone]         = useState(false)

  const current = items[idx]
  const options = current ? shuffle([current.answer, ...current.distractors]) : []

  const handleTap = useCallback((opt) => {
    if (selected) return
    const correct = opt === current.answer
    setSelected(opt)

    setTimeout(() => {
      const newResults = [...results, { correct, item: current }]
      setResults(newResults)
      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
      }
    }, correct ? 700 : 1600)
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
        <p className="text-2xl font-black text-gray-900">Snap complete!</p>

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

        {results.some(r => !r.correct) && (
          <div className="w-full mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Review these
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {results.map((r, i) => !r.correct && (
                <div key={i} className="px-4 py-3 rounded-xl bg-red-50 text-sm">
                  <p className="font-semibold text-gray-800">
                    {r.item.prompt.replace('___', (
                      <span className="text-indigo-600">{r.item.answer}</span>
                    ))}
                  </p>
                  <p className="text-gray-700 text-sm mt-0.5">
                    ✓ <span className="font-bold text-indigo-700">{r.item.answer}</span>
                    {' '}—{' '}
                    {r.item.prompt.replace('___', r.item.answer)}
                  </p>
                  {r.item.explanation && (
                    <p className="text-xs text-gray-400 mt-1 italic">{r.item.explanation}</p>
                  )}
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
  return (
    <div className="flex flex-col h-full px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{idx + 1} of {items.length}</p>
        </div>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < idx
                ? results[i]?.correct ? 'bg-green-400' : 'bg-red-300'
                : i === idx ? 'bg-amber-500' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-sm p-8 text-center">
          {/* Show prompt with gap highlighted */}
          <p className="text-3xl font-black text-gray-900 leading-tight">
            {current.prompt.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="text-amber-400"> ___ </span>
                )}
              </span>
            ))}
          </p>
          <p className="text-xs text-gray-400 mt-3">Which word completes the collocation?</p>
        </div>

        {/* Options — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => {
            const isCorrect = opt === current.answer
            const isSelected = opt === selected

            let cls = 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50'
            if (selected) {
              if (isCorrect)      cls = 'border-green-400 bg-green-50 text-green-800'
              else if (isSelected) cls = 'border-red-300 bg-red-50 text-red-700'
              else                 cls = 'border-gray-100 bg-gray-50 text-gray-300'
            }

            return (
              <button
                key={opt}
                onClick={() => handleTap(opt)}
                disabled={!!selected}
                className={`py-5 rounded-2xl border-2 font-bold text-lg transition-all duration-150 active:scale-95 ${cls}`}
              >
                {opt}
                {selected && isCorrect  && <span className="ml-1">✓</span>}
                {selected && isSelected && !isCorrect && <span className="ml-1">✗</span>}
              </button>
            )
          })}
        </div>

        {/* Wrong answer feedback */}
        {selected && selected !== current.answer && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-center">
            <p className="text-sm font-bold text-amber-900">
              ✓ {current.prompt.replace('___', current.answer)}
            </p>
            {current.explanation && (
              <p className="text-xs text-amber-700 mt-1 italic">{current.explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
