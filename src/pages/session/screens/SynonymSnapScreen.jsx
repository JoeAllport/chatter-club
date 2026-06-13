/**
 * SynonymSnapScreen — Part 7 synonym / paraphrase matching game.
 *
 * Shows a question phrase (as it appears in the exam).
 * Student taps the option that paraphrases it — the way the TEXT would
 * express the same idea (since Part 7 questions never use the text's words).
 *
 * Teaches the single hardest Part 7 micro-skill:
 *   question language ≠ text language — always a synonym or paraphrase.
 *
 * Also practises distractor awareness: one option is same-topic-wrong-meaning.
 *
 * data.items = [
 *   {
 *     question_phrase: "a change in shopping habits caused by technology",
 *     options: [
 *       {
 *         text:      "algorithms that predict what customers want before they search",
 *         correct:   true,
 *         reason:    "'predict before they search' = change in habits; 'algorithms' = technology"
 *       },
 *       {
 *         text:      "shops installing contactless payment machines",
 *         correct:   false,
 *         reason:    "technology is mentioned but there is no change in habits — it is an addition, not a transformation"
 *       },
 *       {
 *         text:      "consumers spending more time researching products online",
 *         correct:   false,
 *         reason:    "this describes a behaviour but it is not caused by technology in this context"
 *       },
 *       {
 *         text:      "retailers reducing prices to compete with online stores",
 *         correct:   false,
 *         reason:    "this is a retailer response, not a change in consumer habits"
 *       },
 *     ],
 *     key_words: ["change", "habits", "technology"]   // highlighted in question phrase
 *   }
 * ]
 *
 * onNext(correct) — correct if ≥ 60%
 */

import { useState } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SynonymSnapScreen({ data, onNext }) {
  const { items = [], title = 'Synonym Snap' } = data

  const [idx, setIdx]             = useState(0)
  const [shuffledOptions, setShuffledOptions] = useState(() => shuffle(items[0]?.options || []))
  const [selected, setSelected]   = useState(null)
  const [results, setResults]     = useState([])
  const [done, setDone]           = useState(false)

  const current = items[idx]

  function handleTap(option) {
    if (selected) return
    setSelected(option)

    setTimeout(() => {
      const newResults = [...results, { correct: option.correct, item: current }]
      setResults(newResults)
      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        const nextIdx = idx + 1
        setIdx(nextIdx)
        setShuffledOptions(shuffle(items[nextIdx]?.options || []))
        setSelected(null)
      }
    }, option.correct ? 900 : 2000)
  }

  // Highlight key words in the question phrase
  function renderQuestionPhrase(phrase, keyWords = []) {
    if (!keyWords.length) return phrase
    const regex = new RegExp(`(${keyWords.join('|')})`, 'gi')
    return phrase.split(regex).map((part, i) =>
      keyWords.some(k => k.toLowerCase() === part.toLowerCase())
        ? <mark key={i} className="bg-orange-200 text-orange-900 font-bold px-0.5 rounded not-italic">{part}</mark>
        : <span key={i}>{part}</span>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct = Math.round((correct / items.length) * 100)

    return (
      <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-6">
        <div className="text-5xl">{pct >= 90 ? '🎯' : pct >= 70 ? '💪' : '📚'}</div>
        <p className="text-2xl font-black text-gray-900">Synonym Snap done!</p>

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
            <p className="text-3xl font-black text-orange-500">{pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
        </div>

        {results.some(r => !r.correct) && (
          <div className="w-full space-y-2 max-h-56 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</p>
            {results.map((r, i) => !r.correct && (
              <div key={i} className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs">
                <p className="text-gray-500 italic mb-1.5">"{r.item.question_phrase}"</p>
                <p className="text-green-700 font-semibold mb-1">
                  ✓ {r.item.options.find(o => o.correct)?.text}
                </p>
                <p className="text-gray-400 italic">
                  {r.item.options.find(o => o.correct)?.reason}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onNext(pct >= 60)}
          className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl text-base hover:bg-orange-600 active:scale-95 transition-all"
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
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{idx + 1} of {items.length}</p>
        </div>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${
              i < idx
                ? results[i]?.correct ? 'bg-green-400' : 'bg-red-300'
                : i === idx ? 'bg-orange-400' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Question phrase card */}
      <div className="rounded-3xl border-2 border-orange-100 bg-orange-50 px-6 py-5 flex-shrink-0">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-2">
          Question phrase
        </p>
        <p className="text-lg font-bold text-gray-900 leading-snug">
          "{renderQuestionPhrase(current.question_phrase, current.key_words)}"
        </p>
        <p className="text-xs text-orange-400 mt-3 italic">
          Which of the options below means the same thing? The text uses different words.
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5 flex-1">
        {shuffledOptions.map((option, i) => {
          const isSelected = selected?.text === option.text
          const isCorrect  = option.correct

          let cls = 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/40'
          if (selected) {
            if (isCorrect)        cls = 'border-green-400 bg-green-50 text-green-800'
            else if (isSelected)  cls = 'border-red-300 bg-red-50 text-red-700'
            else                  cls = 'border-gray-100 bg-gray-50 text-gray-300'
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(option)}
              disabled={!!selected}
              className={`px-4 py-3.5 rounded-2xl border-2 text-sm font-medium text-left transition-all active:scale-[0.98] ${cls}`}
            >
              <span className="text-xs font-bold mr-2 opacity-40">{String.fromCharCode(65 + i)}</span>
              {option.text}
              {selected && isCorrect  && <span className="float-right text-green-500">✓</span>}
              {selected && isSelected && !isCorrect && <span className="float-right text-red-400">✗</span>}
            </button>
          )
        })}
      </div>

      {/* Explanation on answer */}
      {selected && (
        <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed flex-shrink-0 ${
          selected.correct
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {selected.correct
            ? `✓ ${selected.reason}`
            : `✗ ${selected.reason}`
          }
          {!selected.correct && (
            <p className="mt-1.5 text-green-700 font-semibold">
              ✓ {current.options.find(o => o.correct)?.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
