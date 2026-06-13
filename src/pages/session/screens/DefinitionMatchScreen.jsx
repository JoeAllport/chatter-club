/**
 * DefinitionMatchScreen — vocabulary learning step 1 of 3.
 *
 * Shows the word; student taps the correct definition from 4 options.
 * Correct → green flash → next word.
 * Wrong → red flash → options reset (try again).
 *
 * Cycles through ALL items in the block, then shows a summary.
 *
 * data.items = [{ word, pos, definition, example, translation?, distractors? }]
 *   distractors: array of alternative definitions used as wrong answers.
 *   If no distractors supplied, builds them from other items in the set.
 */
import { useState, useMemo } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick up to n wrong definitions from other items in the set */
function pickDistractors(items, currentIdx, n = 3) {
  const pool = items
    .filter((_, i) => i !== currentIdx)
    .map(it => it.definition)
  return shuffle(pool).slice(0, n)
}

export default function DefinitionMatchScreen({ data, onNext }) {
  const { items = [] } = data

  const [idx, setIdx]         = useState(0)
  const [chosen, setChosen]   = useState(null)   // null | 'correct' | 'wrong'
  const [wrongDef, setWrongDef] = useState(null)
  const [score, setScore]     = useState(0)
  const [errors, setErrors]   = useState(0)
  const [phase, setPhase]     = useState('quiz') // 'quiz' | 'done'

  const item = items[idx] || null

  // Build options for current item
  const options = useMemo(() => {
    if (!item) return []
    const supplied = item.distractors?.slice(0, 3) || []
    const fromSet  = pickDistractors(items, idx, 3 - supplied.length)
    const wrong    = [...supplied, ...fromSet].slice(0, 3)
    return shuffle([item.definition, ...wrong])
  }, [idx, item, items])

  function handleTap(def) {
    if (chosen) return
    if (def === item.definition) {
      setChosen('correct')
      setScore(s => s + 1)
      setTimeout(() => {
        if (idx + 1 >= items.length) {
          setPhase('done')
        } else {
          setIdx(i => i + 1)
          setChosen(null)
          setWrongDef(null)
        }
      }, 700)
    } else {
      setChosen('wrong')
      setWrongDef(def)
      setErrors(e => e + 1)
      setTimeout(() => {
        setChosen(null)
        setWrongDef(null)
      }, 900)
    }
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total   = items.length
    const pct     = Math.round((score / total) * 100)
    const emoji   = pct >= 90 ? '🌟' : pct >= 70 ? '💪' : '📚'
    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <div className="text-6xl">{emoji}</div>
          <div>
            <p className="text-2xl font-black text-gray-900">Definitions done!</p>
            <p className="text-sm text-gray-500 mt-1">You got first-try right: {score}/{total}</p>
          </div>

          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-black text-violet-600">{score}</p>
              <p className="text-xs text-gray-500 mt-1">First try</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-red-400">{errors}</p>
              <p className="text-xs text-gray-500 mt-1">Mistakes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-gray-700">{pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Score</p>
            </div>
          </div>

          {/* Word recap */}
          <div className="w-full text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Words covered
            </p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {items.map((it, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl bg-violet-50">
                  <span className="text-sm font-black text-violet-700 min-w-[90px]">{it.word}</span>
                  <span className="text-xs text-gray-600 leading-snug">{it.definition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNext(pct >= 50)}
          className="w-full py-4 bg-violet-600 text-white font-semibold rounded-2xl text-base hover:bg-violet-700 active:scale-95 transition-all flex-shrink-0"
        >
          Continue →
        </button>
      </div>
    )
  }

  if (!item) return null

  // ── Quiz screen ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider">
          What does it mean?
        </p>
        <p className="text-xs text-gray-400">
          {idx + 1} / {items.length}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mb-6 flex-shrink-0">
        {items.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
            i < idx ? 'bg-violet-400' : i === idx ? 'bg-violet-600' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Word card */}
      <div className="flex-shrink-0 mb-6">
        <div className={`rounded-3xl border-2 p-8 text-center transition-all duration-300 ${
          chosen === 'correct'
            ? 'border-green-400 bg-green-50'
            : chosen === 'wrong'
              ? 'border-red-300 bg-red-50'
              : 'border-violet-200 bg-violet-50'
        }`}>
          <p className="text-4xl font-black text-gray-900">{item.word}</p>
          {item.pos && (
            <p className="text-sm text-gray-400 italic mt-1">{item.pos}</p>
          )}
          {chosen === 'correct' && item.example && (
            <p className="text-sm text-indigo-600 italic mt-4 border-l-2 border-indigo-200 pl-3 text-left">
              "{item.example}"
            </p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {options.map((def, i) => {
          const isCorrect  = def === item.definition
          const isSelected = def === wrongDef
          let colourClass = 'border-gray-200 bg-white text-gray-800 hover:border-violet-300'
          if (chosen === 'correct' && isCorrect) {
            colourClass = 'border-green-400 bg-green-50 text-green-800'
          } else if (chosen === 'wrong' && isSelected) {
            colourClass = 'border-red-400 bg-red-50 text-red-700 animate-pulse'
          } else if (chosen === 'wrong' && isCorrect) {
            colourClass = 'border-green-300 bg-green-50 text-green-700'
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(def)}
              disabled={!!chosen}
              className={`w-full text-left px-4 py-4 rounded-2xl border-2 text-sm leading-snug font-medium transition-all active:scale-95 ${colourClass}`}
            >
              {def}
            </button>
          )
        })}
      </div>

      {/* Hint */}
      {!chosen && (
        <p className="text-xs text-gray-400 text-center mt-4 flex-shrink-0">
          Tap the correct definition
        </p>
      )}
    </div>
  )
}
