/**
 * SentenceSorterScreen — Part 6 paragraph ordering game.
 *
 * A paragraph has been split into sentences and jumbled.
 * Student taps sentences one by one to place them in the correct order.
 * The first sentence is always given (anchors the topic).
 *
 * Teaches: paragraph logic, topic development, cohesion flow.
 * The skill directly transfers to Part 6: understanding how a paragraph
 * MUST flow helps students recognise which sentence fits a gap.
 *
 * data.items = [
 *   {
 *     title:    "Shopping habits",          // optional paragraph label
 *     anchor:   "Consumers are changing the way they shop.",  // given first sentence
 *     sentences: [                           // sentences to order (shuffled on load)
 *       { text: "Online platforms now account for over 30% of all retail sales.",  order: 1 },
 *       { text: "This shift has forced many high street shops to close.",           order: 2 },
 *       { text: "However, some retailers have adapted by offering click-and-collect.", order: 3 },
 *       { text: "As a result, the high street is changing rather than disappearing.", order: 4 },
 *     ],
 *     explanation: "The paragraph moves: fact → consequence → contrast → conclusion."
 *   }
 * ]
 *
 * onNext(correct) — correct if all sentences placed in right order
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

export default function SentenceSorterScreen({ data, onNext }) {
  const { items = [], title = 'Sentence Sorter' } = data

  const [idx, setIdx]         = useState(0)
  const [placed, setPlaced]   = useState([])    // sentence objects in placed order
  const [bank, setBank]       = useState(() => shuffle(items[0]?.sentences || []))
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState([])
  const [done, setDone]       = useState(false)

  const current = items[idx]

  function loadItem(newIdx) {
    setIdx(newIdx)
    setPlaced([])
    setBank(shuffle(items[newIdx]?.sentences || []))
    setSubmitted(false)
  }

  const tapBank = useCallback((sentence) => {
    if (submitted) return
    setBank(prev => prev.filter(s => s.order !== sentence.order))
    setPlaced(prev => [...prev, sentence])
  }, [submitted])

  const tapPlaced = useCallback((sentence) => {
    if (submitted) return
    setPlaced(prev => prev.filter(s => s.order !== sentence.order))
    setBank(prev => [...prev, sentence])
  }, [submitted])

  function handleSubmit() {
    if (submitted) return
    setSubmitted(true)

    const correct = placed.every((s, i) => s.order === i + 1)

    setTimeout(() => {
      const newResults = [...results, { correct, item: current }]
      setResults(newResults)
      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        loadItem(idx + 1)
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
        <p className="text-2xl font-black text-gray-900">Sentence Sorter done!</p>

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

        {results.some(r => !r.correct) && (
          <div className="w-full space-y-3 max-h-56 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Correct order</p>
            {results.map((r, i) => !r.correct && (
              <div key={i} className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs">
                {r.item.anchor && (
                  <p className="text-gray-500 mb-1.5">
                    <span className="font-bold text-gray-600">Given: </span>{r.item.anchor}
                  </p>
                )}
                {[...r.item.sentences].sort((a, b) => a.order - b.order).map((s, j) => (
                  <p key={j} className="text-gray-700 mb-1">
                    <span className="font-bold text-teal-600 mr-1">{j + 1}.</span> {s.text}
                  </p>
                ))}
                {r.item.explanation && (
                  <p className="text-gray-400 mt-2 italic">{r.item.explanation}</p>
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

  const allPlaced = bank.length === 0
  const totalSentences = current.sentences.length

  // ── Game ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full px-6 py-6 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {idx + 1} of {items.length}
            {current.title && ` · ${current.title}`}
          </p>
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

      <p className="text-xs text-gray-500 flex-shrink-0">
        Tap sentences from the bank to build the paragraph in order. Tap a placed sentence to return it.
      </p>

      {/* Ordered zone */}
      <div className="flex flex-col gap-2 flex-shrink-0">

        {/* Anchor — always first */}
        {current.anchor && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-teal-50 border-2 border-teal-200">
            <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <p className="text-sm text-teal-900 leading-relaxed">{current.anchor}</p>
          </div>
        )}

        {/* Placed sentences */}
        {placed.map((s, i) => {
          const position = i + (current.anchor ? 2 : 1)
          const isCorrect = submitted && s.order === i + 1
          const isWrong   = submitted && s.order !== i + 1

          return (
            <button
              key={s.order}
              onClick={() => tapPlaced(s)}
              disabled={submitted}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${
                submitted
                  ? isCorrect
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-300'
                  : 'bg-white border-teal-300 hover:border-teal-400'
              }`}
            >
              <span className={`w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 ${
                submitted ? isCorrect ? 'bg-green-500' : 'bg-red-400' : 'bg-teal-400'
              }`}>
                {position}
              </span>
              <p className={`text-sm leading-relaxed ${
                submitted ? isCorrect ? 'text-green-800' : 'text-red-700' : 'text-gray-700'
              }`}>
                {s.text}
              </p>
              {submitted && isWrong && (
                <span className="ml-auto text-xs text-red-400 flex-shrink-0 font-bold">
                  #{s.order}
                </span>
              )}
              {submitted && isCorrect && (
                <span className="ml-auto text-green-500 flex-shrink-0">✓</span>
              )}
            </button>
          )
        })}

        {/* Empty slots */}
        {Array.from({ length: totalSentences - placed.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            <span className="w-6 h-6 rounded-full border-2 border-gray-300 text-xs font-black flex items-center justify-center flex-shrink-0 text-gray-300">
              {placed.length + i + (current.anchor ? 2 : 1)}
            </span>
            <p className="text-xs text-gray-300">Tap a sentence below to place it here</p>
          </div>
        ))}
      </div>

      {/* Bank */}
      {bank.length > 0 && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">
            Sentence bank
          </p>
          {bank.map((s) => (
            <button
              key={s.order}
              onClick={() => tapBank(s)}
              disabled={submitted}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 text-left hover:border-teal-300 hover:bg-teal-50/40 transition-all active:scale-[0.99]"
            >
              {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Submit */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allPlaced}
          className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl text-base disabled:opacity-40 hover:bg-teal-700 active:scale-95 transition-all flex-shrink-0"
        >
          Check order
        </button>
      ) : (
        <div className={`w-full py-3.5 rounded-2xl text-center font-bold text-sm flex-shrink-0 ${
          placed.every((s, i) => s.order === i + 1)
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {placed.every((s, i) => s.order === i + 1)
            ? '✓ Perfect order!'
            : `✗ ${current.explanation || 'Check the correct order above'}`
          }
        </div>
      )}
    </div>
  )
}
