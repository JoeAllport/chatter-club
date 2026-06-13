/**
 * CohesionDetectorScreen — Part 6 cohesion device identifier.
 *
 * Two sentences are shown. Student taps the TYPE of linking device
 * that connects them, then taps the specific word/phrase that does it.
 *
 * Cohesion types tested:
 *   pronoun_reference — it / they / this / these / which / who / whose
 *   time_marker       — then / after / previously / subsequently / at that point
 *   contrast          — however / nevertheless / despite this / on the other hand
 *   topic_continuity  — the same / similarly / likewise / in the same way
 *   result            — as a result / therefore / consequently / this meant that
 *   addition          — furthermore / in addition / what is more / moreover
 *   example           — for instance / for example / such as / in particular
 *
 * Two phases per item:
 *   Phase 1 — tap the cohesion TYPE (category label)
 *   Phase 2 — tap the specific WORD or PHRASE highlighted in sentence B
 *             that creates the link (shown as chips)
 *
 * data.items = [
 *   {
 *     sentence_a: "The manager introduced a new policy last week.",
 *     sentence_b: "However, most employees were unhappy with the change.",
 *     link_type:  "contrast",
 *     link_word:  "However",
 *     link_chips: ["However", "most employees", "unhappy", "the change"],
 *     explanation: "'However' signals a contrast with what was introduced in the previous sentence."
 *   }
 * ]
 *
 * onNext(correct) — correct if ≥ 60% of link_type + link_word both correct
 */

import { useState } from 'react'

const COHESION_TYPES = [
  { id: 'pronoun_reference', label: 'Pronoun reference', icon: '👉', desc: 'it / they / this / which' },
  { id: 'time_marker',       label: 'Time marker',       icon: '⏱️', desc: 'then / after / subsequently' },
  { id: 'contrast',          label: 'Contrast',          icon: '↔️', desc: 'however / despite / on the other hand' },
  { id: 'topic_continuity',  label: 'Topic continuity',  icon: '🔗', desc: 'similarly / likewise / in the same way' },
  { id: 'result',            label: 'Result',            icon: '➡️', desc: 'therefore / as a result / consequently' },
  { id: 'addition',          label: 'Addition',          icon: '➕', desc: 'furthermore / moreover / in addition' },
  { id: 'example',           label: 'Example',           icon: '💡', desc: 'for instance / such as / in particular' },
]

export default function CohesionDetectorScreen({ data, onNext }) {
  const { items = [], title = 'Cohesion Detector' } = data

  const [idx, setIdx]             = useState(0)
  const [phase, setPhase]         = useState(1)       // 1 = type, 2 = word
  const [selectedType, setSelectedType] = useState(null)
  const [selectedWord, setSelectedWord] = useState(null)
  const [results, setResults]     = useState([])
  const [done, setDone]           = useState(false)

  const current = items[idx]

  function handleTypeSelect(typeId) {
    if (selectedType) return
    setSelectedType(typeId)
    setTimeout(() => setPhase(2), typeId === current.link_type ? 800 : 1400)
  }

  function handleWordSelect(word) {
    if (selectedWord) return
    setSelectedWord(word)
    const typeCorrect = selectedType === current.link_type
    const wordCorrect = word === current.link_word
    const correct = typeCorrect && wordCorrect

    setTimeout(() => {
      const newResults = [...results, { correct, typeCorrect, wordCorrect, item: current }]
      setResults(newResults)
      if (idx >= items.length - 1) {
        setDone(true)
      } else {
        setIdx(i => i + 1)
        setPhase(1)
        setSelectedType(null)
        setSelectedWord(null)
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
        <p className="text-2xl font-black text-gray-900">Cohesion Detector done!</p>

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
          <div className="w-full space-y-2 max-h-56 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</p>
            {results.map((r, i) => !r.correct && (
              <div key={i} className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs">
                <p className="font-bold text-gray-700 mb-1 text-sm">"{r.item.sentence_b}"</p>
                <p className="text-green-700 font-semibold">
                  ✓ {COHESION_TYPES.find(t => t.id === r.item.link_type)?.label} —
                  <span className="italic ml-1">"{r.item.link_word}"</span>
                </p>
                {r.item.explanation && (
                  <p className="text-gray-400 mt-1 italic">{r.item.explanation}</p>
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

  const correctTypeObj = COHESION_TYPES.find(t => t.id === current.link_type)

  // ── Game ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full px-6 py-6 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{idx + 1} of {items.length} · Phase {phase}/2</p>
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

      {/* Two sentences */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {/* Sentence A */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-bold text-gray-400 mb-1">Sentence A</p>
          <p className="text-sm text-gray-700 leading-relaxed">{current.sentence_a}</p>
        </div>

        {/* Link arrow */}
        <div className="flex items-center justify-center">
          <div className="w-px h-4 bg-teal-200" />
          <div className="text-teal-400 text-xs mx-2">connects to ↓</div>
          <div className="w-px h-4 bg-teal-200" />
        </div>

        {/* Sentence B — link word highlighted if phase 2 */}
        <div className="rounded-xl border-2 border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-xs font-bold text-teal-500 mb-1">Sentence B</p>
          <p className="text-sm text-gray-800 leading-relaxed">
            {phase === 2
              ? current.sentence_b.split(new RegExp(`(${current.link_chips.join('|')})`, 'i')).map((part, i) =>
                  current.link_chips.some(c => c.toLowerCase() === part.toLowerCase())
                    ? <span key={i} className="bg-teal-200 text-teal-800 font-semibold px-0.5 rounded">{part}</span>
                    : <span key={i}>{part}</span>
                )
              : current.sentence_b
            }
          </p>
        </div>
      </div>

      {/* Phase 1 — pick the type */}
      {phase === 1 && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">
            What type of link connects these sentences?
          </p>
          {COHESION_TYPES.map(type => {
            const isSelected = selectedType === type.id
            const isCorrect  = type.id === current.link_type

            let cls = 'border-gray-200 bg-white hover:border-teal-300'
            if (selectedType) {
              if (isCorrect)        cls = 'border-green-400 bg-green-50'
              else if (isSelected)  cls = 'border-red-300 bg-red-50'
              else                  cls = 'border-gray-100 bg-gray-50 opacity-40'
            }

            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                disabled={!!selectedType}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${cls}`}
              >
                <span className="text-lg flex-shrink-0">{type.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{type.label}</p>
                  <p className="text-xs text-gray-400">{type.desc}</p>
                </div>
                {selectedType && isCorrect && <span className="ml-auto text-green-500">✓</span>}
                {selectedType && isSelected && !isCorrect && <span className="ml-auto text-red-400">✗</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Phase 2 — pick the word */}
      {phase === 2 && (
        <div className="flex-1 flex flex-col gap-4">
          {/* Type result */}
          <div className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 flex-shrink-0 ${
            selectedType === current.link_type
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span>{correctTypeObj?.icon}</span>
            <span>
              {selectedType === current.link_type
                ? `✓ ${correctTypeObj?.label}`
                : `The link type is: ${correctTypeObj?.label}`
              }
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">
            Which word or phrase creates the link?
          </p>

          <div className="flex flex-wrap gap-2.5">
            {current.link_chips.map((chip, i) => {
              const isSelected = selectedWord === chip
              const isCorrect  = chip === current.link_word

              let cls = 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
              if (selectedWord) {
                if (isCorrect)        cls = 'border-green-400 bg-green-50 text-green-800'
                else if (isSelected)  cls = 'border-red-300 bg-red-50 text-red-700'
                else                  cls = 'border-gray-100 bg-gray-50 text-gray-300'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleWordSelect(chip)}
                  disabled={!!selectedWord}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${cls}`}
                >
                  {chip}
                  {selectedWord && isCorrect && <span className="ml-1.5 text-green-500">✓</span>}
                  {selectedWord && isSelected && !isCorrect && <span className="ml-1.5 text-red-400">✗</span>}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {selectedWord && current.explanation && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-xs text-teal-800 leading-relaxed">
              {current.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
