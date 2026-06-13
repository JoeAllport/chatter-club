/**
 * TransformAnalyserScreen — Part 4 Key Word Transformation analyser.
 *
 * Two-phase exercise shown in full Cambridge exam format.
 *
 * PHASE 1 — ANALYSE
 * Student sees the full Part 4 question (S1 / KEY WORD / S2 with gap).
 * Below it, candidate phrases are shown as chips.
 * Tap to mark each chip IN (green, needed in the gap) or OUT (red, already
 * expressed in Sentence 1).
 * Submit → instant feedback on each chip.
 *
 * PHASE 2 — BUILD
 * Same question, gap now active.
 * The IN chips from the correct answer are shown as shuffled word tiles.
 * Student taps tiles in the right order to assemble the gap answer.
 * Submit → checks against all accepted answer strings.
 *
 * data.items = [
 *   {
 *     sentence1:      "She didn't go because she was feeling ill.",
 *     key:            "DESPITE",
 *     sentence2_start:"She didn't go to the party",
 *     sentence2_end:  "feeling well.",
 *     candidates: [
 *       { phrase: "despite not", needed: true  },
 *       { phrase: "because she was", needed: false },
 *       { phrase: "she was ill",    needed: false },
 *       { phrase: "feeling",        needed: false },
 *     ],
 *     answers: ["despite not"],   // all accepted gap strings, lowercase trimmed
 *     answer_display: "despite not"  // shown in feedback
 *   }
 * ]
 *
 * onNext(correct) — correct if overall score ≥ 60%
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

function normalise(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ')
}

// ── Exam question layout ───────────────────────────────────────────────────────

function ExamQuestion({ item, gapContent = null }) {
  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden">
      {/* Sentence 1 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sentence 1</p>
        <p className="text-sm text-gray-800 leading-relaxed">{item.sentence1}</p>
      </div>

      {/* Key word */}
      <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Key word</p>
        <p className="text-base font-black text-indigo-700 uppercase tracking-widest">{item.key}</p>
      </div>

      {/* Sentence 2 */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sentence 2</p>
        <p className="text-sm text-gray-800 leading-relaxed">
          {item.sentence2_start}{' '}
          {gapContent !== null ? (
            <span className="inline-block border-b-2 border-indigo-400 min-w-[80px] px-1 text-indigo-700 font-semibold">
              {gapContent || '        '}
            </span>
          ) : (
            <span className="inline-block border-b-2 border-indigo-300 min-w-[80px] text-center text-indigo-300 select-none">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          )}
          {' '}{item.sentence2_end}
        </p>
      </div>
    </div>
  )
}

// ── Phase 1 — Analyse ─────────────────────────────────────────────────────────

function AnalysePhase({ item, onComplete }) {
  const [tapped, setTapped] = useState({}) // phrase → 'in' | 'out'
  const [submitted, setSubmitted] = useState(false)
  const [shuffledCandidates] = useState(() => shuffle(item.candidates))

  const allTapped = shuffledCandidates.every(c => tapped[c.phrase])

  function handleTap(phrase) {
    if (submitted) return
    setTapped(prev => {
      const current = prev[phrase]
      // Cycle: untapped → 'in' → 'out' → untapped
      if (!current)        return { ...prev, [phrase]: 'in'  }
      if (current === 'in') return { ...prev, [phrase]: 'out' }
      return { ...prev, [phrase]: undefined }
    })
  }

  function handleSubmit() {
    setSubmitted(true)
    // After showing feedback, move to phase 2
    setTimeout(() => {
      onComplete()
    }, 2200)
  }

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-5">

      {/* Header */}
      <div className="flex-shrink-0">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Phase 1 — Analyse</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Tap each phrase: <span className="text-green-600 font-semibold">IN</span> = needed in the gap ·{' '}
          <span className="text-red-500 font-semibold">OUT</span> = already in Sentence 1
        </p>
      </div>

      {/* Exam question */}
      <ExamQuestion item={item} />

      {/* Candidate chips */}
      <div className="flex-1 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Which phrases go in the gap?
        </p>
        <div className="flex flex-wrap gap-2">
          {shuffledCandidates.map(c => {
            const state = tapped[c.phrase]
            let cls = 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'

            if (submitted) {
              // Show truth
              if (c.needed && state === 'in')   cls = 'border-green-400 bg-green-50 text-green-800'
              else if (!c.needed && state === 'out') cls = 'border-green-400 bg-green-50 text-green-800'
              else if (c.needed && state !== 'in')   cls = 'border-red-300 bg-red-50 text-red-700'
              else if (!c.needed && state !== 'out') cls = 'border-red-300 bg-red-50 text-red-700'
            } else {
              if (state === 'in')  cls = 'border-green-400 bg-green-50 text-green-700'
              if (state === 'out') cls = 'border-red-300 bg-red-50 text-red-700 line-through'
            }

            return (
              <button
                key={c.phrase}
                onClick={() => handleTap(c.phrase)}
                disabled={submitted}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${cls}`}
              >
                {submitted && c.needed && state !== 'in' && (
                  <span className="mr-1 text-red-400">✗</span>
                )}
                {submitted && c.needed && state === 'in' && (
                  <span className="mr-1 text-green-500">✓</span>
                )}
                {submitted && !c.needed && (
                  <span className={`mr-1 ${state === 'out' ? 'text-green-500' : 'text-red-400'}`}>
                    {state === 'out' ? '✓' : '✗'}
                  </span>
                )}
                <span className={!c.needed && !submitted && state === 'out' ? 'line-through' : ''}>
                  {c.phrase}
                </span>
                {!submitted && state === 'in'  && <span className="ml-1.5 text-xs text-green-500">IN</span>}
                {!submitted && state === 'out' && <span className="ml-1.5 text-xs text-red-400">OUT</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Submit */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allTapped}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl text-base disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all flex-shrink-0"
        >
          Check answers →
        </button>
      ) : (
        <div className="w-full py-4 rounded-2xl text-center font-bold text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
          Now build the answer… →
        </div>
      )}
    </div>
  )
}

// ── Phase 2 — Build ───────────────────────────────────────────────────────────

function BuildPhase({ item, onComplete }) {
  // Only the needed candidates become tiles
  const neededPhrases = item.candidates.filter(c => c.needed).map(c => c.phrase)
  const [tiles] = useState(() =>
    shuffle(neededPhrases).map((phrase, i) => ({ id: i, phrase, used: false }))
  )
  const [built, setBuilt]       = useState([]) // array of tile ids in order
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect]   = useState(false)

  const builtString = built.map(id => tiles.find(t => t.id === id)?.phrase).join(' ')
  const usedSet     = new Set(built)

  function tapTile(tile) {
    if (submitted) return
    if (usedSet.has(tile.id)) {
      // Remove from built (tap again to un-place)
      setBuilt(prev => prev.filter(id => id !== tile.id))
    } else {
      setBuilt(prev => [...prev, tile.id])
    }
  }

  function handleSubmit() {
    const norm = normalise(builtString)
    const isCorrect = item.answers.some(a => normalise(a) === norm)
    setCorrect(isCorrect)
    setSubmitted(true)
    setTimeout(() => onComplete(isCorrect), isCorrect ? 1200 : 2400)
  }

  function handleClear() {
    setBuilt([])
  }

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-5">

      {/* Header */}
      <div className="flex-shrink-0">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Phase 2 — Build the answer</p>
        <p className="text-xs text-gray-400 mt-0.5">Tap the tiles in the right order to fill the gap</p>
      </div>

      {/* Exam question with live gap */}
      <ExamQuestion item={item} gapContent={builtString} />

      {/* Tile bank */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {tiles.map(tile => {
            const isUsed = usedSet.has(tile.id)
            return (
              <button
                key={tile.id}
                onClick={() => tapTile(tile)}
                disabled={submitted}
                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                  submitted
                    ? correct
                      ? 'border-green-400 bg-green-50 text-green-800'
                      : isUsed
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    : isUsed
                      ? 'border-indigo-400 bg-indigo-100 text-indigo-700 opacity-40'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {tile.phrase}
              </button>
            )
          })}
        </div>

        {/* Clear button */}
        {built.length > 0 && !submitted && (
          <button
            onClick={handleClear}
            className="self-start text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            ✕ Clear
          </button>
        )}

        {/* Feedback */}
        {submitted && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-semibold border ${
            correct
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {correct
              ? '✓ Correct!'
              : `✗ Answer: ${item.answer_display || item.answers[0]}`
            }
          </div>
        )}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={built.length === 0}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl text-base disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all flex-shrink-0"
        >
          Submit answer
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TransformAnalyserScreen({ data, onNext }) {
  const { items = [], title = 'Transform Analyser' } = data

  const [idx, setIdx]         = useState(0)
  const [phase, setPhase]     = useState(1) // 1 = analyse, 2 = build
  const [results, setResults] = useState([])
  const [done, setDone]       = useState(false)

  const current = items[idx]

  function handleAnalyseDone() {
    setPhase(2)
  }

  function handleBuildDone(correct) {
    const newResults = [...results, { correct, item: current }]
    setResults(newResults)

    if (idx >= items.length - 1) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setPhase(1)
    }
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (done) {
    const correctCount = results.filter(r => r.correct).length
    const pct = Math.round((correctCount / items.length) * 100)

    return (
      <div className="flex flex-col h-full px-6 py-8 items-center justify-center gap-6">
        <div className="text-5xl">{pct >= 90 ? '🎯' : pct >= 70 ? '💪' : '📚'}</div>
        <p className="text-2xl font-black text-gray-900">Transformations done!</p>

        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-black text-green-600">{correctCount}</p>
            <p className="text-xs text-gray-500 mt-1">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-red-400">{items.length - correctCount}</p>
            <p className="text-xs text-gray-500 mt-1">Wrong</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-indigo-600">{pct}%</p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
        </div>

        {/* Recap */}
        <div className="w-full space-y-3 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className={`px-4 py-3 rounded-xl border text-sm ${
              r.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                <span className={`font-bold flex-shrink-0 ${r.correct ? 'text-green-600' : 'text-red-500'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <div>
                  <p className="font-bold text-gray-700 uppercase tracking-wide text-xs mb-0.5">
                    {r.item.key}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {r.item.sentence2_start}{' '}
                    <span className="font-bold text-indigo-700">
                      [{r.item.answer_display || r.item.answers[0]}]
                    </span>{' '}
                    {r.item.sentence2_end}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

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

  // ── Header dots ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Progress dots */}
      <div className="flex items-center justify-between px-6 pt-4 flex-shrink-0">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">{title}</p>
        <div className="flex gap-1.5 items-center">
          {items.map((_, i) => (
            <div key={i} className={`transition-all rounded-full ${
              i < idx
                ? results[i]?.correct ? 'w-2 h-2 bg-green-400' : 'w-2 h-2 bg-red-300'
                : i === idx
                  ? `w-3 h-3 ${phase === 1 ? 'bg-indigo-300' : 'bg-indigo-600'}`
                  : 'w-2 h-2 bg-gray-200'
            }`} />
          ))}
          {/* Phase indicator */}
          <span className="ml-2 text-xs text-gray-400">{phase}/2</span>
        </div>
      </div>

      {/* Phase content */}
      <div className="flex-1 overflow-hidden">
        {phase === 1
          ? <AnalysePhase key={`analyse-${idx}`} item={current} onComplete={handleAnalyseDone} />
          : <BuildPhase   key={`build-${idx}`}   item={current} onComplete={handleBuildDone}   />
        }
      </div>
    </div>
  )
}
