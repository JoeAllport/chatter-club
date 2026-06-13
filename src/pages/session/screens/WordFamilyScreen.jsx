/**
 * WordFamilyScreen — Word Family Builder game.
 *
 * Shows a root word (e.g. COMPETE).
 * A grid of word forms is shown — some are real forms of that root,
 * some are distractors (forms of other roots or non-words).
 * Student taps all the correct forms, then submits.
 *
 * data.items = [
 *   {
 *     root:        "COMPETE",
 *     forms: [
 *       { word: "competitive",   pos: "adj",  correct: true  },
 *       { word: "competition",   pos: "noun", correct: true  },
 *       { word: "competitor",    pos: "noun", correct: true  },
 *       { word: "competitively", pos: "adv",  correct: true  },
 *       { word: "compassionate", pos: "adj",  correct: false }, // distractor
 *       { word: "competes",      pos: "verb", correct: false }, // too obvious — use subtler ones
 *     ],
 *     hint: "verb → noun / adjective / adverb"
 *   }
 * ]
 *
 * onNext(correct) — correct if score ≥ 60%
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

const POS_COLOURS = {
  noun:   'bg-blue-50 text-blue-700 border-blue-200',
  verb:   'bg-green-50 text-green-700 border-green-200',
  adj:    'bg-purple-50 text-purple-700 border-purple-200',
  adv:    'bg-orange-50 text-orange-700 border-orange-200',
  other:  'bg-gray-50 text-gray-600 border-gray-200',
}

export default function WordFamilyScreen({ data, onNext }) {
  const { items = [], title = 'Word Family Builder' } = data

  const [idx, setIdx]           = useState(0)
  const [shuffledForms, setShuffledForms] = useState(() => shuffle(items[0]?.forms || []))
  const [selected, setSelected] = useState(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults]   = useState([])
  const [done, setDone]         = useState(false)

  const current = items[idx]

  const correctForms = current?.forms.filter(f => f.correct) || []
  const correctSet   = new Set(correctForms.map(f => f.word))

  const toggleSelect = useCallback((word) => {
    if (submitted) return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(word) ? next.delete(word) : next.add(word)
      return next
    })
  }, [submitted])

  function handleSubmit() {
    if (submitted) return

    // Score: correct = selected all correct AND no wrong ones
    const selectedArr = [...selected]
    const allCorrectSelected = correctForms.every(f => selected.has(f.word))
    const noWrongSelected    = selectedArr.every(w => correctSet.has(w))
    const itemCorrect = allCorrectSelected && noWrongSelected

    setSubmitted(true)

    setTimeout(() => {
      const newResults = [...results, { correct: itemCorrect, item: current }]
      setResults(newResults)

      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        const nextIdx = idx + 1
        setIdx(nextIdx)
        setShuffledForms(shuffle(items[nextIdx]?.forms || []))
        setSelected(new Set())
        setSubmitted(false)
      }
    }, itemCorrect ? 1200 : 2200)
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct     = Math.round((correct / items.length) * 100)

    return (
      <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-6">
        <div className="text-5xl">{pct >= 90 ? '🎯' : pct >= 70 ? '💪' : '📚'}</div>
        <p className="text-2xl font-black text-gray-900">Word families done!</p>

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
            <p className="text-3xl font-black text-purple-600">{pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
        </div>

        {/* Recap — show all families */}
        <div className="w-full space-y-3 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className={`px-4 py-3 rounded-xl border ${
              r.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold ${r.correct ? 'text-green-600' : 'text-red-500'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <span className="text-sm font-black text-gray-800 uppercase tracking-wider">
                  {r.item.root}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.item.forms.filter(f => f.correct).map(f => (
                  <span key={f.word} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    POS_COLOURS[f.pos] || POS_COLOURS.other
                  }`}>
                    {f.word}
                    <span className="opacity-60 ml-1">({f.pos})</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onNext(pct >= 60)}
          className="w-full py-4 bg-purple-600 text-white font-semibold rounded-2xl text-base hover:bg-purple-700 active:scale-95 transition-all"
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
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{idx + 1} of {items.length}</p>
        </div>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < idx
                ? results[i]?.correct ? 'bg-green-400' : 'bg-red-300'
                : i === idx ? 'bg-purple-500' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">

        {/* Root */}
        <div className="rounded-3xl border-2 border-purple-100 bg-purple-50 p-6 text-center">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Root word</p>
          <p className="text-4xl font-black text-purple-900">{current.root}</p>
          {current.hint && (
            <p className="text-xs text-purple-400 mt-2 italic">{current.hint}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Tap all the correct word forms · {correctForms.length} to find
          </p>
        </div>

        {/* Word form grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {shuffledForms.map(form => {
            const isSelected = selected.has(form.word)
            const isCorrect  = form.correct

            let cls = 'border-gray-200 bg-white text-gray-700'
            if (submitted) {
              if (isCorrect && isSelected)  cls = 'border-green-400 bg-green-50 text-green-800'
              else if (isCorrect)           cls = 'border-green-300 bg-green-50/60 text-green-700 opacity-80'
              else if (isSelected)          cls = 'border-red-300 bg-red-50 text-red-700'
              else                          cls = 'border-gray-100 bg-gray-50 text-gray-300'
            } else if (isSelected) {
              cls = 'border-purple-400 bg-purple-50 text-purple-800'
            } else {
              cls += ' hover:border-purple-300 hover:bg-purple-50/40'
            }

            return (
              <button
                key={form.word}
                onClick={() => toggleSelect(form.word)}
                disabled={submitted}
                className={`px-3 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all active:scale-95 text-left ${cls}`}
              >
                <span>{form.word}</span>
                {submitted && (
                  <span className={`text-xs ml-1.5 font-normal ${
                    isCorrect ? 'text-green-500' : 'text-gray-300'
                  }`}>
                    ({form.pos})
                  </span>
                )}
                {submitted && isCorrect && !isSelected && (
                  <span className="float-right text-green-500 text-xs">missed</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Submit */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="w-full py-4 bg-purple-600 text-white font-semibold rounded-2xl text-base disabled:opacity-40 hover:bg-purple-700 active:scale-95 transition-all"
          >
            Check ({selected.size} selected)
          </button>
        ) : (
          <div className={`w-full py-4 rounded-2xl text-center font-bold text-base ${
            results.length < items.length
              ? [...selected].every(w => correctSet.has(w)) && correctForms.every(f => selected.has(f.word))
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-gray-50 text-gray-500'
          }`}>
            {[...selected].every(w => correctSet.has(w)) && correctForms.every(f => selected.has(f.word))
              ? '✓ All correct!'
              : `✗ ${correctForms.map(f => f.word).join(' · ')}`
            }
          </div>
        )}
      </div>
    </div>
  )
}
