/**
 * PronounTrackerScreen — Part 6 pronoun reference tracker.
 *
 * Shows a short paragraph with a highlighted pronoun (it / they / this /
 * which / these etc.). Student taps the word or phrase in the paragraph
 * above that the pronoun refers back to.
 *
 * Teaches the core Part 6 micro-skill: every inserted sentence connects
 * to what comes before via a pronoun or reference chain.
 *
 * data.items = [
 *   {
 *     context: "The new shopping centre opened last month. It attracted
 *               over 50,000 visitors in its first week.",
 *     pronoun: "It",                        // the word to explain
 *     pronoun_index: 1,                     // sentence index (0-based) where pronoun appears
 *     options: [
 *       { text: "The new shopping centre", correct: true  },
 *       { text: "last month",              correct: false },
 *       { text: "50,000 visitors",         correct: false },
 *       { text: "its first week",          correct: false },
 *     ],
 *     explanation: "'It' refers back to 'the new shopping centre' —
 *                   the subject introduced in the previous sentence."
 *   }
 * ]
 *
 * onNext(correct) — correct if score ≥ 60%
 */

import { useState } from 'react'

export default function PronounTrackerScreen({ data, onNext }) {
  const { items = [], title = 'Pronoun Tracker' } = data

  const [idx, setIdx]         = useState(0)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState([])
  const [done, setDone]       = useState(false)

  const current = items[idx]

  // Split context into sentences, highlight the one containing the pronoun
  const sentences = current?.context.match(/[^.!?]+[.!?]+/g) || [current?.context]

  function handleTap(option) {
    if (selected) return
    const correct = option.correct
    setSelected(option)

    setTimeout(() => {
      const newResults = [...results, { correct, item: current }]
      setResults(newResults)
      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
      }
    }, correct ? 900 : 2000)
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct = Math.round((correct / items.length) * 100)

    return (
      <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-6">
        <div className="text-5xl">{pct >= 90 ? '🎯' : pct >= 70 ? '💪' : '📚'}</div>
        <p className="text-2xl font-black text-gray-900">Pronoun Tracker done!</p>

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
            <p className="text-3xl font-black text-teal-600">{pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
        </div>

        {/* Recap missed items */}
        {results.some(r => !r.correct) && (
          <div className="w-full space-y-2 max-h-56 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</p>
            {results.map((r, i) => !r.correct && (
              <div key={i} className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm">
                <p className="font-bold text-gray-700 mb-1">
                  <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-bold">
                    {r.item.pronoun}
                  </span>
                  {' '}refers to…
                </p>
                <p className="text-green-700 font-semibold">
                  ✓ {r.item.options.find(o => o.correct)?.text}
                </p>
                {r.item.explanation && (
                  <p className="text-xs text-gray-400 mt-1 italic">{r.item.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onNext(pct >= 60)}
          className="w-full py-4 bg-teal-600 text-white font-semibold rounded-2xl text-base hover:bg-teal-700 active:scale-95 transition-all"
        >
          Continue →
        </button>
      </div>
    )
  }

  if (!current) return null

  // ── Game ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full px-6 py-6 gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{idx + 1} of {items.length}</p>
        </div>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < idx
                ? results[i]?.correct ? 'bg-green-400' : 'bg-red-300'
                : i === idx ? 'bg-teal-500' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Instruction */}
      <p className="text-xs text-gray-500 flex-shrink-0">
        What does the highlighted word refer to?
      </p>

      {/* Context paragraph */}
      <div className="rounded-2xl border-2 border-teal-100 bg-teal-50 px-5 py-4 flex-shrink-0">
        {sentences.map((sentence, i) => {
          const isTarget = i === (current.pronoun_index ?? sentences.length - 1)
          // Highlight the pronoun within the target sentence
          const rendered = isTarget
            ? sentence.split(new RegExp(`(\\b${current.pronoun}\\b)`, 'i')).map((part, j) =>
                part.toLowerCase() === current.pronoun.toLowerCase()
                  ? <mark key={j} className="bg-teal-300 text-teal-900 font-black px-0.5 rounded not-italic">{part}</mark>
                  : <span key={j}>{part}</span>
              )
            : sentence

          return (
            <span
              key={i}
              className={`text-sm leading-relaxed ${
                isTarget ? 'text-gray-900 font-medium' : 'text-gray-600'
              }`}
            >
              {rendered}{' '}
            </span>
          )
        })}
      </div>

      {/* Question */}
      <p className="text-base font-bold text-gray-800 flex-shrink-0">
        <mark className="bg-teal-200 text-teal-800 px-1 rounded not-italic">
          {current.pronoun}
        </mark>
        {' '}refers to…
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2.5 flex-1">
        {current.options.map((option, i) => {
          const isSelected = selected?.text === option.text
          const isCorrect  = option.correct

          let cls = 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50/50'
          if (selected) {
            if (isCorrect)             cls = 'border-green-400 bg-green-50 text-green-800'
            else if (isSelected)       cls = 'border-red-300 bg-red-50 text-red-700'
            else                       cls = 'border-gray-100 bg-gray-50 text-gray-300'
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(option)}
              disabled={!!selected}
              className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm font-semibold text-left transition-all active:scale-[0.98] ${cls}`}
            >
              <span className="text-xs font-bold mr-2 opacity-50">{String.fromCharCode(65 + i)}</span>
              {option.text}
              {selected && isCorrect  && <span className="float-right text-green-500">✓</span>}
              {selected && isSelected && !isCorrect && <span className="float-right text-red-400">✗</span>}
            </button>
          )
        })}
      </div>

      {/* Explanation on wrong answer */}
      {selected && !selected.correct && current.explanation && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex-shrink-0">
          <p className="text-xs text-teal-800 leading-relaxed">{current.explanation}</p>
        </div>
      )}
    </div>
  )
}
