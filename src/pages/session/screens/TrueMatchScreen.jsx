/**
 * TrueMatchScreen — Part 7 True Match vs False Match game.
 *
 * Two paragraphs are shown side by side (or stacked on mobile).
 * Both seem relevant to the question — one is the true answer,
 * one is a distractor (same topic, wrong detail / paraphrase mismatch).
 *
 * Student reads both and taps the section that truly answers the question.
 * On wrong answer: explains WHY the other section is a false match.
 *
 * Teaches the core Part 7 skill:
 *   - Questions are always paraphrased (never the exact text words)
 *   - Distractors share the topic but miss a key detail
 *   - Synonyms in the question must map to synonyms in the text
 *
 * data.items = [
 *   {
 *     question: "Which section mentions a change in shopping habits caused by technology?",
 *     section_a: {
 *       label: "Section B",
 *       text:  "Online retailers have invested heavily in algorithms...",
 *       correct: true,
 *       match_reason: "'change in habits' → 'algorithms that predict what customers want before they search'",
 *     },
 *     section_b: {
 *       label: "Section D",
 *       text:  "Many high street shops now offer digital loyalty cards...",
 *       correct: false,
 *       false_reason: "Technology is mentioned but the section is about payment methods, not a change in habits.",
 *     },
 *     key_synonym: "change in habits = predict what customers want before they search"
 *   }
 * ]
 *
 * onNext(correct) — correct if score ≥ 60%
 */

import { useState } from 'react'

export default function TrueMatchScreen({ data, onNext }) {
  const { items = [], title = 'True Match' } = data

  const [idx, setIdx]         = useState(0)
  const [selected, setSelected] = useState(null) // 'a' | 'b'
  const [results, setResults] = useState([])
  const [done, setDone]       = useState(false)

  const current = items[idx]

  function handleTap(which) {
    if (selected) return
    setSelected(which)
    const correct = which === 'a' ? current.section_a.correct : current.section_b.correct

    setTimeout(() => {
      const newResults = [...results, { correct, item: current }]
      setResults(newResults)
      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setSelected(null)
      }
    }, correct ? 1200 : 2400)
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct = Math.round((correct / items.length) * 100)

    return (
      <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-6">
        <div className="text-5xl">{pct >= 90 ? '🎯' : pct >= 70 ? '💪' : '📚'}</div>
        <p className="text-2xl font-black text-gray-900">True Match done!</p>

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
              <div key={i} className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm">
                <p className="text-xs text-gray-500 italic mb-1">"{r.item.question}"</p>
                <p className="text-green-700 font-semibold text-xs">
                  ✓ {r.item.section_a.correct ? r.item.section_a.label : r.item.section_b.label}
                </p>
                {r.item.key_synonym && (
                  <p className="text-xs text-gray-400 mt-1 italic">{r.item.key_synonym}</p>
                )}
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

  const correctSection = current.section_a.correct ? current.section_a : current.section_b
  const wrongSection   = current.section_a.correct ? current.section_b : current.section_a
  const chosenCorrect  = selected
    ? (selected === 'a' ? current.section_a.correct : current.section_b.correct)
    : null

  // ── Game ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full px-6 py-6 gap-4">

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

      {/* Question */}
      <div className="rounded-2xl bg-orange-50 border-2 border-orange-100 px-4 py-3 flex-shrink-0">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-1">Question</p>
        <p className="text-sm font-semibold text-gray-800 leading-relaxed">{current.question}</p>
        {current.key_synonym && !selected && (
          <p className="text-xs text-orange-400 mt-1.5 italic">
            💡 Look for a paraphrase — the text won't use these exact words.
          </p>
        )}
      </div>

      {/* Two sections */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {[
          { key: 'a', section: current.section_a },
          { key: 'b', section: current.section_b },
        ].map(({ key, section }) => {
          const isSelected = selected === key
          const isCorrect  = section.correct

          let borderCls = 'border-gray-200'
          let bgCls     = 'bg-white'
          let labelCls  = 'text-gray-400'

          if (selected) {
            if (isCorrect) {
              borderCls = 'border-green-400'
              bgCls     = 'bg-green-50'
              labelCls  = 'text-green-600'
            } else if (isSelected) {
              borderCls = 'border-red-300'
              bgCls     = 'bg-red-50'
              labelCls  = 'text-red-500'
            } else {
              borderCls = 'border-gray-100'
              bgCls     = 'bg-gray-50'
              labelCls  = 'text-gray-300'
            }
          } else if (isSelected) {
            borderCls = 'border-orange-400'
            bgCls     = 'bg-orange-50'
          }

          return (
            <button
              key={key}
              onClick={() => handleTap(key)}
              disabled={!!selected}
              className={`flex-1 text-left rounded-2xl border-2 px-4 py-3 transition-all active:scale-[0.98] overflow-y-auto ${borderCls} ${bgCls}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${labelCls}`}>
                  {section.label}
                </span>
                {selected && isCorrect  && <span className="text-green-500 font-bold">✓ True match</span>}
                {selected && isSelected && !isCorrect && <span className="text-red-400 font-bold text-xs">✗ False match</span>}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{section.text}</p>

              {/* Show why it's wrong after selection */}
              {selected && isSelected && !isCorrect && section.false_reason && (
                <p className="text-xs text-red-600 mt-2 italic border-t border-red-100 pt-2">
                  {section.false_reason}
                </p>
              )}
              {/* Show why it's right */}
              {selected && isCorrect && section.match_reason && (
                <p className="text-xs text-green-700 mt-2 italic border-t border-green-100 pt-2">
                  💡 {section.match_reason}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Key synonym reveal after answer */}
      {selected && current.key_synonym && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 flex-shrink-0">
          <p className="text-xs text-orange-700 font-semibold">
            🔗 Synonym link: <span className="font-normal italic">{current.key_synonym}</span>
          </p>
        </div>
      )}
    </div>
  )
}
