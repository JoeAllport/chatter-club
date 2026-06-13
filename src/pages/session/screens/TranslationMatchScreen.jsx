/**
 * TranslationMatchScreen — vocabulary learning step 2 of 3.
 *
 * Shows the English word; student taps the correct L1 (Spanish) translation.
 * Same mechanic as DefinitionMatchScreen but with the L1 side.
 *
 * Amber theme — visually distinct from step 1 (violet) and step 3 (speed).
 *
 * data.items = [{ word, pos, definition, translation, example, distractors? }]
 *   translation: the correct L1 translation string
 *   distractors: array of wrong L1 translations (built from other items if missing)
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

function pickTranslationDistractors(items, currentIdx, n = 3) {
  const pool = items
    .filter((_, i) => i !== currentIdx && items[i].translation)
    .map(it => it.translation)
  return shuffle(pool).slice(0, n)
}

export default function TranslationMatchScreen({ data, onNext }) {
  const { items = [], l1 = 'Spanish' } = data

  // Only include items that have a translation
  const validItems = useMemo(
    () => items.filter(it => it.translation),
    [items]
  )

  const [idx, setIdx]         = useState(0)
  const [chosen, setChosen]   = useState(null)
  const [wrongTrans, setWrongTrans] = useState(null)
  const [score, setScore]     = useState(0)
  const [errors, setErrors]   = useState(0)
  const [phase, setPhase]     = useState('quiz')

  const item = validItems[idx] || null

  const options = useMemo(() => {
    if (!item) return []
    const supplied = item.distractors?.slice(0, 3) || []
    const fromSet  = pickTranslationDistractors(validItems, idx, 3 - supplied.length)
    const wrong    = [...supplied, ...fromSet].slice(0, 3)
    return shuffle([item.translation, ...wrong])
  }, [idx, item, validItems])

  function handleTap(trans) {
    if (chosen) return
    if (trans === item.translation) {
      setChosen('correct')
      setScore(s => s + 1)
      setTimeout(() => {
        if (idx + 1 >= validItems.length) {
          setPhase('done')
        } else {
          setIdx(i => i + 1)
          setChosen(null)
          setWrongTrans(null)
        }
      }, 700)
    } else {
      setChosen('wrong')
      setWrongTrans(trans)
      setErrors(e => e + 1)
      setTimeout(() => {
        setChosen(null)
        setWrongTrans(null)
      }, 900)
    }
  }

  // If no items have translations, skip this screen
  if (validItems.length === 0) {
    onNext(true)
    return null
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total = validItems.length
    const pct   = Math.round((score / total) * 100)
    const emoji = pct >= 90 ? '🌟' : pct >= 70 ? '💪' : '📚'
    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <div className="text-6xl">{emoji}</div>
          <div>
            <p className="text-2xl font-black text-gray-900">Translations done!</p>
            <p className="text-sm text-gray-500 mt-1">First try correct: {score}/{total}</p>
          </div>

          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-black text-amber-600">{score}</p>
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

          {/* Bilingual recap */}
          <div className="w-full text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              English → {l1}
            </p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {validItems.map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-50">
                  <span className="text-sm font-black text-amber-700 min-w-[100px]">{it.word}</span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-sm text-gray-700">{it.translation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNext(pct >= 50)}
          className="w-full py-4 bg-amber-500 text-white font-semibold rounded-2xl text-base hover:bg-amber-600 active:scale-95 transition-all flex-shrink-0"
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
        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
          How do you say it in {l1}?
        </p>
        <p className="text-xs text-gray-400">
          {idx + 1} / {validItems.length}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mb-6 flex-shrink-0">
        {validItems.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
            i < idx ? 'bg-amber-400' : i === idx ? 'bg-amber-500' : 'bg-gray-200'
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
              : 'border-amber-200 bg-amber-50'
        }`}>
          <p className="text-4xl font-black text-gray-900">{item.word}</p>
          {item.pos && (
            <p className="text-sm text-gray-400 italic mt-1">{item.pos}</p>
          )}
          {chosen === 'correct' && (
            <div className="mt-4 text-left space-y-1">
              <p className="text-base font-semibold text-amber-700">{item.translation}</p>
              {item.definition && (
                <p className="text-xs text-gray-500 leading-snug">{item.definition}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Options — translation chips */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {options.map((trans, i) => {
          const isCorrect  = trans === item.translation
          const isSelected = trans === wrongTrans
          let colourClass = 'border-gray-200 bg-white text-gray-800 hover:border-amber-300'
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
              onClick={() => handleTap(trans)}
              disabled={!!chosen}
              className={`w-full text-left px-4 py-4 rounded-2xl border-2 text-base font-medium transition-all active:scale-95 ${colourClass}`}
            >
              {trans}
            </button>
          )
        })}
      </div>

      {!chosen && (
        <p className="text-xs text-gray-400 text-center mt-4 flex-shrink-0">
          Tap the {l1} translation
        </p>
      )}
    </div>
  )
}
